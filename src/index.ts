import puppeteer, { Browser } from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";
import fs from "fs";
import path from "path";

import { normalizeUrl, parseIssues } from "./utils/index";

const configFilePath = path.resolve(
  process.cwd(),
  "webAccessibility-config.json"
);
const outputDir = path.resolve(process.cwd(), "accessibility-results");
const outputPath = path.join(outputDir, "accessibility-results.json");

const crawl = async (baseUrl: string, maxPagesToVisit = Infinity) => {
  const visited = new Set();
  const toVisit = [baseUrl];
  const browser = await puppeteer.launch({ headless: true });

  while (toVisit.length > 0 && visited.size < maxPagesToVisit) {
    const url = toVisit.pop();
    if (visited.has(url)) {
      return;
    }

    visited.add(url);
    const page = await browser.newPage();

    try {
      console.log(`Currently visiting: ${url}`);
      await page.goto(url!, { waitUntil: "networkidle0", timeout: 30000 });

      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll("a[href]"), (a) =>
          a.getAttribute("href")
        ).filter(
          (href) =>
            href && !href.startsWith("javascript:") && !href.startsWith("#")
        )
      );

      links
        .filter((link) => link !== null)
        .forEach((link) => {
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
      if (error instanceof Error) {
        console.error("Error fetching URL:", url, error.message);
      }
    }
    await page.close();
  }

  await browser.close();
  return Array.from(visited);
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

  let urlsToVisit: string[];
  let existingUrls = new Set();

  if (fs.existsSync(outputPath)) {
    const existingData = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    existingData.forEach((entry: { url: string }) =>
      existingUrls.add(entry.url)
    );
  }

  if (config.relativePaths && config.relativePaths.length > 0) {
    urlsToVisit = config.relativePaths.map(
      (relativePath: string) => `${baseUrl}${relativePath}`
    );
  } else {
    console.log(`Crawling ${baseUrl} to discover paths...`);
    urlsToVisit = ((await crawl(baseUrl, maxPagesToVisit)) as string[]) || [];
  }

  let browser: Browser;
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
        const violationsData = parseIssues(
          results.violations,
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
    if (browser!) {
      await browser?.close();
    }
  }
})();
