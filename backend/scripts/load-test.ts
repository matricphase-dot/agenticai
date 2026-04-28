import fetch from 'node-fetch';

const BACKEND_URL = 'https://agenticai-backend-xao9.onrender.com';

async function testEndpoint(url: string, method: string, users: number) {
  const fullUrl = url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
  
  const promises = [];
  
  for (let i = 0; i < users; i++) {
    const options: any = { method };
    if (method === 'POST') {
      options.headers = { 'Content-Type': 'application/json' };
      options.body = JSON.stringify({ email: `loaduser${i}@agenticai.dev`, password: "password123" });
    }
    const start = Date.now();
    promises.push(
      fetch(fullUrl, options)
        .then(res => ({ success: res.status >= 200 && res.status < 400, time: Date.now() - start, status: res.status }))
        .catch(err => ({ success: false, time: Date.now() - start, error: err.message }))
    );
  }
  
  const results = await Promise.all(promises);
  
  let successCount = 0;
  let totalTime = 0;
  let minTime = Number.MAX_VALUE;
  let maxTime = 0;
  
  results.forEach(r => {
    if (r.success) successCount++;
    totalTime += r.time;
    if (r.time < minTime) minTime = r.time;
    if (r.time > maxTime) maxTime = r.time;
  });
  
  console.log(`Endpoint: ${method} ${url} (${users} users)`);
  console.log(`Average response time: ${(totalTime / users).toFixed(2)}ms`);
  console.log(`Min response time: ${minTime === Number.MAX_VALUE ? 0 : minTime}ms`);
  console.log(`Max response time: ${maxTime}ms`);
  console.log(`Success rate %: ${(successCount / users) * 100}%`);
  console.log(`Errors/Non-2xx: ${users - successCount}`);
  console.log('-----------------------------------');
}

async function main() {
  console.log('Starting Load Test...\n');
  await Promise.all([
    testEndpoint('/api/marketplace', 'GET', 20),
    testEndpoint('/api/stats', 'GET', 10),
    testEndpoint('/api/governance/proposals', 'GET', 10),
    testEndpoint('/api/auth/login', 'POST', 10)
  ]);
  console.log('Load Test Complete.');
}

main().catch(console.error);
