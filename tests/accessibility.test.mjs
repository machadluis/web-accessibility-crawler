import { describe, it, expect, vi } from "vitest";
import { analyzePages } from "../src/accessibility.mjs";
import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";
import * as utils from "../src/utils.mjs";

vi.mock("puppeteer");
vi.mock("@axe-core/puppeteer");
vi.mock("../src/utils.mjs");

describe("analyzePages function", () => {
  it("should analyze pages and return results", async () => {
    const urls = ["https://example.com"];
    const pageMock = {
      goto: vi.fn(),
      close: vi.fn(),
    };
    const browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn(),
    };
    puppeteer.launch.mockResolvedValue(browserMock);
    const axeMock = {
      analyze: vi.fn().mockResolvedValue({ violations: [] }),
    };
    AxePuppeteer.mockImplementation(() => axeMock);
    utils.logAccessibilityIssues.mockResolvedValue({});

    const results = await analyzePages(urls);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.goto).toHaveBeenCalledWith(urls[0], {
      waitUntil: "networkidle0",
    });
    expect(axeMock.analyze).toHaveBeenCalled();
    expect(pageMock.close).toHaveBeenCalled();
    expect(browserMock.close).toHaveBeenCalled();
    expect(results).toEqual([{}]);
  });

  it("should handle errors gracefully", async () => {
    const urls = ["https://example.com"];
    const pageMock = {
      goto: vi.fn().mockRejectedValue(new Error("Network error")),
      close: vi.fn(),
    };
    const browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn(),
    };
    puppeteer.launch.mockResolvedValue(browserMock);

    const results = await analyzePages(urls);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.goto).toHaveBeenCalledWith(urls[0], {
      waitUntil: "networkidle0",
    });
    expect(pageMock.close).toHaveBeenCalled();
    expect(browserMock.close).toHaveBeenCalled();
    expect(results).toEqual([]);
  });
});
