const http = require('http');

const port = process.env.PORT || 3000;
const version = process.env.APP_VERSION || 'v1';

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(`Hello from ECS! ${version}\n`);
});

server.listen(port, () => {
  console.log(`Listening on port ${port} (version ${version})`);
});
