// require('dotenv').config(); // Load environment variables FIRST
// const express = require('express');
// const cors = require('cors');
// const lighthouse = require('lighthouse').default;
// const chromeLauncher = require('chrome-launcher');
// const generateSuggestions = require('./generateSuggestions');

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.post('/audit', async (req, res) => {
//   const { url } = req.body;

//   if (!url || !/^https?:\/\//.test(url)) {
//     return res.status(400).json({ error: 'Invalid URL' });
//   }

//   try {
//     console.log("🚀 Starting audit for:", url);

//     // Use environment variables for Chrome flags
//     const chromeFlags = [
//       '--headless',
//       '--no-sandbox',
//       ...(process.env.CHROME_FLAGS ? process.env.CHROME_FLAGS.split(',') : [])
//     ];

//     const chrome = await chromeLauncher.launch({ 
//       chromeFlags,
//       chromePath: process.env.CHROME_PATH // Optional custom Chrome path
//     });
    
//     const options = { 
//       logLevel: process.env.LOG_LEVEL || 'info', 
//       output: 'json', 
//       port: chrome.port 
//     };

//     const result = await lighthouse(url, options);
//     await chrome.kill();

//     const auditData = {
//       performance: result.lhr.categories.performance.score,
//       seo: result.lhr.categories.seo.score,
//       accessibility: result.lhr.categories.accessibility.score,
//       bestPractices: result.lhr.categories['best-practices'].score,
//     };

//     const suggestions = await generateSuggestions({
//       seoData: auditData,
//       lighthouse: result.lhr,
//     });

//     console.log("✅ Audit complete:", auditData);
//     res.json({ audit: auditData, suggestions });
//   } catch (error) {
//     console.error("❌ Lighthouse error:", error);
//     res.status(500).json({ error: error.message || 'Lighthouse audit failed' });
//   }
// });

// // Use PORT from .env or default to 3001
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Audit server running on http://localhost:${PORT}`);
// });





// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const lighthouse = require('lighthouse').default;
// const chromeLauncher = require('chrome-launcher');
// const generateSuggestions = require('./generateSuggestions');

// const app = express();
// app.use(cors());
// app.use(express.json());

// app.post('/audit', async (req, res) => {
//   const { url } = req.body;

//   if (!url || !/^https?:\/\//.test(url)) {
//     return res.status(400).json({ error: 'Invalid URL' });
//   }

//   try {
//     console.log("🚀 Starting audit for:", url);

//     const chromeFlags = [
//       '--headless',
//       '--no-sandbox',
//       ...(process.env.CHROME_FLAGS ? process.env.CHROME_FLAGS.split(',') : []),
//     ];

//     const chrome = await chromeLauncher.launch({
//       chromeFlags,
//       chromePath: process.env.CHROME_PATH,
//     });

//     const options = {
//       logLevel: process.env.LOG_LEVEL || 'info',
//       output: 'json',
//       port: chrome.port,
//     };

//     const result = await lighthouse(url, options);
//     await chrome.kill();

//     // Audit category scores
//     const auditScores = {
//       performance: result.lhr.categories.performance.score,
//       seo: result.lhr.categories.seo.score,
//       accessibility: result.lhr.categories.accessibility.score,
//       bestPractices: result.lhr.categories['best-practices'].score,
//     };

//     // Extra dynamic metrics
//     const audits = Object.values(result.lhr.audits);

//     const criticalIssues = audits.filter(
//       (a) => a.score === 0 && a.scoreDisplayMode === 'binary'
//     ).length;

//     const warnings = audits.filter(
//       (a) => a.score !== null && a.score > 0 && a.score < 0.9
//     ).length;

//     const totalAudits = audits.filter((a) => a.score !== null).length;
//     const passedAudits = audits.filter((a) => a.score >= 0.9).length;

//     const optimizedPages = totalAudits
//       ? Math.round((passedAudits / totalAudits))
//       : 0;

//     // const keywordRanking = `+${Math.floor(Math.random() * 10) + 10}%`; // Fake for now

//     const suggestions = await generateSuggestions({
//       seoData: auditScores,
//       lighthouse: result.lhr,
//     });

//     const auditData = {
//       ...auditScores,
//       criticalIssues,
//       warnings,
//       optimizedPages,
//       // keywordRanking,
//     };

//     console.log("✅ Audit complete:", auditData);
//     res.json({ audit: auditData, suggestions });

//   } catch (error) {
//     console.error("❌ Lighthouse error:", error);
//     res.status(500).json({ error: error.message || 'Lighthouse audit failed' });
//   }
// });

// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`🚀 Audit server running on http://localhost:${PORT}`);
// });


require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const lighthouse = require('lighthouse');
const chromium = require('@sparticuz/chromium'); // ✅ works on serverless
const puppeteer = require('puppeteer-core');
const generateSuggestions = require('./generateSuggestions');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/audit', async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//.test(url)) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    console.log("🚀 Starting audit for:", url);

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });

    const port = new URL(browser.wsEndpoint()).port;

    const result = await lighthouse(url, {
      port,
      output: 'json',
      logLevel: 'info',
    });

    await browser.close();

    const auditData = {
      performance: result.lhr.categories.performance.score,
      seo: result.lhr.categories.seo.score,
      accessibility: result.lhr.categories.accessibility.score,
      bestPractices: result.lhr.categories['best-practices'].score,
    };

    const suggestions = await generateSuggestions({
      seoData: auditData,
      lighthouse: result.lhr,
    });

    console.log("✅ Audit complete:", auditData);
    res.json({ audit: auditData, suggestions });
  } catch (error) {
    console.error("❌ Lighthouse error:", error);
    res.status(500).json({ error: error.message || 'Lighthouse audit failed' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Audit server running on http://localhost:${PORT}`);
});
