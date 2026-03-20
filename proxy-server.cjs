/**
 * Simple CORS Proxy Server for Boxento
 * 
 * This proxy allows the Website Monitor widget to check websites without CORS issues.
 * Run with: node proxy-server.cjs
 * 
 * The server runs on port 3001 by default.
 */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PROXY_PORT || 3001;

// Simple request logger
function log(method, targetUrl, status, duration) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${method} ${targetUrl} - ${status} (${duration}ms)`);
}

const server = http.createServer(async (req, res) => {
  // Set CORS headers to allow requests from your dev server
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only allow GET requests for security
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  // Extract target URL from path
  // URL format: /proxy/https://example.com
  const pathMatch = req.url.match(/^\/proxy\/(https?:\/\/.*)$/);
  
  if (!pathMatch) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Invalid URL format. Use: /proxy/https://example.com' 
    }));
    return;
  }

  const targetUrl = pathMatch[1];
  const startTime = Date.now();

  try {
    const parsedUrl = new URL(targetUrl);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Boxento-WebsiteMonitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'close',
      },
      timeout: 10000, // 10 second timeout
    };

    const proxyReq = client.request(options, (proxyRes) => {
      const duration = Date.now() - startTime;
      
      // Log the request
      log('GET', targetUrl, proxyRes.statusCode, duration);

      // Forward the status code
      res.writeHead(proxyRes.statusCode, {
        'Content-Type': proxyRes.headers['content-type'] || 'text/plain',
      });

      // Stream the response
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (error) => {
      const duration = Date.now() - startTime;
      log('GET', targetUrl, 'ERROR', duration);
      
      console.error(`Proxy error for ${targetUrl}:`, error.message);
      
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Failed to fetch target URL',
        message: error.message 
      }));
    });

    proxyReq.on('timeout', () => {
      const duration = Date.now() - startTime;
      log('GET', targetUrl, 'TIMEOUT', duration);
      
      proxyReq.destroy();
      
      res.writeHead(504, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        error: 'Request timeout',
        message: 'The target server did not respond in time' 
      }));
    });

    proxyReq.end();

  } catch (error) {
    const duration = Date.now() - startTime;
    log('GET', targetUrl, 'INVALID', duration);
    
    console.error(`Invalid URL: ${targetUrl}`, error.message);
    
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      error: 'Invalid URL',
      message: error.message 
    }));
  }
});

server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║              Boxento CORS Proxy Server                     ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                    ║
║                                                            ║
║  Usage: http://localhost:${PORT}/proxy/https://example.com      ║
║                                                            ║
║  To use with Website Monitor widget:                       ║
║  1. Keep this server running                               ║
║  2. The widget will automatically use the local proxy      ║
║                                                            ║
║  Press Ctrl+C to stop                                      ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down proxy server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
