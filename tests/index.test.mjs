import { describe, it, expect, vi } from "vitest";
import { main } from "../src/index.mjs";
import * as utils from "../src/utils.mjs";
import * as crawler from "../src/crawler.mjs";
import * as accessibility from "../src/accessibility.mjs";
import * as report from "../src/report.mjs";

vi.mock("../src/utils.mjs");
vi.mock("../src/crawler.mjs");
vi.mock("../src/accessibility.mjs");
vi.mock("../src/report.mjs");

describe("main function", () => {
  it("should load configuration and run accessibility tests", async () => {
    const config = {
      baseUrl: "https://example.com",
      relativePaths: [],
      maxPagesToVisit: 10,
      concurrency: 2,
    };

    utils.loadConfig.mockReturnValue(config);
    crawler.crawl.mockResolvedValue(["https://example.com"]);
    accessibility.analyzePages.mockResolvedValue([]);
    report.generatePdfReport.mockResolvedValue();

    const originalExit = process.exit;
    process.exit = vi.fn();

    await main();

    expect(utils.loadConfig).toHaveBeenCalled();
    expect(crawler.crawl).toHaveBeenCalledWith(
      config.baseUrl,
      config.maxPagesToVisit
    );
    expect(accessibility.analyzePages).toHaveBeenCalledWith(
      ["https://example.com"],
      config.concurrency
    );
    expect(report.generatePdfReport).toHaveBeenCalled();

    process.exit = originalExit;
  });
});
