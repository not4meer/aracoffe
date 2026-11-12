// .env.test.local değerlerini yükleyip verilen komutu çalıştırır (Next işçi süreçlerine NODE_OPTIONS sızdırmadan).
import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";

const env = { ...process.env };
for (const line of readFileSync(".env.test.local", "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
}
const [cmd, ...args] = process.argv.slice(2);
const child = spawn(cmd, args, { stdio: "inherit", env, shell: process.platform === "win32" });
child.on("exit", (code) => process.exit(code ?? 1));
