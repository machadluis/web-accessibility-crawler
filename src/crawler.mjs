import puppeteer from "puppeteer";
import { normalizeUrl, isMediaFile } from "./utils.mjs";

export async function crawl(
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
