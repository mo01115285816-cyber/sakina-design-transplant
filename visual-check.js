import puppeteer from 'puppeteer-core';
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const DIST_DIR = join(process.cwd(), 'dist');

const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let filePath = join(DIST_DIR, url.pathname === '/' ? 'index.html' : url.pathname);
  
  try {
    const content = await readFile(filePath);
    res.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'text/plain' });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  const url = `http://localhost:${port}`;
  console.log(`Server running on ${url}`);
  console.log(`Serving from: ${DIST_DIR}`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    
    const consoleLogs = [];
    page.on('console', msg => {
      consoleLogs.push({ type: msg.type(), text: msg.text() });
    });

    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push({ message: error.message, stack: error.stack });
    });

    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));

    const title = await page.title();
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return root ? root.innerHTML.substring(0, 500) : 'NOT FOUND';
    });

    console.log('\n=== PAGE TITLE ===');
    console.log(title);

    console.log('\n=== ROOT CONTENT (first 500 chars) ===');
    console.log(rootContent || 'EMPTY - React did not mount!');

    console.log('\n=== CONSOLE LOGS ===');
    consoleLogs.forEach(log => console.log(`[${log.type}] ${log.text}`));

    console.log('\n=== PAGE ERRORS ===');
    if (pageErrors.length === 0) {
      console.log('No page errors');
    } else {
      pageErrors.forEach(err => {
        console.log(`ERROR: ${err.message}`);
        console.log(err.stack?.substring(0, 500));
        console.log('---');
      });
    }

    await page.screenshot({ path: '/home/user/sakina-project/debug-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved');

    console.log('\n=== VERDICT ===');
    if (rootContent && rootContent.trim().length > 50) {
      console.log('React mounted successfully');
    } else {
      console.log('React did NOT mount - screen is blank');
    }
    if (consoleLogs.some(l => l.type === 'error')) {
      console.log('Console errors detected');
    }
    if (pageErrors.length > 0) {
      console.log(`${pageErrors.length} page error(s) detected`);
    }

  } catch (err) {
    console.error('Puppeteer error:', err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
