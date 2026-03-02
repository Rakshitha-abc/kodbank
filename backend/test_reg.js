async function test() {
    try {
        const res = await fetch('http://127.0.0.1:5000/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uname: 'Test User',
                uemail: 'test@kodbank.com',
                phone: '1234567890',
                password: 'password123'
            })
        });
        const data = await res.json();
        console.log('Registration Status:', res.status, data);
    } catch (err) {
        console.error('Test Failed:', err.message);
    }
}
test();
