import fetch from 'node-fetch';

const BACKEND_URL = 'https://agenticai-backend-xao9.onrender.com';
let token = '';
let agentId = '';
let apiKey = '';
let firstPublishedAgentId = '';
let proposalId = '';

async function runTest(name: string, path: string, method: string, body?: any, headers: any = {}, expectedStatus?: number, additionalCheck?: (data: any, status: number) => boolean) {
  try {
    const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;
    const options: any = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const res = await fetch(url, options);
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = text;
    }

    let passed = true;
    if (expectedStatus && res.status !== expectedStatus) {
      passed = false;
    }
    if (passed && additionalCheck) {
      passed = additionalCheck(data, res.status);
    }

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
    if (!passed) {
      console.log(`  Expected Status: ${expectedStatus}, Got: ${res.status}`);
      console.log(`  Response:`, data);
    }
    return { passed, status: res.status, data, res };
  } catch (error: any) {
    console.log(`[FAIL] ${name} - Exception: ${error.message}`);
    return { passed: false, error };
  }
}

async function main() {
  console.log('--- AUTH TESTS ---');
  await runTest('Signup', '/api/auth/signup', 'POST', { email: "test_qa@agenticai.dev", password: "QATest@1234", name: "QA Tester" }, {}, 201);
  await runTest('Login unverified', '/api/auth/login', 'POST', { email: "test_qa@agenticai.dev", password: "QATest@1234" }, {}, 401, (d) => d.code === 'EMAIL_NOT_VERIFIED' || !d.success);
  
  const loginRes = await runTest('Login verified seeded', '/api/auth/login', 'POST', { email: "alice@agenticai.dev", password: "Demo@1234" }, {}, 200, (d) => !!d.data?.token);
  if (loginRes.data?.data?.token) {
    token = loginRes.data.data.token;
  }

  await runTest('Get me with token', '/api/auth/me', 'GET', null, { Authorization: `Bearer ${token}` }, 200, (d) => d.data?.email === 'alice@agenticai.dev');
  await runTest('Login wrong password', '/api/auth/login', 'POST', { email: "alice@agenticai.dev", password: "wrongpassword" }, {}, 401, (d) => d.code === 'INVALID_CREDENTIALS' || !d.success);
  await runTest('Get me no token', '/api/auth/me', 'GET', null, {}, 401, (d) => d.code === 'NO_TOKEN' || !d.success);
  await runTest('Forgot password', '/api/auth/forgot-password', 'POST', { email: "alice@agenticai.dev" }, {}, 200);

  console.log('\n--- RATE LIMITING TESTS ---');
  let rateLimited = false;
  for (let i = 0; i < 6; i++) {
    const r = await runTest(`Rapid login ${i+1}`, '/api/auth/login', 'POST', { email: "alice@agenticai.dev", password: "wrongpassword" });
    if (r.status === 429) rateLimited = true;
  }
  console.log(`Rate limiting triggered: ${rateLimited ? 'yes' : 'no'}`);

  console.log('\n--- MARKETPLACE TESTS ---');
  const marketRes = await runTest('Get marketplace', '/api/marketplace', 'GET', null, {}, 200);
  console.log(`Agents returned: ${marketRes.data?.data?.length || 0}`);
  if (marketRes.data?.data?.length > 0) {
    firstPublishedAgentId = marketRes.data.data[0].id;
  }

  await runTest('Marketplace search DataMind', '/api/marketplace?search=DataMind', 'GET', null, {}, 200);
  await runTest('Marketplace category DATA_ANALYST', '/api/marketplace?category=DATA_ANALYST', 'GET', null, {}, 200);
  await runTest('Marketplace sort rating', '/api/marketplace?sort=rating', 'GET', null, {}, 200);
  if (firstPublishedAgentId) {
    await runTest('Marketplace agent detail', `/api/marketplace/${firstPublishedAgentId}`, 'GET', null, {}, 200);
  }

  console.log('\n--- AGENT TESTS ---');
  await runTest('Get alice agents', '/api/agents', 'GET', null, { Authorization: `Bearer ${token}` }, 200);
  
  const createRes = await runTest('Create agent', '/api/agents', 'POST', {
    name: "QA Test Agent", slug: `qa-test-agent-${Date.now()}`, description: "Test agent for QA", category: "CHATBOT",
    modelProvider: "google", modelName: "gemini-1.5-flash", systemPrompt: "You are a helpful assistant.", pricingModel: "FREE", isPublic: false
  }, { Authorization: `Bearer ${token}` }, 201);
  
  if (createRes.data?.data?.id) {
    agentId = createRes.data.data.id;
  }

  if (agentId) {
    await runTest('Get agent details', `/api/agents/${agentId}`, 'GET', null, { Authorization: `Bearer ${token}` }, 200);
    await runTest('Update agent', `/api/agents/${agentId}`, 'PUT', { description: "Updated description for QA" }, { Authorization: `Bearer ${token}` }, 200);
    await runTest('Publish agent', `/api/agents/${agentId}/publish`, 'POST', null, { Authorization: `Bearer ${token}` }, 200);
    const chatRes = await runTest('Chat with agent', `/api/agents/${agentId}/chat`, 'POST', { message: "Hello, say hi back in one sentence" }, { Authorization: `Bearer ${token}` }, 200);
    console.log(`AI responded: ${chatRes.data?.data?.response ? 'yes' : 'no'}, Response preview: ${chatRes.data?.data?.response?.substring(0, 50)}`);
  }

  console.log('\n--- INVOCATION TESTS ---');
  const keyRes = await runTest('Create API key', '/api/keys', 'POST', { name: "QA Test Key" }, { Authorization: `Bearer ${token}` }, 200);
  if (keyRes.data?.data?.key) {
    apiKey = keyRes.data.data.key;
  } else if (keyRes.data?.key) {
    apiKey = keyRes.data.key;
  }

  if (apiKey && agentId) {
    const invokeRes = await runTest('Invoke agent via key', `/api/invoke/${agentId}`, 'POST', { message: "What is 2+2?" }, { 'X-API-Key': apiKey }, 200);
    console.log(`Invoke response received: ${invokeRes.data?.data?.response || invokeRes.data?.response ? 'yes' : 'no'}`);
  }

  console.log('\n--- STAKING TESTS (as bob) ---');
  const bobLogin = await runTest('Login as bob', '/api/auth/login', 'POST', { email: "bob@agenticai.dev", password: "Demo@1234" });
  const bobToken = bobLogin.data?.data?.token || bobLogin.data?.token;
  
  await runTest('Get staking positions', '/api/staking/positions', 'GET', null, { Authorization: `Bearer ${bobToken}` }, 200);
  if (firstPublishedAgentId) {
    await runTest('Create stake', '/api/staking/stake', 'POST', { agentId: firstPublishedAgentId, amount: 10 }, { Authorization: `Bearer ${bobToken}` });
  }
  await runTest('Get rewards', '/api/staking/rewards', 'GET', null, { Authorization: `Bearer ${bobToken}` }, 200);

  console.log('\n--- GOVERNANCE TESTS ---');
  const propRes = await runTest('Get proposals', '/api/governance/proposals', 'GET', null, {}, 200);
  console.log(`Proposals returned: ${propRes.data?.data?.length || 0}`);
  if (propRes.data?.data?.length > 0) {
    proposalId = propRes.data.data[0].id;
    await runTest('Get proposal details', `/api/governance/proposals/${proposalId}`, 'GET', null, {}, 200);
    await runTest('Vote on proposal', `/api/governance/proposals/${proposalId}/vote`, 'POST', { choice: "FOR" }, { Authorization: `Bearer ${bobToken}` });
  }

  console.log('\n--- BILLING TESTS ---');
  await runTest('Get balance', '/api/billing/balance', 'GET', null, { Authorization: `Bearer ${token}` }, 200);
  await runTest('Get transactions', '/api/billing/transactions', 'GET', null, { Authorization: `Bearer ${token}` }, 200);

  console.log('\n--- NODE TESTS ---');
  const nodesRes = await runTest('Get nodes', '/api/nodes', 'GET', null, { Authorization: `Bearer ${token}` }, 200);
  console.log(`Nodes returned: ${nodesRes.data?.data?.length || 0}`);

  console.log('\n--- MONITORING TESTS ---');
  const logsRes = await runTest('Get logs', '/api/monitoring/logs', 'GET', null, { Authorization: `Bearer ${token}` }, 200);
  console.log(`Logs returned: ${logsRes.data?.data?.length || 0}`);
  if (agentId) {
    await runTest('Get metrics', `/api/monitoring/metrics/${agentId}`, 'GET', null, { Authorization: `Bearer ${token}` }, 200);
  }

  console.log('\n--- STATS TEST ---');
  const statsRes = await runTest('Get stats', '/api/stats', 'GET', null, {}, 200);
  console.log(`Stats returned:`, statsRes.data?.data || statsRes.data);

  console.log('\n--- HEALTH TEST ---');
  await runTest('Get health', '/health', 'GET', null, {}, 200);

  console.log('\n--- SECURITY TESTS ---');
  await runTest('SQL Injection attempt', "/api/marketplace?search=' OR '1'='1", 'GET', null, {}, undefined, (d, s) => s === 200 || s === 400);
  await runTest('XSS attempt', '/api/agents', 'POST', {
    name: "<script>alert('xss')</script>", slug: `xss-agent-${Date.now()}`, description: "Test xss", category: "CHATBOT",
    modelProvider: "google", modelName: "gemini-1.5-flash", systemPrompt: "test", pricingModel: "FREE", isPublic: false
  }, { Authorization: `Bearer ${token}` }, 201);
  if (agentId && bobToken) {
    await runTest('Access other user agent', `/api/agents/${agentId}`, 'PUT', { description: "hacked" }, { Authorization: `Bearer ${bobToken}` }, 403);
  }
  await runTest('Access without token', '/api/agents', 'GET', null, {}, 401);
  await runTest('Invalid JWT', '/api/agents', 'GET', null, { Authorization: 'Bearer invalidtoken123' }, 401);
}

main().catch(console.error);
