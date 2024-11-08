const puppeteer = require("puppeteer");
const { AxePuppeteer } = require("@axe-core/puppeteer");
const fs = require("fs");
const path = require("path");

const configFilePath = path.resolve(
  process.env.npm_config_local_prefix,
  "webAccessibility-config.json"
);
const outputDir = path.resolve(
  process.env.npm_config_local_prefix,
  "accessibility-results"
);
const outputPath = path.join(outputDir, "accessibility-results.json");

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const normalizeUrl = (link, baseUrl) => {
  try {
    const url = new URL(link, baseUrl);
    url.search = "";
    url.hash = "";
    return url.href;
  } catch (error) {
    console.error("Error normalizing URL:", link);
    return null;
  }
};

const crawl = async (baseUrl, maxPagesToVisit = Infinity) => {
  const visited = new Set();
  const toVisit = [baseUrl];
  const browser = await puppeteer.launch({ headless: true });

  while (toVisit.length > 0 && visited.size < maxPagesToVisit) {
    const url = toVisit.pop();
    if (!visited.has(url)) {
      visited.add(url);
      const page = await browser.newPage();

      try {
        console.log(`Currently visiting: ${url}`);
        await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

        const links = await page.evaluate(() =>
          Array.from(document.querySelectorAll("a[href]"))
            .map((a) => a.getAttribute("href"))
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
            !visited.has(normalizedUrl)
          ) {
            toVisit.push(normalizedUrl);
          }
        });
      } catch (error) {
        console.error("Error fetching URL:", url, error.message);
      }
      await page.close();
    }
  }

  await browser.close();
  return Array.from(visited);
};

const logAccessibilityIssues = async (results, pageUrl, relativePath) => {
  const totalCriteria = 55; // WCAG 2.0 A/AA + WCAG 2.1 A/AA criteria

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

  const compliancePercentage =
    ((totalCriteria - violationsData.totalViolations) / totalCriteria) * 100;

  violationsData.compliancePercentage = compliancePercentage.toFixed(2);
  violationsData.totalRequirements = totalCriteria;

  return violationsData;
};

(async () => {
  if (!fs.existsSync(configFilePath)) {
    console.error(`Configuration file not found at ${configFilePath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
  const baseUrl = config.baseUrl;
  const maxPagesToVisit = config.maxPagesToVisit || Infinity;

  if (!baseUrl || baseUrl.trim() === "") {
    console.error("Error: baseUrl is not defined in the configuration file.");
    process.exit(1);
  }

  let urlsToVisit;
  let existingUrls = new Set();

  if (fs.existsSync(outputPath)) {
    const existingData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    existingData.forEach((entry) => existingUrls.add(entry.url));
  }

  if (config.relativePaths && config.relativePaths.length > 0) {
    urlsToVisit = config.relativePaths.map(
      (relativePath) => `${baseUrl}${relativePath}`
    );
  } else {
    console.log(`Crawling ${baseUrl} to discover paths...`);
    urlsToVisit = await crawl(baseUrl, maxPagesToVisit);
  }

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true });

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    let allResults = existingUrls.size
      ? JSON.parse(fs.readFileSync(outputPath, "utf8"))
      : [];

    for (const currentUrl of urlsToVisit) {
      if (!existingUrls.has(currentUrl)) {
        console.log(`Testing URL: ${currentUrl}`);
        const relativePath = new URL(currentUrl).pathname;
        const page = await browser.newPage();
        await page.setBypassCSP(true);
        await page.goto(currentUrl, { waitUntil: "networkidle0" });

        const results = await new AxePuppeteer(page).analyze();
        const violationsData = await logAccessibilityIssues(
          results,
          currentUrl,
          relativePath
        );

        if (violationsData) {
          allResults.push(violationsData);
          existingUrls.add(currentUrl);

          // Save results immediately after processing each URL
          fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));
        }

        await page.close();
      } else {
        console.log(`Skipping duplicate URL: ${currentUrl}`);
      }
    }

    console.log(`Accessibility test results saved to ${outputPath}`);
  } catch (error) {
    console.error("Error during accessibility test:", error);
  } finally {
    if (browser) await browser.close();
  }
})();
