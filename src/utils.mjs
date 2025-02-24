import fs from "fs";
import path from "path";

export const configFilePath = path.resolve(
  process.env.npm_config_local_prefix,
  "webAccessibility-config.json"
);
export const outputDir = path.resolve(
  process.env.npm_config_local_prefix,
  "accessibility-results"
);
export const outputPath = path.join(outputDir, "accessibility-results.json");
export const outputHtmlPath = path.join(
  outputDir,
  "accessibility-results.html"
);
export const outputPdfPath = path.join(outputDir, "accessibility-results.pdf");

export function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function normalizeUrl(link, baseUrl) {
  try {
    const url = new URL(link, baseUrl);
    url.search = ""; // Remove query parameters
    url.hash = ""; // Remove anchor
    return url.href;
  } catch (error) {
    console.error("Error normalizing URL:", link);
    return null;
  }
}

export function isMediaFile(url) {
  const mediaExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".pdf",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".mp4",
    ".mp3",
  ];
  return mediaExtensions.some((ext) => url.toLowerCase().includes(ext));
}

export function loadConfig() {
  console.log(`Loading configuration from ${configFilePath}...`);
  if (!fs.existsSync(configFilePath)) {
    throw new Error(`Configuration file not found at ${configFilePath}`);
  }
  return JSON.parse(fs.readFileSync(configFilePath, "utf8"));
}

export function saveResults(results) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
}

export const logAccessibilityIssues = async (
  results,
  pageUrl,
  relativePath
) => {
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
