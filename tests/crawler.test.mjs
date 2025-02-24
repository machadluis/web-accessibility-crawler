import { describe, it, expect, vi } from "vitest";
import { crawl } from "../src/crawler.mjs";
import puppeteer from "puppeteer";
import * as utils from "../src/utils.mjs";

vi.mock("puppeteer");
vi.mock("../src/utils.mjs");

describe("crawl function", () => {
  it("should crawl pages and return visited URLs", async () => {
    const baseUrl = "https://example.com";
    const pageMock = {
      goto: vi.fn(),
      evaluate: vi.fn().mockResolvedValue(["https://example.com/page1"]),
      close: vi.fn(),
    };
    const browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn(),
    };
    puppeteer.launch.mockResolvedValue(browserMock);
    utils.normalizeUrl.mockReturnValue("https://example.com/page1");
    utils.isMediaFile.mockReturnValue(false);

    const results = await crawl(baseUrl);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.goto).toHaveBeenCalledWith(baseUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    expect(pageMock.evaluate).toHaveBeenCalled();
    expect(pageMock.close).toHaveBeenCalled();
    expect(browserMock.close).toHaveBeenCalled();
    expect(results).toEqual([baseUrl, "https://example.com/page1"]);
  });

  it("should handle errors gracefully", async () => {
    const baseUrl = "https://example.com";
    const pageMock = {
      goto: vi.fn().mockRejectedValue(new Error("Network error")),
      close: vi.fn(),
    };
    const browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn(),
    };
    puppeteer.launch.mockResolvedValue(browserMock);

    const results = await crawl(baseUrl);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.goto).toHaveBeenCalledWith(baseUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });
    expect(pageMock.close).toHaveBeenCalled();
    expect(browserMock.close).toHaveBeenCalled();
    expect(results).toEqual([baseUrl]);
  });
});
