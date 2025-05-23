const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');

async function runLighthouse(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);

  // Save the report
  const reportHtml = runnerResult.report;
  fs.writeFileSync('lighthouse-report.html', reportHtml);

  // Log the performance score
  const performanceScore = runnerResult.lhr.categories.performance.score * 100;
  console.log(`Performance score: ${performanceScore}`);

  // Log Core Web Vitals
  const audits = runnerResult.lhr.audits;
  console.log('Core Web Vitals:');
  console.log(`LCP: ${audits['largest-contentful-paint'].displayValue}`);
  console.log(`FID: ${audits['max-potential-fid'].displayValue}`);
  console.log(`CLS: ${audits['cumulative-layout-shift'].displayValue}`);

  await chrome.kill();
}

// Test your local development server
runLighthouse('http://localhost:3000').catch(console.error); 