const http = require('http');

function request(url, method, headers, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + (parsedUrl.search || ''),
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function run() {
  try {
    console.log("1. Logging in as Admin...");
    const loginRes = await request('http://localhost:8081/api/account/login', 'POST', {}, {
      username: 'Admin',
      password: 'admin123',
      tenantId: 'AUTONOMA',
      divisionId: 1
    });
    console.log("Login Status:", loginRes.statusCode);

    if (loginRes.statusCode !== 200) {
      throw new Error("Login failed!");
    }

    const loginData = JSON.parse(loginRes.data);
    const token = loginData.serviceToken;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'X-Tenant-ID': 'AUTONOMA',
      'X-Division-ID': '1'
    };

    console.log("\n2. Creating a new holiday without holidayCode or toDate...");
    const payload = {
      holidayName: 'Test Single Day Holiday',
      fromDate: '2026-10-25',
      holidayType: 'COMPANY',
      description: 'Single day test description'
    };
    const createRes = await request('http://localhost:8081/api/master/hr/holidays', 'POST', authHeaders, payload);
    console.log("Create Status:", createRes.statusCode);
    if (createRes.statusCode !== 200 && createRes.statusCode !== 201) {
      console.error("Create failed response data:", createRes.data);
      throw new Error("Create holiday failed!");
    }
    const createdHoliday = JSON.parse(createRes.data);
    console.log("Created Holiday Object:", createdHoliday);

    console.log("\n3. Querying holidays for year 2026...");
    const queryRes = await request('http://localhost:8081/api/master/hr/holidays?year=2026', 'GET', authHeaders);
    console.log("Query Status:", queryRes.statusCode);
    const holidays = JSON.parse(queryRes.data);
    console.log(`Holidays found for 2026: ${holidays.length}`);
    holidays.forEach(h => {
       console.log(`- ID: ${h.holidayId}, Name: ${h.holidayName}, Date: ${h.holidayDate || h.fromDate}, Year: ${h.holidayYear} (Code field present: ${'holidayCode' in h}, ToDate field present: ${'toDate' in h})`);
    });

    if (createdHoliday.holidayId) {
      console.log(`\n4. Cleaning up: Deleting holiday with ID ${createdHoliday.holidayId}...`);
      const deleteRes = await request(`http://localhost:8081/api/master/hr/holidays/${createdHoliday.holidayId}`, 'DELETE', authHeaders);
      console.log("Delete Status:", deleteRes.statusCode);
    }
    
    console.log("\nTest run completed successfully!");
  } catch (error) {
    console.error("Test execution failed:", error);
  }
}

run();
