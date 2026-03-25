import fetch from 'node-fetch';

async function testAPI() {
    const baseUrl = 'http://localhost:5006/api';

    console.log("--- Testing Auth ---");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sarah@example.com', password: 'password123' }) // Assuming this user exists or I'll create one
    });

    const loginData = await loginRes.json();
    if (!loginRes.ok) {
        console.log("Login failed (expected if user doesn't exist, will try register)");
        const regRes = await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'sarah_test', email: 'sarah@example.com', password: 'password123' })
        });
        console.log("Register status:", regRes.status);
    } else {
        const token = loginData.token;
        console.log("Login successful, testing history...");

        const histRes = await fetch(`${baseUrl}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ topic: 'Test Topic ' + Date.now() })
        });

        console.log("History POST status:", histRes.status);
        const histData = await histRes.json();
        console.log("History POST data:", JSON.stringify(histData).substring(0, 100));

        const getHist = await fetch(`${baseUrl}/history`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const allHist = await getHist.json();
        console.log("History GET count:", allHist.length);
    }
}

testAPI();
