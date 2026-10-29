import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { createServer as createViteServer } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(root, "dist");
try {
  process.loadEnvFile(path.join(root, ".env.local"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const databaseUrl = process.env.DATABASE_URL;
const sql = databaseUrl ? neon(databaseUrl) : null;
const production = process.argv.includes("--production");
let votesTableReady;
const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
};

function respond(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function ensureVotesTable() {
  if (!votesTableReady) {
    votesTableReady = sql`
      CREATE TABLE IF NOT EXISTS report_votes (
        report_id TEXT NOT NULL,
        voter_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        PRIMARY KEY (report_id, voter_id)
      )
    `.catch((error) => {
      votesTableReady = null;
      throw error;
    });
  }
  return votesTableReady;
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 16_384) throw new Error("คำร้องมีขนาดใหญ่เกินไป");
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new Error("ข้อมูลคำร้องไม่ถูกต้อง");
  }
}

async function handleReports(req, res) {
  if (!sql) {
    respond(res, 503, { error: "ยังไม่ได้ตั้งค่า DATABASE_URL สำหรับ Neon" });
    return;
  }

  await ensureVotesTable();

  if (req.method === "GET") {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    const citizenId = new URL(req.url, "http://localhost").searchParams
      .get("citizen_id")
      ?.slice(0, 200) || "";
    const rows = await sql`
      SELECT
        r.id, r.title, r.description, r.location, r.citizen_id, r.created_at,
        (SELECT count(*)::int FROM report_votes v WHERE v.report_id = r.id::text) AS votes,
        EXISTS (
          SELECT 1
          FROM report_votes v
          WHERE v.report_id = r.id::text AND v.voter_id = ${citizenId}
        ) AS has_voted
      FROM reports r
      ORDER BY r.created_at DESC, r.id DESC
    `;
    respond(res, 200, rows);
    return;
  }

  if (req.method === "POST") {
    const input = await readJson(req);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      respond(res, 400, { error: "ข้อมูลคำร้องไม่ถูกต้อง" });
      return;
    }

    if (input.action === "vote") {
      const reportId = String(input.report_id || "").match(/^REQ-(\d+)$/)?.[1];
      const voterId = String(input.citizen_id || "").trim();
      if (!reportId || !voterId || voterId.length > 200) {
        respond(res, 400, { error: "ข้อมูลการโหวตไม่ถูกต้อง" });
        return;
      }

      const [, inserted, [report]] = await sql.transaction([
        sql`SELECT pg_advisory_xact_lock(740257211)`,
        sql`
          INSERT INTO report_votes (report_id, voter_id)
          SELECT id::text, ${voterId}
          FROM reports
          WHERE id::text = ${reportId}
          ON CONFLICT (report_id, voter_id) DO NOTHING
          RETURNING voter_id
        `,
        sql`
          SELECT
            r.id,
            (SELECT count(*)::int FROM report_votes v WHERE v.report_id = r.id::text) AS votes
          FROM reports r
          WHERE r.id::text = ${reportId}
        `,
      ]);
      if (!report) {
        respond(res, 404, { error: "ไม่พบคำร้องนี้ในฐานข้อมูล" });
        return;
      }
      respond(res, 200, {
        votes: report.votes,
        voted: true,
        alreadyVoted: inserted.length === 0,
      });
      return;
    }

    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();
    const location = String(input.location || "").trim();
    const citizenId = String(input.citizen_id || "").trim();

    if (!title || title.length > 180) {
      respond(res, 400, { error: "หัวข้อคำร้องต้องมีความยาว 1–180 ตัวอักษร" });
      return;
    }
    if (!description || description.length > 5000) {
      respond(res, 400, { error: "รายละเอียดคำร้องต้องมีความยาว 1–5,000 ตัวอักษร" });
      return;
    }
    if (!location || location.length > 240) {
      respond(res, 400, { error: "กรุณาระบุสถานที่ไม่เกิน 240 ตัวอักษร" });
      return;
    }
    if (!citizenId || citizenId.length > 200) {
      respond(res, 400, { error: "ไม่พบข้อมูลผู้แจ้งที่ถูกต้อง" });
      return;
    }

    const [, [report]] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(740257211)`,
      sql`
        INSERT INTO reports (title, description, location, citizen_id)
        VALUES (${title}, ${description}, ${location}, ${citizenId})
        RETURNING id, title, description, location, citizen_id, created_at
      `,
    ]);
    respond(res, 201, report);
    return;
  }

  res.setHeader("Allow", "GET, POST");
  respond(res, 405, { error: "รองรับเฉพาะ GET และ POST" });
}

async function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const requestedPath = path.resolve(dist, `.${pathname}`);
  if (requestedPath !== dist && !requestedPath.startsWith(dist + path.sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  let file = requestedPath;
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
  } catch {
    file = path.join(dist, "index.html");
  }

  try {
    const content = await readFile(file);
    res.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(file)] || "application/octet-stream",
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const vite = production
  ? null
  : await createViteServer({
      configFile: path.join(root, "vite.config.js"),
      server: { middlewareMode: true },
      appType: "spa",
    });

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url, "http://localhost").pathname;
  if (pathname === "/api/reports") {
    try {
      await handleReports(req, res);
    } catch (error) {
      console.error("Neon reports request failed:", error);
      if (!res.headersSent) respond(res, 500, { error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" });
    }
    return;
  }

  if (vite) {
    vite.middlewares(req, res, (error) => {
      if (error) {
        vite.ssrFixStacktrace(error);
        console.error(error);
        if (!res.headersSent) {
          res.writeHead(500);
          res.end("Internal server error");
        }
      }
    });
    return;
  }

  await serveStatic(req, res);
});

const portArg = process.argv.indexOf("--port");
const port = Number(
  process.env.PORT || (portArg >= 0 ? process.argv[portArg + 1] : 5173),
);
const host = process.env.HOST || (production ? "0.0.0.0" : "127.0.0.1");
const strictPort = Boolean(process.env.PORT) || process.argv.includes("--strictPort");

async function listen(portToTry) {
  try {
    await new Promise((resolve, reject) => {
      const onError = (error) => reject(error);
      server.once("error", onError);
      server.listen(portToTry, host, () => {
        server.removeListener("error", onError);
        resolve();
      });
    });
  } catch (error) {
    if (error.code !== "EADDRINUSE" || strictPort || portToTry >= 65535) {
      throw error;
    }
    console.warn(`Port ${portToTry} is in use, trying ${portToTry + 1}...`);
    return listen(portToTry + 1);
  }
}

try {
  await listen(port);
  const address = server.address();
  console.log(`TownTrack ${production ? "server" : "dev server"} listening on http://${host}:${address.port}`);
  if (!sql) console.warn("DATABASE_URL is not set; the reports API will return HTTP 503.");
} catch (error) {
  console.error(`Could not start TownTrack server: ${error.message}`);
  process.exitCode = 1;
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, async () => {
    server.close();
    if (vite) await vite.close();
  });
}
