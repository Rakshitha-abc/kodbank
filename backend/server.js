const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'],
    credentials: true
}));


let pool = mysql.createPool(process.env.DB_URI);

const ensureDb = async (req, res, next) => {
    try {
        if (!pool) pool = mysql.createPool(process.env.DB_URI);
        next();
    } catch (err) {
        res.status(500).json({ message: 'Database connection error', error: err.message });
    }
};

app.use(ensureDb);

// Vercel path normalization: strip /api from the start of the path
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        req.url = req.url.slice(4);
    }
    next();
});

app.get('/health', (req, res) => res.json({ status: 'ok', db: !!pool }));

// Middleware to verify JWT
const authenticate = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Endpoints
app.post('/register', async (req, res) => {
    const { uname, uemail, phone, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (uname, uemail, phone, password) VALUES (?, ?, ?, ?)',
            [uname, uemail, phone, hashedPassword]
        );
        res.status(201).json({ message: 'Registration success' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Email already exists' });
        }
        res.status(500).json({ message: 'Registration failed', error: err.message });
    }
});

app.post('/login', async (req, res) => {
    const { uemail, password } = req.body;
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE uemail = ?', [uemail]);
        if (rows.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ uid: user.uid, uemail: user.uemail, uname: user.uname }, JWT_SECRET, { expiresIn: '1h' });
        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax' });
        res.json({ message: 'Login success', user: { uname: user.uname, uemail: user.uemail } });
    } catch (err) {
        res.status(500).json({ message: 'Login failed', error: err.message });
    }
});

app.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

app.get('/balance', authenticate, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT balance, uname, uemail, phone FROM users WHERE uid = ?', [req.user.uid]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch balance', error: err.message });
    }
});

app.post('/transfer', authenticate, async (req, res) => {
    const { recipientEmail, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ message: 'Invalid amount' });

    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [sender] = await connection.query('SELECT balance FROM users WHERE uid = ? FOR UPDATE', [req.user.uid]);
        if (sender[0].balance < (parseFloat(amount))) throw new Error('Insufficient balance');

        const [recipient] = await connection.query('SELECT uid FROM users WHERE uemail = ? FOR UPDATE', [recipientEmail]);
        if (recipient.length === 0) throw new Error('Recipient not found');

        await connection.query('UPDATE users SET balance = balance - ? WHERE uid = ?', [amount, req.user.uid]);
        await connection.query('UPDATE users SET balance = balance + ? WHERE uid = ?', [amount, recipient[0].uid]);

        await connection.commit();
        res.json({ message: 'Transfer successful' });
    } catch (err) {
        if (connection) await connection.rollback();
        res.status(400).json({ message: err.message });
    } finally {
        if (connection) connection.release();
    }
});

app.post('/change-password', authenticate, async (req, res) => {
    const { newPassword } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password = ? WHERE uid = ?', [hashedPassword, req.user.uid]);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update password', error: err.message });
    }
});

const startServer = async () => {
    try {
        console.log('--- Server Start Process ---');
        console.log('DB_URI length:', process.env.DB_URI?.length || 0);

        const connection = await pool.getConnection();
        console.log('DB Connected!');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                uid INT AUTO_INCREMENT PRIMARY KEY,
                uname VARCHAR(255) NOT NULL,
                uemail VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(20),
                password VARCHAR(255) NOT NULL,
                balance DECIMAL(10, 2) DEFAULT 1000.00
            )
        `);
        console.log('Table verified');
        connection.release();
        app.listen(PORT, () => {
            console.log(`Server UP: http://localhost:${PORT}`);
        });

    } catch (err) {
        console.error('FATAL STARTUP ERROR:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
};

if (require.main === module) {
    startServer();
}

module.exports = app;
