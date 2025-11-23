const { spawn } = require('child_process');
const { chromium } = require('playwright');

const SERVER_URL = 'http://127.0.0.1:8000';

function startServer() {
  return new Promise((resolve, reject) => {
    const command = process.platform === 'win32' ? 'npx.cmd' : 'npx';
    const server = spawn(command, ['http-server', '-p', '8000', '-c-1'], {
      cwd: __dirname,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: process.platform === 'win32'
    });

    const onData = (data) => {
      if (data.toString().includes('Available on')) {
        server.stdout.off('data', onData);
        resolve(server);
      }
    };

    server.on('error', reject);
    server.stdout.on('data', onData);
  });
}

(async () => {
  let serverProcess;
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    serverProcess = await startServer();
    const pagesToTest = [
      { url: `${SERVER_URL}/invoices.html`, button: '#new-invoice-btn', modal: '#invoice-modal', description: 'Invoice modal' },
      { url: `${SERVER_URL}/leads.html`, button: '#new-lead-btn', modal: '#lead-modal', description: 'Lead modal' },
      { url: `${SERVER_URL}/projects.html`, button: '#add-project-btn', modal: '#project-form-modal', description: 'Project modal' },
      { url: `${SERVER_URL}/tasks.html`, button: '#add-task-btn', modal: '#task-form-modal', description: 'Task modal' },
      { url: `${SERVER_URL}/expenses.html`, button: 'text=Add Expense', modal: '#expense-modal', description: 'Expense modal' }
    ];

    for (const test of pagesToTest) {
      console.log(`\nTesting ${test.description} (${test.url})`);
      await page.goto(test.url, { waitUntil: 'load' });
      await page.waitForTimeout(500);
      await page.click(test.button, { timeout: 5000 });
      await page.waitForTimeout(500);
      const display = await page.$eval(test.modal, (el) => ({
        display: getComputedStyle(el).display,
        hidden: el.classList.contains('is-hidden'),
        ariaHidden: el.getAttribute('aria-hidden'),
        rect: el.getClientRects()[0] ? el.getClientRects()[0].toJSON() : null
      })).catch((err) => ({ error: err.message }));
      console.log('Modal state:', display);

      // Close modal for next test if it is visible
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    await browser.close();
    if (serverProcess) {
      serverProcess.kill();
    }
  }
})();
