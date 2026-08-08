import { chromium } from 'playwright';

const URL = process.argv[2] || 'https://sakina-design-transplant.vercel.app/';

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-fake-ui-for-media-stream']
  });

  const context = await browser.newContext({
    locale: 'ar-EG',
    permissions: ['clipboard-read', 'clipboard-write']
  });

  const page = await context.newPage();
  
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({ message: error.message, stack: error.stack });
  });

  console.log(`Navigating to ${URL}...`);
  
  try {
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(5000);
  } catch (err) {
    console.log('Navigation error:', err.message);
  }

  // Check if speechSynthesis is available
  const synthCheck = await page.evaluate(() => {
    return {
      hasSpeechSynthesis: typeof window !== 'undefined' && 'speechSynthesis' in window,
      voicesCount: typeof window !== 'undefined' ? window.speechSynthesis.getVoices().length : 0,
      voicesList: typeof window !== 'undefined' ? window.speechSynthesis.getVoices().map(v => `${v.name} (${v.lang})`) : [],
    };
  });
  console.log('\n=== SpeechSynthesis Check ===');
  console.log('Available:', synthCheck.hasSpeechSynthesis);
  console.log('Voices count:', synthCheck.voicesCount);
  console.log('Voices:', synthCheck.voicesList.slice(0, 10).join('\n  '));

  // Navigate to Sakeenah AI tab
  console.log('\n=== Looking for Sakeenah AI tab ===');
  const sakeenahTab = await page.$('text=سكينة AI');
  const sakeenahTab2 = await page.$('text=سَكِينَة AI');
  console.log('Found tab:', sakeenahTab ? 'YES (v1)' : sakeenahTab2 ? 'YES (v2)' : 'NO');

  // Try clicking the tab
  if (sakeenahTab) {
    await sakeenahTab.click();
  } else if (sakeenahTab2) {
    await sakeenahTab2.click();
  } else {
    // Try finding via bottom nav
    const navButtons = await page.$$('button');
    console.log('Nav buttons count:', navButtons.length);
    for (const btn of navButtons) {
      const text = await btn.textContent();
      if (text && text.includes('سكينة')) {
        await btn.click();
        console.log('Clicked button:', text);
        break;
      }
    }
  }

  await page.waitForTimeout(2000);

  // Check if we're on the AI page - look for the welcome card or chat area
  const welcomeCard = await page.$('text=ملاذك الآمن');
  const chatArea = await page.$('[class*="flex-1"]');
  console.log('Welcome card found:', !!welcomeCard);
  console.log('Chat area found:', !!chatArea);

  // Now try to send a test message to generate an AI response
  console.log('\n=== Sending test message ===');
  const textarea = await page.$('textarea[placeholder*="اسأل"]');
  console.log('Textarea found:', !!textarea);
  
  if (textarea) {
    await textarea.fill('ما هو فضل الصلاة؟');
    await page.waitForTimeout(500);
    
    // Find and click send button
    const sendBtn = await page.$('button[type="submit"]');
    console.log('Send button found:', !!sendBtn);
    
    if (sendBtn) {
      await sendBtn.click();
      console.log('Clicked send button');
    }
  }

  // Wait for AI response (up to 15 seconds)
  console.log('\n=== Waiting for AI response... ===');
  await page.waitForTimeout(15000);

  // Check if there's a play button on an AI response
  const playButtons = await page.$$('button[title="استماع للإجابة"]');
  console.log('Play buttons found:', playButtons.length);

  if (playButtons.length > 0) {
    console.log('\n=== CLICKING PLAY BUTTON ===');
    
    // Check speech state BEFORE click
    const beforeState = await page.evaluate(() => {
      const synth = window.speechSynthesis;
      return {
        speaking: synth.speaking,
        paused: synth.paused,
        pending: synth.pending,
        voices: synth.getVoices().length,
      };
    });
    console.log('Before click - speaking:', beforeState.speaking, 'pending:', beforeState.pending, 'voices:', beforeState.voices);

    // Click the first play button
    await playButtons[0].click();
    console.log('Clicked play button');

    await page.waitForTimeout(3000);

    // Check speech state AFTER click
    const afterState = await page.evaluate(() => {
      const synth = window.speechSynthesis;
      return {
        speaking: synth.speaking,
        paused: synth.paused,
        pending: synth.pending,
        voices: synth.getVoices().length,
      };
    });
    console.log('After click - speaking:', afterState.speaking, 'pending:', afterState.pending, 'voices:', afterState.voices);
  } else {
    console.log('No play buttons found - checking for errors');
  }

  // Final console logs
  console.log('\n=== FINAL CONSOLE LOGS ===');
  consoleLogs.filter(l => l.type === 'error' || l.text.includes('speech') || l.text.includes('TTS') || l.text.includes('speak')).forEach(log => {
    console.log(`[${log.type}] ${log.text}`);
  });

  console.log('\n=== PAGE ERRORS ===');
  pageErrors.forEach(err => {
    console.log(`ERROR: ${err.message}`);
  });

  if (pageErrors.length === 0 && consoleLogs.filter(l => l.type === 'error').length === 0) {
    console.log('No errors detected');
  }

  await page.screenshot({ path: '/home/user/sakina-project/tts-debug.png', fullPage: true });
  console.log('\nScreenshot saved');

  await browser.close();
})();
