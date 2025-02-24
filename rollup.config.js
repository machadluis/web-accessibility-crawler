import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";

export default {
  input: "src/index.mjs", // entry point
  output: {
    file: "dist/bundle.js",
    format: "es", // Use ES module format
    sourcemap: true,
  },
  plugins: [
    resolve({
      preferBuiltins: true,
    }),
    commonjs(),
    json(),
  ],
  external: ["puppeteer", "@axe-core/puppeteer"], // external deps
};