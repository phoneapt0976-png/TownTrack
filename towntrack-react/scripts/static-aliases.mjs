import { copyFile, mkdir } from "node:fs/promises";

const roles = ["citizen", "staff", "supervisor", "worker", "authority", "information"];
await Promise.all(
  roles.flatMap((role) => [
    copyFile("dist/index.html", `dist/${role}.html`),
    mkdir(`dist/${role}`, { recursive: true }).then(() =>
      copyFile("dist/index.html", `dist/${role}/index.html`),
    ),
  ]),
);
await mkdir("dist/auth/callback", { recursive: true });
await copyFile("dist/index.html", "dist/auth/callback/index.html");
