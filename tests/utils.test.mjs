import { describe, it, expect } from "vitest";
import * as utils from "../src/utils.mjs";
import fs from "fs";
import path from "path";

describe("Utility Functions", () => {
  describe("loadConfig", () => {
    it("should load configuration from file", () => {
      const configFilePath = path.resolve(
        process.env.npm_config_local_prefix,
        "webAccessibility-config.json"
      );
      const config = {
        baseUrl: "https://example.com",
        relativePaths: [],
        maxPagesToVisit: 10,
      };
      fs.writeFileSync(configFilePath, JSON.stringify(config));

      const loadedConfig = utils.loadConfig();

      expect(loadedConfig).toEqual(config);
      fs.unlinkSync(configFilePath);
    });
  });

  describe("saveResults", () => {
    it("should save results to file", () => {
      const results = [{ url: "https://example.com", violations: [] }];
      const outputPath = path.resolve(
        process.env.npm_config_local_prefix,
        "accessibility-results/accessibility-results.json"
      );

      utils.saveResults(results);

      const savedResults = JSON.parse(fs.readFileSync(outputPath, "utf8"));
      expect(savedResults).toEqual(results);
      fs.unlinkSync(outputPath);
    });
  });
});
