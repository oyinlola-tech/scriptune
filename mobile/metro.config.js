// Metro config. expo-sqlite on web ships SQLite as WebAssembly, which Metro
// only serves once "wasm" counts as an asset; the two headers let the browser
// give that worker a SharedArrayBuffer. Without this the web build fails to
// resolve ./wa-sqlite/wa-sqlite.wasm and never loads.
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("wasm");
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return middleware(req, res, next);
  },
};

module.exports = config;
