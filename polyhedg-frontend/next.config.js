/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/polyhedg-chart" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/polyhedg-chart/" : "",
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};

export default config;
