import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  Wallet,
  Send,
  Lock,
  LogOut,
  User as UserIcon,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const API_BASE_URL = 'http://localhost:5000';
axios.defaults.withCredentials = true;

// Components
const Login = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE_URL}/login`, { uemail: email, password });
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Kodbank</h1>
        <p>Enter your details to access your account</p>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn">Sign In</button>
        </form>
        <div className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  );
};

const Register = () => {
  const [formData, setFormData] = useState({ uname: '', uemail: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/register`, formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h1>Join Kodbank</h1>
        <p>Experience minimalistic banking</p>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={formData.uname} onChange={(e) => setFormData({ ...formData, uname: e.target.value })} required placeholder="John Doe" />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" value={formData.uemail} onChange={(e) => setFormData({ ...formData, uemail: e.target.value })} required placeholder="name@example.com" />
          </div>
          <div className="form-group">
            <label>Phone Number</label>
            <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+1 (555) 000-0000" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required placeholder="••••••••" />
          </div>
          <button type="submit" className="btn">Create Account</button>
        </form>
        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ user, handleLogout }) => {
  const [balanceData, setBalanceData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBalance();
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/balance`);
      setBalanceData(res.data);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const menuItems = [
    { title: 'Overview', path: '/dashboard', icon: TrendingUp },
    { title: 'Transfer', path: '/dashboard/transfer', icon: Send },
    { title: 'Security', path: '/dashboard/password', icon: Lock },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <h2>Kodbank</h2>
        <nav>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.title}
            </Link>
          ))}
          <button onClick={handleLogout} className="nav-item" style={{ marginTop: 'auto', width: '100%', border: 'none', background: 'none', cursor: 'pointer', textAlign: 'left' }}>
            <LogOut size={18} />
            Logout
          </button>
        </nav>
      </aside>
      <main className="main-content">
        <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '700' }}>Welcome, {user?.uname}</h1>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>Here's what's happening with your account today.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 1rem', background: '#fff', borderRadius: '50px', border: '1px solid var(--border)' }}>
            <UserIcon size={18} />
            <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{user?.uemail}</span>
          </div>
        </header>

        <Routes>
          <Route path="/" element={
            <div className="card stats-card">
              <span className="stats-label">Available Balance</span>
              <h2 className="stats-value">${balanceData?.balance?.toLocaleString()}</h2>
              <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '0.875rem' }}>
                  <p style={{ color: 'var(--secondary)' }}>Card Number</p>
                  <p style={{ fontWeight: '600' }}>•••• •••• •••• 4242</p>
                </div>
                <Wallet color="var(--secondary)" />
              </div>
            </div>
          } />
          <Route path="/transfer" element={<Transfer fetchBalance={fetchBalance} />} />
          <Route path="/password" element={<ChangePassword />} />
        </Routes>
      </main>
    </div>
  );
};

const Transfer = ({ fetchBalance }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await axios.post(`${API_BASE_URL}/transfer`, { recipientEmail: recipient, amount });
      setSuccess('Transfer successful!');
      setRecipient('');
      setAmount('');
      fetchBalance();
    } catch (err) {
      setError(err.response?.data?.message || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Transfer Funds</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleTransfer}>
        <div className="form-group">
          <label>Recipient Email</label>
          <input type="email" value={recipient} onChange={(e) => setRecipient(e.target.value)} required placeholder="name@example.com" />
        </div>
        <div className="form-group">
          <label>Amount ($)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required placeholder="0.00" min="0.01" step="0.01" />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Processing...' : 'Send Money'}
        </button>
      </form>
    </div>
  );
};

const ChangePassword = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }
    try {
      await axios.post(`${API_BASE_URL}/change-password`, { newPassword });
      setSuccess('Password updated successfully');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
    }
  };

  return (
    <div className="card" style={{ maxWidth: '500px' }}>
      <h2 style={{ marginBottom: '1.5rem' }}>Change Password</h2>
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
      <form onSubmit={handleUpdate}>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <div className="form-group">
          <label>Confirm Password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="••••••••" />
        </div>
        <button type="submit" className="btn">Update Password</button>
      </form>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    axios.get(`${API_BASE_URL}/balance`)
      .then(res => {
        setUser({ uname: res.data.uname, uemail: res.data.uemail });
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleLogout = async () => {
    await axios.post(`${API_BASE_URL}/logout`);
    setUser(null);
  };

  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login setUser={setUser} />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard/*" element={user ? <Dashboard user={user} handleLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
