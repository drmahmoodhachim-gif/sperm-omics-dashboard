/**
 * Configure GitHub Actions secrets for Netlify cloud deploy.
 * Run once locally: node scripts/setup-github-netlify-secrets.js
 */
const { execSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const SITE_ID = "512e6fa5-d8d9-4062-8340-7adbc199a141";
const BUILD_HOOK = "https://api.netlify.com/build_hooks/6a47874874a97311eced76ae";

const configPath = path.join(
  os.homedir(),
  "AppData/Roaming/netlify/Config/config.json"
);
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const userId = config.userId;
const token = config.users[userId]?.auth?.token;

if (!token) {
  console.error("Run `netlify login` first.");
  process.exit(1);
}

function setSecret(name, value) {
  execSync(`gh secret set ${name} --body "${value}"`, {
    stdio: "inherit",
    cwd: path.join(__dirname, ".."),
  });
  console.log(`✓ ${name}`);
}

console.log("Setting GitHub repository secrets...");
setSecret("NETLIFY_AUTH_TOKEN", token);
setSecret("NETLIFY_SITE_ID", SITE_ID);
setSecret("NETLIFY_BUILD_HOOK", BUILD_HOOK);
console.log("\nDone. Push to master triggers .github/workflows/netlify-deploy.yml");
