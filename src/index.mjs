import fs from "fs";
import { crawl } from "./crawler.mjs";
import { analyzePages } from "./accessibility.mjs";
import { generatePdfReport, generateHtmlReport } from "./report.mjs";
import { loadConfig, saveResults, outputPath } from "./utils.mjs";

export const main = async () => {
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
