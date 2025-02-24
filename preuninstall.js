import fs from "fs";
import path from "path";

// Define paths
const projectRootPath = process.env.npm_config_local_prefix || process.cwd();
const packageJsonPath = path.join(projectRootPath, "package.json");
const configFileName = "webAccessibility-config.json";
const configFilePath = path.join(projectRootPath, configFileName);
const accessibilityResultsFolder = path.join(
  projectRootPath,
  "accessibility-results"
);

// Function to revert changes in package.json
const revertPackageJson = () => {
  try {
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (packageJson.scripts && packageJson.scripts["test:accessibility"]) {
        delete packageJson.scripts["test:accessibility"];
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log(
          `Removed test:accessibility script from ${packageJsonPath}`
        );
      } else {
        console.log(`No test:accessibility script found in ${packageJsonPath}`);
      }
    } else {
      console.log(`No package.json found at ${packageJsonPath}`);
    }
  } catch (error) {
    console.error(`Error updating ${packageJsonPath}:`, error);
  }
};

// Function to delete the configuration file
const deleteConfigFile = () => {
  try {
    if (fs.existsSync(configFilePath)) {
      fs.unlinkSync(configFilePath);
      console.log(`Deleted ${configFileName} from the project root directory.`);
    } else {
      console.log(`${configFileName} not found in the project root directory.`);
    }
  } catch (error) {
    console.error(`Error deleting ${configFileName}:`, error);
  }
};

// Function to delete the accessibility results folder
const deleteAccessibilityResultsFolder = () => {
  try {
    if (fs.existsSync(accessibilityResultsFolder)) {
      fs.rmSync(accessibilityResultsFolder, { recursive: true, force: true });
      console.log(
        `Deleted ${accessibilityResultsFolder} from the project root directory.`
      );
    } else {
      console.log(
        `${accessibilityResultsFolder} not found in the project root directory.`
      );
    }
  } catch (error) {
    console.error(
      `Error deleting folder ${accessibilityResultsFolder}:`,
      error
    );
  }
};

// Execute cleanup
revertPackageJson();
deleteConfigFile();
deleteAccessibilityResultsFolder();
