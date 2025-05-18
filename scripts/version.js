import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// 读取 package.json
const packageJson = require('../package.json');
const version = packageJson.version;

// 更新 App.tsx 中的版本号
const appPath = path.join(__dirname, '../src/App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

// 使用正则表达式替换版本号
appContent = appContent.replace(
  /<span className="text-sm opacity-60">v\d+\.\d+\.\d+<\/span>/,
  `<span className="text-sm opacity-60">v${version}</span>`
);

fs.writeFileSync(appPath, appContent);

console.log(`版本已更新至 ${version}`); 