import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// Define paths
const projectRootPath = process.env.npm_config_local_prefix || process.cwd();
const packageRootPath = path.dirname(new URL(import.meta.url).pathname);
const packageJsonPath = path.join(projectRootPath, "package.json");
const configFileName = "webAccessibility-config.json";
const configFilePath = path.join(projectRootPath, configFileName);
const accessibilityResultsFolder = path.join(
  projectRootPath,
  "accessibility-results"
);
const sourceIndexHtmlPath = path.resolve(packageRootPath, "src/index.html");
const destinationIndexHtmlPath = path.join(
  accessibilityResultsFolder,
  "index.html"
);

// Default configuration content
const configFileContent = JSON.stringify(
  {
    baseUrl: "http://localhost", // Base URL of the site to test
    relativePaths: ["/", "/cart", "/search"], // Paths to test, relative to baseUrl
    maxPagesToVisit: 50, // Maximum pages to visit, use Infinity for no limit
  },
  null,
  2
);

const checkInstallation = () => {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    const isDevDependency =
      (packageJson.devDependencies &&
        packageJson.devDependencies["web-accessibility-crawler"]) ||
      false;
    if (!isDevDependency) {
      console.warn(
        'Warning: It is recommended to install "web-accessibility-crawler" as a devDependency using --save-dev.'
      );
    }
  }
};

const installDependencies = () => {
  if (fs.existsSync(path.join(projectRootPath, "node_modules"))) {
    console.log("Dependencies already installed.");
  } else {
    try {
      console.log("Installing package dependencies...");
      execSync("npm install", { stdio: "inherit", cwd: projectRootPath });
      console.log("Dependencies installed.");
    } catch (error) {
      console.error("Error installing dependencies:", error);
    }
  }
};

const updatePackageJson = () => {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    packageJson.scripts = packageJson.scripts || {};
    packageJson.scripts["test:accessibility"] =
      "node node_modules/web-accessibility-crawler/src/index.js";
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`Updated scripts in ${packageJsonPath}`);
  } else {
    console.log(`No package.json found at ${packageJsonPath}`);
  }
};

const createConfigFile = () => {
  if (!fs.existsSync(configFilePath)) {
    fs.writeFileSync(configFilePath, configFileContent);
    console.log(`Created ${configFileName} in the project root directory.`);
  } else {
    console.log(
      `${configFileName} already exists in the project root directory.`
    );
  }
};

const createAccessibilityResultsFolder = () => {
  if (!fs.existsSync(accessibilityResultsFolder)) {
    fs.mkdirSync(accessibilityResultsFolder, { recursive: true });
    console.log(
      `Created ${accessibilityResultsFolder} folder in the project root directory.`
    );
  }
  // Ensure destination directory exists
  fs.mkdirSync(path.dirname(destinationIndexHtmlPath), { recursive: true });
  if (fs.existsSync(sourceIndexHtmlPath)) {
    fs.copyFileSync(sourceIndexHtmlPath, destinationIndexHtmlPath);
    console.log(`Copied index.html to ${destinationIndexHtmlPath}.`);
  } else {
    console.log(`index.html not found at ${sourceIndexHtmlPath}.`);
  }
};

const installPuppeteerBrowser = () => {
  try {
    console.log("Ensuring Puppeteer browser is installed...");
    execSync("npx puppeteer install", {
      stdio: "inherit",
      cwd: path.join(packageRootPath, "node_modules", "puppeteer"),
    });
    console.log("Puppeteer browser is installed.");
  } catch (error) {
    console.error("Error ensuring Puppeteer browser is installed:", error);
  }
};

try {
  checkInstallation();
  installDependencies();
  updatePackageJson();
  createConfigFile();
  createAccessibilityResultsFolder();
  installPuppeteerBrowser();
} catch (error) {
  console.error("Error during postinstall script:", error);
}
