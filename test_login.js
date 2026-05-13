const http = require('http');
const data = JSON.stringify({ username: 'admin', password: 'admin123' });
const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/admin/login', method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
}, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => { console.log('Status:', res.statusCode); console.log('Response:', body); });
});
req.write(data);
req.end();
