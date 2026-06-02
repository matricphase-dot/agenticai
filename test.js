(async () => {
  const res = await fetch('http://localhost:4000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@agenticai.dev', password: 'Demo@1234' })
  });
  const data = await res.text();
  console.log('STATUS:', res.status);
  console.log('DATA:', data);
})();
