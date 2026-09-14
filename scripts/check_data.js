const axios = require('axios');

async function testAPI() {
    try {
        // Authenticate as admin
        const loginRes = await axios.post('http://localhost:8081/api/v1/auth/login', {
            username: 'admin',
            password: 'password' // Assuming default password, or let's just query without token if it's public
        });
        const token = loginRes.data.token;

        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        // Fetch Negotiations
        const negRes = await axios.get('http://localhost:8081/api/v1/purchase/negotiation/division/1', config);
        console.log("Negotiations:", negRes.data.length);
        
        // Fetch Gate Entries
        const gateRes = await axios.get('http://localhost:8081/api/v1/purchase/gate-entry/division/1', config);
        console.log("Gate Entries:", gateRes.data.length);

    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
testAPI();
