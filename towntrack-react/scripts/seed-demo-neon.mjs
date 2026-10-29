import { initialize } from "../src/model.js";
import { REPORT_LIMIT } from "../src/report-limit.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL in towntrack-react/.env.local before seeding.",
  );
}

const { neon } = await import("@neondatabase/serverless");
const sql = neon(connectionString);
const issues = initialize(Date.now(), REPORT_LIMIT).issues;
const removed = await sql`
  DELETE FROM reports
  WHERE id IN (
    SELECT id
    FROM reports
    ORDER BY created_at DESC, id DESC
    OFFSET ${REPORT_LIMIT}
  )
  RETURNING id
`;
const [counts] = await sql`
  SELECT count(*)::int AS total
  FROM reports
`;
const availableSlots = Math.max(0, REPORT_LIMIT - counts.total);

const rows = issues.map((issue) => ({
  title: `[ข้อมูลจำลอง] ${issue.title}`,
  description: issue.description,
  location: issue.place,
  citizen_id: `towntrack-mock:${issue.id}`,
}));
const inserted = await sql`
  INSERT INTO reports (title, description, location, citizen_id)
  SELECT seed.title, seed.description, seed.location, seed.citizen_id
  FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb)
    AS seed(title text, description text, location text, citizen_id text)
  WHERE NOT EXISTS (
    SELECT 1
    FROM reports AS existing
    WHERE existing.citizen_id = seed.citizen_id
  )
  ORDER BY seed.citizen_id
  LIMIT ${availableSlots}
  RETURNING id
`;

console.log(
  `Seed complete in reports: ${inserted.length} inserted, ${removed.length} older reports removed; ${counts.total + inserted.length} of ${REPORT_LIMIT} slots are now used.`,
);
