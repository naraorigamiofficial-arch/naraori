import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const PORT = 3300;
export const ADMIN_PASSWORD = "e2e-studio-passphrase";
const salt = randomBytes(16);
const dataDir = path.join(__dirname, "test-results", "e2e-data");

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "off" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } }, testIgnore: /mobile\.spec\.ts/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec\.ts/ },
  ],
  webServer: {
    // Runs the production build with the local file store and file-based email capture.
    command: `rm -rf "${dataDir}" && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NARA_FILE_STORE: "1",
      NARA_DATA_DIR: dataDir,
      NARA_INSECURE_COOKIES: "1",
      STUDIO_NOTIFY_EMAIL: "studio@example.test",
      EMAIL_FROM: "Nara Origami Originals <studio@example.test>",
      STUDIO_SESSION_SECRET: randomBytes(32).toString("base64url"),
      STUDIO_ADMIN_PASSWORD_HASH: `scrypt:${salt.toString("hex")}:${scryptSync(ADMIN_PASSWORD, salt, 64).toString("hex")}`,
    },
  },
});
