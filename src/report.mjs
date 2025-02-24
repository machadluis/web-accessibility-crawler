import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { outputHtmlPath, outputPdfPath, outputPath } from "./utils.mjs";

export const generatePdfReport = async (results) => {
  const indexLinks = results
    .map(
      (result, i) => `<li>${i + 1}. <a href="#link${i}">${result.url}</a></li>`
    )
    .join("");

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Accessibility Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
        .page { page-break-before: always; }
        .section { page-break-inside: avoid; margin-bottom: 30px; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; font-size: 0.85em; word-wrap: break-word; }
        th { background-color: #f4f4f4; }
        tr:hover { background-color: #f0f0f0; }
        tr, td { page-break-inside: avoid; }
        .report-header { text-align: left; padding-bottom: 20px; }
        .summary { margin-bottom: 10px; }
        ul.index-list { list-style: none; padding-left: 0; }
        ul.index-list li { margin-bottom: 5px; }
        ul.index-list li a { text-decoration: none; color: #3366cc; }
        ul.index-list li a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1>Accessibility Report</h1>
        <h3>Index</h3>
        <ul class="index-list">${indexLinks}</ul>
      </div>
      ${results
        .map(
          (result, i) => `
          <div class="section">
            <h2 id="link${i}">${i + 1}. ${result.url}</h2>
            <div class="summary">
              <p>Critical Issues: ${result.ruleImpact.critical}</p>
              <p>Serious Issues: ${result.ruleImpact.serious}</p>
              <p>Moderate/Mild Issues: ${result.ruleImpact.moderate}</p>
              <p>Minor Issues: ${result.ruleImpact.minor}</p>
            </div>
            <table>
              <tr>
                <th>ID</th><th>Impact</th><th>Description</th><th>HTML</th><th>Failures</th>
              </tr>
              ${result.violations
                .map((violation) =>
                  violation.nodes
                    .map(
                      (node) => `
                      <tr>
                        <td>${violation.id}</td>
                        <td>${violation.impact}</td>
                        <td>${violation.description}</td>
                        <td style="word-break: break-all;">${node.html}</td>
                        <td>${node.failureSummary}</td>
                      </tr>
                      `
                    )
                    .join("")
                )
                .join("")}
            </table>
          </div>
          `
        )
        .join("")}
    </body>
    </html>
  `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });
  await page.pdf({
    path: outputPdfPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "5mm", right: "5mm" },
  });
  await browser.close();
};

export const generateHtmlReport = async () => {
  const templatePath = path.resolve(
    process.env.npm_config_local_prefix,
    "src/index.html"
  );
  const resultsPath = outputPath;

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found at ${templatePath}`);
  }

  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Results file not found at ${resultsPath}`);
  }

  const templateContent = fs.readFileSync(templatePath, "utf8");
  const resultsData = fs.readFileSync(resultsPath, "utf8");

  const injectedContent = templateContent.replace(
    "<!-- Detailed results will be added here by JavaScript -->",
    `<script>const fetchedData = ${resultsData};</script>`
  );

  fs.writeFileSync(outputHtmlPath, injectedContent);
  console.log(`HTML report generated at ${outputHtmlPath}`);
};
