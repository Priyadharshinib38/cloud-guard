// Comprehensive Automated API Test Suite for CloudGuard Backend
const BASE_URL = 'http://localhost:5000/api';

let authToken = '';
let sampleFindingId = '';
let newScanId = '';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🛡️  Starting CloudGuard Backend API Test Suite...\n');

  // Test 1: Health check
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const data = await res.json();
    assert(res.status === 200 && data.status === 'ok', 'Health Check endpoint (/api/health)');
  } catch (err) {
    assert(false, `Health Check failed: ${err.message}`);
  }

  // Test 2: Login with valid credentials
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cloudguard.com', password: 'password' })
    });
    const data = await res.json();
    assert(res.status === 200 && data.success && data.token && data.user.email === 'admin@cloudguard.com', 'Valid Login (POST /api/login)');
    authToken = data.token;
  } catch (err) {
    assert(false, `Valid login failed: ${err.message}`);
  }

  // Test 3: Login with invalid password (401)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cloudguard.com', password: 'wrongpassword' })
    });
    assert(res.status === 401, 'Invalid Password handled with 401');
  } catch (err) {
    assert(false, `Invalid password check failed: ${err.message}`);
  }

  // Test 4: Login with missing body (400)
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    assert(res.status === 400, 'Missing Credentials handled with 400');
  } catch (err) {
    assert(false, `Missing credentials check failed: ${err.message}`);
  }

  // Test 5: Get Dashboard metrics
  try {
    const res = await fetch(`${BASE_URL}/dashboard`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      typeof data.totalScans === 'number' &&
      typeof data.critical === 'number' &&
      typeof data.securityScore === 'number',
      'Dashboard Metrics (GET /api/dashboard)'
    );
  } catch (err) {
    assert(false, `Dashboard check failed: ${err.message}`);
  }

  // Test 6: Initiate Scan
  try {
    const res = await fetch(`${BASE_URL}/scans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ provider: 'AWS' })
    });
    const data = await res.json();
    assert(
      res.status === 201 &&
      data.success &&
      data.scanId &&
      (data.status === 'completed' || data.status === 'started'),
      'Initiate Cloud Scan (POST /api/scans)'
    );
    newScanId = data.scanId;
  } catch (err) {
    assert(false, `Scan creation failed: ${err.message}`);
  }

  // Test 7: Get Scan Status
  try {
    const res = await fetch(`${BASE_URL}/scans/${newScanId}/status`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.scanId === newScanId && data.status, 'Scan Status Check (GET /api/scans/:id/status)');
  } catch (err) {
    assert(false, `Scan status check failed: ${err.message}`);
  }

  // Test 8: Get Findings List
  try {
    const res = await fetch(`${BASE_URL}/findings`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      Array.isArray(data.data) &&
      data.data.length > 0,
      'Get All Findings (GET /api/findings)'
    );
    sampleFindingId = data.data[0].id;
  } catch (err) {
    assert(false, `Get findings failed: ${err.message}`);
  }

  // Test 9: Filter Findings by Severity
  try {
    const res = await fetch(`${BASE_URL}/findings?severity=Critical`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    const allCritical = data.data.every(f => f.severity.toLowerCase() === 'critical');
    assert(res.status === 200 && allCritical, 'Filter Findings by Severity (GET /api/findings?severity=Critical)');
  } catch (err) {
    assert(false, `Filter severity failed: ${err.message}`);
  }

  // Test 10: Search Findings
  try {
    const res = await fetch(`${BASE_URL}/findings?search=bucket`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && data.data.length > 0, 'Search Findings Query (GET /api/findings?search=bucket)');
  } catch (err) {
    assert(false, `Search findings failed: ${err.message}`);
  }

  // Test 11: Get Finding Details
  try {
    const res = await fetch(`${BASE_URL}/findings/${sampleFindingId}`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && (data.id === sampleFindingId || data.data.id === sampleFindingId), 'Get Finding Details (GET /api/findings/:id)');
  } catch (err) {
    assert(false, `Finding details failed: ${err.message}`);
  }

  // Test 12: Gemini AI Explanation
  try {
    const res = await fetch(`${BASE_URL}/findings/${sampleFindingId}/explanation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ id: sampleFindingId })
    });
    const data = await res.json();
    assert(
      res.status === 200 &&
      data.success &&
      typeof data.explanation === 'string' &&
      typeof data.recommendation === 'string',
      'Gemini AI Explanation (POST /api/findings/:id/explanation)'
    );
  } catch (err) {
    assert(false, `Gemini explanation failed: ${err.message}`);
  }

  // Test 13: Reports List
  try {
    const res = await fetch(`${BASE_URL}/reports`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    assert(res.status === 200 && Array.isArray(data.data) && data.data.length > 0, 'Get Reports (GET /api/reports)');
  } catch (err) {
    assert(false, `Get reports failed: ${err.message}`);
  }

  // Test 14: Resource Not Found (404)
  try {
    const res = await fetch(`${BASE_URL}/nonexistent-route-xyz`);
    assert(res.status === 404, '404 Not Found error handler');
  } catch (err) {
    assert(false, `404 check failed: ${err.message}`);
  }

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
