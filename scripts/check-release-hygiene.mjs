// Read-only scan of the publishable file set, including untracked files.
// Report paths/categories only; never matched lines or credential values.
import { execFileSync } from "node:child_process";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true }).trim();
const files = [...new Set(git("ls-files", "--cached", "--others", "--exclude-standard", "-z").split("\0").filter(Boolean))];
const findings = [];
let scannedTextFiles = 0;
for (const file of files) {
  const absolute = resolve(root, file);
  if (relative(root, absolute).startsWith("..")) throw new Error("File outside workspace");
  if (/(^|\/)(\.env(\..*)?|.*\.(pem|key|p12|pfx|jks|keystore|dump|backup|zip))$/i.test(file) && file !== ".env.example") findings.push({ file, category: "sensitive-or-archive-filename" });
  if (/(^|\/)(node_modules|\.next|\.vercel|coverage)(\/|$)|\.tsbuildinfo$|(^|\/)local\.properties$/.test(file)) findings.push({ file, category: "generated-file" });
  if (!/\.(ts|tsx|js|mjs|json|md|sql|toml|xml|properties|example|yml|yaml|txt|html|css)$/.test(file)) continue;
  if (statSync(absolute).size > 5_000_000) { findings.push({ file, category: "oversize-text-needs-review" }); continue; }
  const source = readFileSync(absolute, "utf8"); scannedTextFiles++;
  if (/(-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|sk-[A-Za-z0-9]{32,}|AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{16}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,})/.test(source)) findings.push({ file, category: "credential-pattern" });
}
const ignored = git("status", "--ignored", "--short").split(/\r?\n/).filter(line => line.startsWith("!! ")).map(line => line.slice(3));
console.log(JSON.stringify({ publishableFiles: files.length, scannedTextFiles, findings, ignoredPaths: ignored, branch: git("branch", "--show-current"), remoteConfigured: Boolean(git("remote")), trackedFileCount: git("ls-files", "-z").split("\0").filter(Boolean).length }, null, 2));
if (findings.length) process.exitCode = 1;
