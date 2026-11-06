// Usage: npm run studio:password -- "your long passphrase"
// Prints a value for STUDIO_ADMIN_PASSWORD_HASH. The password itself is never stored.
import { randomBytes, scryptSync } from "node:crypto";

const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error("Please pass a passphrase of at least 12 characters.");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(pw, salt, 64);
console.log(`STUDIO_ADMIN_PASSWORD_HASH=scrypt:${salt.toString("hex")}:${hash.toString("hex")}`);
console.log(`STUDIO_SESSION_SECRET=${randomBytes(32).toString("base64url")}`);
