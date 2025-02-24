import { describe, it, expect, vi } from "vitest";
import { generatePdfReport } from "../src/report.mjs";
import puppeteer from "puppeteer";
import { outputPdfPath } from "../src/utils.mjs";

vi.mock("puppeteer");
vi.mock("../src/utils.mjs");

describe("generatePdfReport function", () => {
  it("should generate a PDF report", async () => {
    const results = [
      {
        url: "https://example.com",
        ruleImpact: { critical: 1, serious: 2, moderate: 3, minor: 4 },
        violations: [
          {
            id: "violation1",
            impact: "critical",
            description: "Description 1",
            nodes: [{ html: "<div></div>", failureSummary: "Failure 1" }],
          },
        ],
      },
    ];
    const pageMock = {
      setContent: vi.fn(),
      pdf: vi.fn(),
    };
    const browserMock = {
      newPage: vi.fn().mockResolvedValue(pageMock),
      close: vi.fn(),
    };
    puppeteer.launch.mockResolvedValue(browserMock);

    await generatePdfReport(results);

    expect(puppeteer.launch).toHaveBeenCalled();
    expect(browserMock.newPage).toHaveBeenCalled();
    expect(pageMock.setContent).toHaveBeenCalled();
    expect(pageMock.pdf).toHaveBeenCalledWith({
      path: outputPdfPath,
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "5mm", right: "5mm" },
    });
    expect(browserMock.close).toHaveBeenCalled();
  });
});
