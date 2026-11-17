// Automated local API ping tester
const http = require('http');

const PORT = process.env.PORT || 5000;

const req = http.get(`http://localhost:${PORT}/api/health`, (res) => {
  let raw = '';
  res.on('data', (chunk) => (raw += chunk));
  res.on('end', () => {
    console.log(`[HealthCheck] HTTP Status: ${res.statusCode}`);
    console.log(`[HealthCheck] Response: ${raw}`);
    process.exit(res.statusCode === 200 ? 0 : 1);
  });
});

req.on('error', (err) => {
  console.error(`[HealthCheck Error]: ${err.message}`);
  process.exit(1);
});
