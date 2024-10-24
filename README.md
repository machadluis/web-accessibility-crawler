# Web Accessibility Crawler

[![npm version](https://badge.fury.io/js/web-accessibility-crawler.svg)](https://www.npmjs.com/package/web-accessibility-crawler)

## Overview

The **Web Accessibility Crawler** is a tool designed to automatically scan and test the accessibility of web pages using [Puppeteer](https://pptr.dev/) and [axe-core](https://github.com/dequelabs/axe-core) for WCAG (Web Content Accessibility Guidelines) compliance. It generates detailed reports on violations across different WCAG levels, including 2.0 A, 2.0 AA, and 2.1 AA, and provides a web interface to view and download the results in CSV format.

## Features

- **Automated Crawling**: Automatically visits multiple URLs defined in the configuration file.
- **WCAG Compliance Testing**: Tests for compliance with WCAG 2.0 A, 2.0 AA, and 2.1 AA.
- **Detailed Reports**: Generates a JSON report highlighting violations categorized by severity (minor, moderate, serious, critical) and compliance levels, including element references, failure summaries, and links to helpful documentation.
- **Customizable URL Paths**: Allows users to configure relative URLs for testing through a `webAccessibility-config.json` file.
- **Interface**: A simple HTML dashboard for viewing the results.
- **Download Feature**: Export accessibility test results as a CSV file.

## Prerequisites

- **Node.js**: Ensure you have Node.js installed. This tool requires Node.js to run.

## Installation

1. **Install from npm**:

   It's recommended to install the package as a devDependency to avoid potential licensing issues within your project:

   ```bash
   npm install web-accessibility-crawler --save-dev
   ```

2. **Clone the Repository**:

   Alternatively, clone the repository and navigate to the project directory:

   ```bash
   git clone https://github.com/machadluis/web-accessibility-crawler.git
   cd web-accessibility-crawler
   npm install
   ```

## Configuration

### Server Setup

Ensure your server is running. If you're running a local server, make sure to specify the correct `localhost` and port (e.g., `3000`) in your configuration.

### Configuration File

Before running the tool, configure the URLs you want to test by creating a `webAccessibility-config.json` file in the project root. Define the base URL to match your server's address, ensuring that the host and port are set correctly. Customize the URLs as follows:

```json
{
  "baseUrl": "http://localhost:3000",
  "relativePaths": ["/", "/page1", "/page2", "/page3"],
  "maxPagesToVisit": 50
}
```

- **`baseUrl`**: Set this to your server's base URL, including the correct port if necessary.
- **`relativePaths`**: List the relative paths you want to test.
- **`maxPagesToVisit`**: Specify the maximum number of pages to crawl, or omit this line for unlimited crawling.

## Running the Accessibility Crawler

Run the crawler using the following npm script:

```bash
npm run run-accessibility-test
```

This command initiates Puppeteer, visits the pages specified in the configuration file, and analyzes them for accessibility issues using axe-core. Results are saved in the `accessibility-results` folder as `accessibility-results.json`.

## Example Output

The crawler generates a report in JSON format. Each entry in the report includes details such as:

- **URL**: The full URL of the tested page.
- **Relative Path**: The relative URL path as defined in the configuration.
- **Total Violations**: The number of accessibility violations found.
- **WCAG Compliance**: The breakdown of violations by WCAG level (2.0 A, 2.0 AA, 2.1 AA).
- **Rule Impact**: Violations categorized by severity: minor, moderate, serious, critical.
- **Violations**: A list of specific violations found, including:
  - Violation description
  - Help URL (for more information about the issue)
  - HTML element(s) causing the issue
  - Impact level
  - XPaths of violating elements

Example JSON:

```json
[
  {
    "url": "http://localhost:3000/",
    "relativePath": "",
    "totalViolations": 5,
    "wcagCompliance": {
      "wcag2a": 3,
      "wcag2aa": 1,
      "wcag21aa": 1
    },
    "ruleImpact": {
      "minor": 1,
      "moderate": 2,
      "serious": 2,
      "critical": 0
    },
    "violations": [
      {
        "id": "color-contrast",
        "impact": "serious",
        "description": "Elements must have sufficient color contrast",
        "help": "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds.",
        "helpUrl": "https://dequeuniversity.com/rules/axe/4.1/color-contrast?application=axeAPI",
        "nodes": [
          {
            "target": "#header",
            "html": "<div id='header'>Header</div>",
            "failureSummary": "Expected contrast ratio of 4.5:1, but found 3.0:1",
            "xpath": "N/A"
          }
        ]
      }
    ]
  }
]
```

## Customization

- **Base URL**: Modify the `baseUrl` in the configuration file to point to your desired web application.
- **Paths**: Define additional or different URL paths for testing in the `webAccessibility-config.json` file. Set `maxPagesToVisit` to control the crawl depth.
- **Modify Server Settings**: Ensure the `localhost` and port in the configuration match your server setup. Adjust as needed based on your environment.

### Viewing Results

1. Open the `index.html` file in your browser.
2. The page will load the results from `accessibility-results.json`.
3. You can view a summary of the issues found on each page and click on specific issues to see detailed violation information.

### Exporting to CSV

- To export the test results as a CSV file, click the **Export** button on the results page. This will download a CSV file named `accessibility_results.csv` containing all violations and details such as WCAG levels, impact, and element references.

## Dependencies

The project relies on the following npm packages:

- **@axe-core/puppeteer**: Integrates axe-core with Puppeteer to run accessibility checks.
- **Puppeteer**: A headless browser automation library.

## License

This project is licensed under the MIT License.