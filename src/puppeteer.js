// puppeteer-singleton.js
import path from 'path';
import puppeteer from 'puppeteer';

let browserInstance = null;     // Puppeteer Browser or null
let launching = null;          // Promise while launching is in-flight

async function _doLaunch(options = {}) {
  // internal launch routine
  const launchArgs = [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--no-zygote',
  ];

  const launchOptions = {
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: launchArgs,
    ...options,
  };

  const b = await puppeteer.launch(launchOptions);
  b.on('disconnected', () => {
    browserInstance = null;
  });
  return b;
}

async function launchBrowser(options) {
  if (browserInstance && browserInstance.isConnected()) return browserInstance;

  if (launching) return launching;

  launching = (async () => {
    try {
      if (browserInstance) {
        try { await browserInstance.close(); } catch (err) { /* ignore */ }
        browserInstance = null;
      }
      const b = await _doLaunch(options);
      browserInstance = b;
      return browserInstance;
    } finally {
      launching = null;
    }
  })();

  return launching;
}

export const getBrowser = async(options) => {
  const b = await launchBrowser(options);
  if (!b || !b.isConnected()) {
    try {
      await shutdownBrowser();
    } catch {}
    return launchBrowser(options);
  }
  return b;
}


export const withNewPage = async (fn, { navigationTimeout = 30000 } = {}) => {
  const attempt = async () => {
    const browser = await getBrowser();
    const page = await browser.newPage();
    page.setDefaultTimeout(navigationTimeout);
    page.setDefaultNavigationTimeout(navigationTimeout);
    try {
      return await fn(page);
    } finally {
      try { await page.close(); } catch (err) { /* ignore */ }
    }
  };

  try {
    return await attempt();
  } catch (err) {
    console.error('Puppeteer operation failed first time:', err);
    try { await shutdownBrowser(); } catch (e) { /* ignore */ }
    return attempt();
  }
};

export async function shutdownBrowser() {
  if (launching) {
    try { await launching; } catch {}
  }
  if (browserInstance) {
    try { await browserInstance.close(); } catch (err) { console.warn('Error closing browser:', err); }
  }
  browserInstance = null;
  launching = null;
}

function installProcessHandlers() {
  const onExit = async () => {
    try { await shutdownBrowser(); } catch (err) { /* ignore */ }
    // Do not call process.exit here; let Node exit naturally
  };
  process.once('SIGINT', onExit);
  process.once('SIGTERM', onExit);
  process.once('beforeExit', onExit);
}
installProcessHandlers();
