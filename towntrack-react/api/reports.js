import { neon } from "@neondatabase/serverless";

let votesTableReady;
let reportLocationColumnsReady;

function send(res, status, body) {
  res.status(status).json(body);
}

function ensureVotesTable(sql) {
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

function ensureReportLocationColumns(sql) {
  if (!reportLocationColumnsReady) {
    reportLocationColumnsReady = sql`
      ALTER TABLE reports
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION
    `.catch((error) => {
      reportLocationColumnsReady = null;
      throw error;
    });
  }
  return reportLocationColumnsReady;
}

export default async function reports(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    send(res, 405, { error: "รองรับเฉพาะ GET และ POST" });
    return;
  }

  if (!process.env.DATABASE_URL) {
    send(res, 503, { error: "ยังไม่ได้ตั้งค่า DATABASE_URL สำหรับ Neon" });
    return;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureVotesTable(sql);
    await ensureReportLocationColumns(sql);

    if (req.method === "GET") {
      res.setHeader("Cache-Control", "no-store, max-age=0");
      const citizenId = String(req.query?.citizen_id || "").slice(0, 200);
      const rows = await sql`
        SELECT
          r.id, r.title, r.description, r.location, r.latitude, r.longitude,
          r.citizen_id, r.created_at,
          (SELECT count(*)::int FROM report_votes v WHERE v.report_id = r.id::text) AS votes,
          EXISTS (
            SELECT 1
            FROM report_votes v
            WHERE v.report_id = r.id::text AND v.voter_id = ${citizenId}
          ) AS has_voted
        FROM reports r
        ORDER BY r.created_at DESC, r.id DESC
      `;
      send(res, 200, rows);
      return;
    }

    const input = req.body;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      send(res, 400, { error: "ข้อมูลคำร้องไม่ถูกต้อง" });
      return;
    }

    if (input.action === "vote") {
      const reportId = String(input.report_id || "").match(/^REQ-(\d+)$/)?.[1];
      const voterId = String(input.citizen_id || "").trim();
      if (!reportId || !voterId || voterId.length > 200) {
        send(res, 400, { error: "ข้อมูลการโหวตไม่ถูกต้อง" });
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
        send(res, 404, { error: "ไม่พบคำร้องนี้ในฐานข้อมูล" });
        return;
      }
      send(res, 200, {
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
    const hasAnyCoordinates =
      input.latitude !== undefined || input.longitude !== undefined;
    const hasCoordinates =
      input.latitude !== undefined && input.latitude !== null &&
      input.longitude !== undefined && input.longitude !== null;
    const latitude = hasCoordinates ? Number(input.latitude) : null;
    const longitude = hasCoordinates ? Number(input.longitude) : null;

    if (!title || title.length > 180) {
      send(res, 400, { error: "หัวข้อคำร้องต้องมีความยาว 1–180 ตัวอักษร" });
      return;
    }
    if (!description || description.length > 5000) {
      send(res, 400, { error: "รายละเอียดคำร้องต้องมีความยาว 1–5,000 ตัวอักษร" });
      return;
    }
    if (!location || location.length > 240) {
      send(res, 400, { error: "กรุณาระบุสถานที่ไม่เกิน 240 ตัวอักษร" });
      return;
    }
    if (!citizenId || citizenId.length > 200) {
      send(res, 400, { error: "ไม่พบข้อมูลผู้แจ้งที่ถูกต้อง" });
      return;
    }
    if (
      hasAnyCoordinates &&
      (!hasCoordinates ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180)
    ) {
      send(res, 400, { error: "พิกัดตำแหน่งไม่ถูกต้อง" });
      return;
    }

    const [, [report]] = await sql.transaction([
      sql`SELECT pg_advisory_xact_lock(740257211)`,
      sql`
        INSERT INTO reports (title, description, location, latitude, longitude, citizen_id)
        VALUES (${title}, ${description}, ${location}, ${latitude}, ${longitude}, ${citizenId})
        RETURNING id, title, description, location, latitude, longitude, citizen_id, created_at
      `,
    ]);
    send(res, 201, report);
  } catch (error) {
    console.error("Vercel reports API failed:", error);
    send(res, 500, { error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" });
  }
}
