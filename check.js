const fs = require("fs");
const path = "D:\\Development\\pixelpoint\\carinthia-client\\node_modules\\vue-bundle-renderer\\dist\\runtime.mjs";

const stat = fs.lstatSync(path);
console.log({
  isFile: stat.isFile(),
  isDirectory: stat.isDirectory(),
  isSymbolicLink: stat.isSymbolicLink(),
  type: stat
});
