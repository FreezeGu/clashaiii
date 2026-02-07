import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);
const parentPackageJson = path.join(projectRoot, "..", "package.json");
const ourPackageJson = path.join(projectRoot, "package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  outputFileTracingRoot: projectRoot,
  webpack: (config, { isServer }) => {
    // Подмена: когда Next/девтулзы запрашивают package.json родительской папки — отдаём наш
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias[parentPackageJson] = ourPackageJson;
    config.resolve.alias[parentPackageJson.replace(/\\/g, "/")] = ourPackageJson;
    return config;
  },
};

export default nextConfig;
