/**
 * Netlify CI helpers (GitHub Actions is the primary auto-deploy path).
 * Run: node scripts/setup-netlify-ci.js
 */
const { execSync } = require("child_process");

const SITE_ID = "512e6fa5-d8d9-4062-8340-7adbc199a141";

function api(name, body) {
  const payload = JSON.stringify({ site_id: SITE_ID, ...body });
  return JSON.parse(
    execSync(`netlify api ${name} --data ${JSON.stringify(payload)}`, {
      encoding: "utf8",
    })
  );
}

console.log("Clearing stale publish-directory override...");
api("updateSite", {
  build_settings: {
    cmd: "npm run build",
    dir: "",
    base: "",
    provider: "manual",
  },
});

console.log("Creating build hook (optional backup trigger)...");
const hook = api("createSiteBuildHook", {
  title: "GitHub master",
  branch: "master",
});
console.log("  hook:", hook.url || hook.msg);

console.log("\nPrimary auto-deploy: GitHub Actions (.github/workflows/netlify-deploy.yml)");
console.log("Run: node scripts/setup-github-netlify-secrets.js (once, if secrets missing)");
