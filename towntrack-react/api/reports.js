import { neon } from "@neondatabase/serverless";
import { REPORT_LIMIT } from "../src/report-limit.js";

function send(res, status, body) {
  res.status(status).json(body);
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

    if (req.method === "GET") {
      const rows = await sql`
        SELECT id, title, description, location, citizen_id, created_at
        FROM reports
        ORDER BY created_at DESC, id DESC
        LIMIT ${REPORT_LIMIT}
      `;
      send(res, 200, rows);
      return;
    }

    const input = req.body;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      send(res, 400, { error: "ข้อมูลคำร้องไม่ถูกต้อง" });
      return;
    }

    const title = String(input.title || "").trim();
    const description = String(input.description || "").trim();
    const location = String(input.location || "").trim();
    const citizenId = String(input.citizen_id || "").trim();

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

    const [report] = await sql`
      WITH inserted AS (
      INSERT INTO reports (title, description, location, citizen_id)
      VALUES (${title}, ${description}, ${location}, ${citizenId})
      RETURNING id, title, description, location, citizen_id, created_at
      ),
      pruned AS (
        DELETE FROM reports
        WHERE id IN (
          SELECT id
          FROM reports
          ORDER BY created_at DESC, id DESC
          OFFSET ${REPORT_LIMIT}
        )
        RETURNING id
      )
      SELECT * FROM inserted
    `;
    send(res, 201, report);
  } catch (error) {
    console.error("Vercel reports API failed:", error);
    send(res, 500, { error: "เชื่อมต่อฐานข้อมูลไม่สำเร็จ" });
  }
}
