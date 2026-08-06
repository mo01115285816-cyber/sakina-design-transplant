import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://sakina-design-transplant.vercel.app/';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });

  const networkErrors = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      networkErrors.push({
        url: response.url(),
        status: response.status()
      });
    }
  });

  console.log(`Navigating to ${URL}...`);
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  } catch (err) {
    console.log('Navigation error:', err.message);
  }

  const title = await page.title();
  const rootContent = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML.substring(0, 500) : 'NOT FOUND';
  });

  console.log('\n=== PAGE TITLE ===');
  console.log(title);

  console.log('\n=== ROOT CONTENT ===');
  console.log(rootContent || 'EMPTY');

  console.log('\n=== CONSOLE LOGS (errors only) ===');
  consoleLogs.filter(l => l.type === 'error').forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

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

  console.log('\n=== NETWORK ERRORS ===');
  if (networkErrors.length === 0) {
    console.log('No network errors');
  } else {
    networkErrors.forEach(err => {
      console.log(`${err.status}: ${err.url}`);
    });
  }

  await page.screenshot({ path: '/home/user/sakina-project/vercel-screenshot.png', fullPage: true });
  console.log('\nScreenshot saved');

  console.log('\n=== VERDICT ===');
  if (rootContent && rootContent.trim().length > 100) {
    console.log('✅ React mounted successfully');
  } else {
    console.log('❌ React did NOT mount');
  }

  await browser.close();
})();
