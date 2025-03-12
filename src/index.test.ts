import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { main } from "./index";

vi.mock("fs");
vi.mock("path");

describe("main function", () => {
  it("should throw an error if the configuration file is not found", async () => {
    const configFilePath = path.resolve(
      process.cwd(),
      "webAccessibility-config.json"
    );

    vi.spyOn(path, "resolve").mockReturnValue(configFilePath);
    vi.spyOn(fs, "existsSync").mockReturnValue(false);
    const consoleErrorMock = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const processExitMock = vi
      .spyOn(process, "exit")
      .mockImplementation((code) => {
        throw new Error(`process.exit called with code ${code}`);
      });

    await expect(main()).rejects.toThrow("Configuration file not found");

    expect(consoleErrorMock).toHaveBeenCalledWith(
      `Configuration file not found at ${configFilePath}`
    );

    consoleErrorMock.mockRestore();
    processExitMock.mockRestore();
    vi.restoreAllMocks();
  });
});