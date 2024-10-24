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

// Function to escape HTML for safe display
const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// Function to normalize URLs by removing query parameters and anchors
const normalizeUrl = (link, baseUrl) => {
  try {
    const url = new URL(link, baseUrl);
    url.search = ""; // Remove query parameters
    url.hash = ""; // Remove anchor
    return url.href;
  } catch (error) {
    console.error("Error normalizing URL:", link);
    return null;
  }
};

// Function to crawl using Puppeteer, limited to max pages
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

// Function to log accessibility issues
const logAccessibilityIssues = async (results, pageUrl, relativePath) => {
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
  // Use relativePaths if available; otherwise, crawl
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

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir);
    }

    for (const currentUrl of urlsToVisit) {
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

      // Save results after each URL is tested
      let allResults = [];
      if (fs.existsSync(outputPath)) {
        allResults = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      }
      allResults.push(violationsData);
      fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2));

      await page.close();
    }

    console.log(`Accessibility test results saved to ${outputPath}`);
  } catch (error) {
    console.error("Error during accessibility test:", error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
