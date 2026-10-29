// Where Playwright and Chromium live. Defaults are this sandbox's paths; CI overrides them:
//   PLAYWRIGHT_MODULE=playwright  (resolve the npm package)   CHROME_PATH=  (empty = Playwright's bundled browser)
const pw = require(process.env.PLAYWRIGHT_MODULE || '/opt/npm-tools/node_modules/playwright');
const exe = process.env.CHROME_PATH !== undefined ? process.env.CHROME_PATH : '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
module.exports = { chromium: pw.chromium, devices: pw.devices, launchOpts: exe ? { executablePath: exe } : {} };
