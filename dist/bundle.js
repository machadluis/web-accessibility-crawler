import fs from 'fs';
import puppeteer from 'puppeteer';
import path from 'path';
import { AxePuppeteer } from '@axe-core/puppeteer';

const configFilePath = path.resolve(
  process.env.npm_config_local_prefix,
  "webAccessibility-config.json"
);
const outputDir = path.resolve(
  process.env.npm_config_local_prefix,
  "accessibility-results"
);
const outputPath = path.join(outputDir, "accessibility-results.json");
const outputHtmlPath = path.join(
  outputDir,
  "accessibility-results.html"
);
const outputPdfPath = path.join(outputDir, "accessibility-results.pdf");

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeUrl(link, baseUrl) {
  try {
    const url = new URL(link, baseUrl);
    url.search = ""; // Remove query parameters
    url.hash = ""; // Remove anchor
    return url.href;
  } catch (error) {
    console.error("Error normalizing URL:", link);
    return null;
  }
}

function isMediaFile(url) {
  const mediaExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".mp4",
    ".mp3",
  ];
  return mediaExtensions.some((ext) => url.toLowerCase().includes(ext));
}

function loadConfig() {
  console.log(`Loading configuration from ${configFilePath}...`);
  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Configuration file not found at ${configFilePath}`);
  }
  return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
}

function saveResults(results) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
}

const logAccessibilityIssues = async (
  results,
  pageUrl,
  relativePath
) => {
  const violationsData = {
    url: pageUrl,
    relativePath: relativePath,
    totalViolations: results.violations.length,
    wcagCompliance: { wcag2a: 0, wcag2aa: 0, wcag21a: 0, wcag21aa: 0 },
    ruleImpact: { minor: 0, moderate: 0, serious: 0, critical: 0 },
    violations: [],
  };

  results.violations.forEach((violation) => {
    violation.tags.forEach((tag) => {
      if (violationsData.wcagCompliance.hasOwnProperty(tag)) {
        violationsData.wcagCompliance[tag] += 1;
      }
    });
    if (violationsData.ruleImpact.hasOwnProperty(violation.impact)) {
      violationsData.ruleImpact[violation.impact] += 1;
    }
    violationsData.violations.push({
      id: violation.id,
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      nodes: violation.nodes.map((node) => ({
        target: node.target.join(", "),
        html: escapeHtml(node.html),
        failureSummary: node.failureSummary,
        xpath: node.xpath ? node.xpath.join(", ") : "N/A",
      })),
    });
  });

  const totalRequirements =
    violationsData.wcagCompliance.wcag2a +
    violationsData.wcagCompliance.wcag2aa +
    violationsData.wcagCompliance.wcag21a +
    violationsData.wcagCompliance.wcag21aa;

  const compliancePercentage =
    totalRequirements > 0
      ? ((totalRequirements - violationsData.totalViolations) /
          totalRequirements) *
        100
      : 100;

  violationsData.compliancePercentage = compliancePercentage;
  violationsData.totalRequirements = totalRequirements;

  return violationsData;
};

async function crawl(
  baseUrl,
  maxPagesToVisit = Infinity,
  concurrency = 3
) {
  const visited = new Set();
  const toVisit = [baseUrl];
  const browser = await puppeteer.launch({ headless: true });

  const visitPage = async (url) => {
    if (visited.has(url)) return;
    visited.add(url);
    const page = await browser.newPage();
    try {
      console.log(`Currently visiting: ${url}`);
      await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"))
          .map((a) => a.href)
          .filter(
            (href) =>
              href && !href.startsWith("javascript:") && !href.startsWith("#")
          )
      );
      links.forEach((link) => {
        const normalizedUrl = normalizeUrl(link, baseUrl);
        if (
          normalizedUrl &&
          normalizedUrl.startsWith(baseUrl) &&
          !visited.has(normalizedUrl) &&
          !isMediaFile(normalizedUrl)
        ) {
          toVisit.push(normalizedUrl);
        }
      });
    } catch (error) {
      console.error(`Error fetching URL: ${url}`, error.message);
    } finally {
      await page.close();
    }
  };

  while (toVisit.length > 0 && visited.size < maxPagesToVisit) {
    const batch = toVisit.splice(0, concurrency).map((url) => visitPage(url));
    await Promise.all(batch);
  }

  await browser.close();
  return Array.from(visited);
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const analyzePages = async (urls, concurrency = 2) => {
  const results = [];
  const browser = await puppeteer.launch({ headless: true });

  const analyzePage = async (url, retries = 0) => {
    let page;
    try {
      console.log(`Analyzing URL: ${url}`);
      page = await browser.newPage();
      await page.goto(url, { waitUntil: "networkidle0" });
      const axe = new AxePuppeteer(page);
      const result = await axe.analyze();
      const violationsData = await logAccessibilityIssues(result, url, url);
      results.push(violationsData);
    } catch (error) {
      console.error(`Error analyzing URL: ${url}`, error.message);
      if (retries < MAX_RETRIES) {
        console.log(`Retrying URL: ${url} (${retries + 1}/${MAX_RETRIES})`);
        await delay(RETRY_DELAY);
        await analyzePage(url, retries + 1);
      }
    } finally {
      if (page) {
        await page.close();
      }
    }
  };

  const promises = urls.map((url) => analyzePage(url));
  await Promise.all(promises);

  await browser.close();

  console.log(
    `Analysis complete. Results: ${JSON.stringify(results, null, 2)}`
  );
  return results;
};

const generatePdfReport = async (results) => {
  const indexLinks = results
    .map(
      (result, i) => `<li>${i + 1}. <a href="#link${i}">${result.url}</a></li>`
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Accessibility Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .page { page-break-before: always; }
        .section { page-break-inside: avoid; margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 0.85em; word-wrap: break-word; }
        th { background-color: #f4f4f4; }
        tr:hover { background-color: #f0f0f0; }
        tr, td { page-break-inside: avoid; }
        .report-header { text-align: left; padding-bottom: 20px; }
        .summary { margin-bottom: 10px; }
        ul.index-list { list-style: none; padding-left: 0; }
        ul.index-list li { margin-bottom: 5px; }
        ul.index-list li a { text-decoration: none; color: #3366cc; }
        ul.index-list li a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>Accessibility Report</h1>
        <h3>Index</h3>
        <ul class="index-list">${indexLinks}</ul>
      </div>
      ${results
        .map(
          (result, i) => `
          <div class="section">
            <h2 id="link${i}">${i + 1}. ${result.url}</h2>
            <div class="summary">
              <p>Critical Issues: ${result.ruleImpact.critical}</p>
              <p>Serious Issues: ${result.ruleImpact.serious}</p>
              <p>Moderate/Mild Issues: ${result.ruleImpact.moderate}</p>
              <p>Minor Issues: ${result.ruleImpact.minor}</p>
            </div>
            <table>
              <tr>
                <th>ID</th><th>Impact</th><th>Description</th><th>HTML</th><th>Failures</th>
              </tr>
              ${result.violations
                .map((violation) =>
                  violation.nodes
                    .map(
                      (node) => `
                      <tr>
                        <td>${violation.id}</td>
                        <td>${violation.impact}</td>
                        <td>${violation.description}</td>
                        <td style="word-break: break-all;">${node.html}</td>
                        <td>${node.failureSummary}</td>
                      </tr>
                      `
                    )
                    .join("")
                )
                .join("")}
            </table>
          </div>
          `
        )
        .join("")}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "5mm", right: "5mm" },
  });
  await browser.close();
};

const generateHtmlReport = async () => {
  const templatePath = path.resolve(
    process.env.npm_config_local_prefix,
    "src/index.html"
  );
  const resultsPath = outputPath;

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found at ${templatePath}`);
  }

  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Results file not found at ${resultsPath}`);
  }

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const resultsData = fs.readFileSync(resultsPath, "utf8");

  const injectedContent = templateContent.replace(
    "<!-- Detailed results will be added here by JavaScript -->",
    `<script>const fetchedData = ${resultsData};</script>`
  );

  fs.writeFileSync(outputHtmlPath, injectedContent);
  console.log(`HTML report generated at ${outputHtmlPath}`);
};

const main = async () => {
  try {
    console.log("Loading configuration...");
    const config = loadConfig();

    if (!config.baseUrl) {
      throw new Error("Base URL is missing in the configuration");
    }

    console.log("Configuration loaded successfully:", config);

    let urlsToVisit = [];
    const existingUrls = new Set();

    if (fs.existsSync(outputPath)) {
      console.log(`Reading existing results from ${outputPath}...`);
      const existingData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      existingData.forEach((entry) => existingUrls.add(entry.url));
    }

    if (config.relativePaths && config.relativePaths.length > 0) {
      console.log("Using relative paths from configuration...");
      urlsToVisit = config.relativePaths.map(
        (path) => `${config.baseUrl}${path}`
      );
    } else {
      console.log(`Crawling ${config.baseUrl} to discover paths...`);
      urlsToVisit = await crawl(config.baseUrl, config.maxPagesToVisit);
    }

    console.log(`URLs to analyze: ${urlsToVisit}`);

    const results = await analyzePages(urlsToVisit, config.concurrency);

    console.log(`Analysis results: ${JSON.stringify(results, null, 2)}`);

    const allResults = results.filter(
      (violationsData) => !existingUrls.has(violationsData.url)
    );

    console.log("Saving results...");
    saveResults(allResults);
    console.log("Generating PDF report...");
    await generatePdfReport(allResults);
    console.log("Generating HTML report...");
    await generateHtmlReport();
    console.log("Accessibility test results saved successfully.");
  } catch (error) {
    console.error(`Error in processing: ${error.message}`);
    throw error; // Throw the error instead of calling process.exit
  }
};

main();

export { main };
//# sourceMappingURL=bundle.js.map
