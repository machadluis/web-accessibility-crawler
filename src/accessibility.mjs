import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";
import { logAccessibilityIssues } from "./utils.mjs";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const analyzePages = async (urls, concurrency = 2) => {
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
