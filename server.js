const { createServer: createHttpsServer } = require('https');
const { createServer: createHttpServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
console.log('Starting Next.js app in', dev ? 'development' : 'production', 'mode');
const app = next({ dev });
const handle = app.getRequestHandler();

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'certificates', 'localhost.pem')),
};

app.prepare().then(() => {
  console.log('Next.js app prepared, starting servers...');
  
  // Create HTTPS server for external access
  const httpsServer = createHttpsServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling HTTPS request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Create HTTP server for internal API calls
  const httpServer = createHttpServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling HTTP request:', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  // Start both servers
  Promise.all([
    new Promise((resolve, reject) => {
      httpsServer.listen(3000, (err) => {
        if (err) {
          console.error('Failed to start HTTPS server:', err);
          reject(err);
          return;
        }
        console.log('✅ HTTPS Server ready on https://localhost:3000');
        resolve();
      });
    }),
    new Promise((resolve, reject) => {
      httpServer.listen(3001, (err) => {
        if (err) {
          console.error('Failed to start HTTP server:', err);
          reject(err);
          return;
        }
        console.log('✅ HTTP Server ready on http://localhost:3001');
        resolve();
      });
    })
  ]).catch(err => {
    console.error('Failed to start servers:', err);
    process.exit(1);
  });
}); 