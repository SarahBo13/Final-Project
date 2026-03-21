const express = require("express");
const cors = require("cors");
const db = require("./db/db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW() as now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ ok: false, error: "DB connection failed" });
  }
});

// Work list with basic + advanced search
app.get("/api/works", async (req, res) => {
  try {
    const { q, title, composer, classification, medium, work_key, tempo, meter_count, meter_unit, composition_year_start, composition_year_end } = req.query;

    const conditions = [];
    const values = [];
    let i = 1;

    // ----------------------------
    // BASIC SEARCH
    // Searches across title, alt title, catalogue number, and composer
    // ----------------------------
    if (q && q.trim()) {
      conditions.push(`
        (
          w.title_main ILIKE $${i}
          OR w.title_alt ILIKE $${i}
          OR w.catalogue_number ILIKE $${i}
          OR EXISTS (
            SELECT 1
            FROM work_person wp
            JOIN person p ON p.id = wp.person_id
            WHERE wp.work_id = w.id
              AND wp.role = 'composer'
              AND p.name ILIKE $${i}
          )
          OR EXISTS (
            SELECT 1
            FROM work_medium wm
            WHERE wm.work_id = w.id
              AND wm.medium_code IN (
                SELECT wm2.medium_code
                FROM work_medium wm2
                WHERE wm2.medium_name ILIKE $${i}
              )
          )
        )
      `);
      values.push(`%${q.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: title
    // ----------------------------
    if (title && title.trim()) {
      conditions.push(`
        (
          w.title_main ILIKE $${i}
          OR w.title_alt ILIKE $${i}
        )
      `);
      values.push(`%${title.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: composer
    // ----------------------------
    if (composer && composer.trim()) {
      conditions.push(`
        EXISTS (
          SELECT 1
          FROM work_person wp
          JOIN person p ON p.id = wp.person_id
          WHERE wp.work_id = w.id
            AND wp.role = 'composer'
            AND p.name ILIKE $${i}
        )
      `);
      values.push(`%${composer.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: classification
    // Searches against a cleaned string version
    // ----------------------------
    if (classification && classification.trim()) {
      conditions.push(`
        REPLACE(REPLACE(REPLACE(w.classification, '{', ''), '}', ''), '"', '') ILIKE $${i}
      `);
      values.push(`%${classification.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: medium
    // ----------------------------
    if (medium && medium.trim()) {
      conditions.push(`
        wm.medium_code IN (
          SELECT DISTINCT medium_code
          FROM work_medium
          WHERE medium_name ILIKE $${i}
        )
      `);
      values.push(`%${medium.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: work key
    // ----------------------------
    if (work_key && work_key.trim()) {
      conditions.push(`w.work_key ILIKE $${i}`);
      values.push(`%${work_key.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: tempo
    // ----------------------------
    if (tempo && tempo.trim()) {
      conditions.push(`w.tempo ILIKE $${i}`);
      values.push(`%${tempo.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: meter_count
    // ----------------------------
    if (meter_count && meter_count.trim()) {
      conditions.push(`CAST(w.meter_count AS TEXT) ILIKE $${i}`);
      values.push(`%${meter_count.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: meter_unit
    // ----------------------------
    if (meter_unit && meter_unit.trim()) {
      conditions.push(`CAST(w.meter_unit AS TEXT) ILIKE $${i}`);
      values.push(`%${meter_unit.trim()}%`);
      i++;
    }

    // ----------------------------
    // ADVANCED: composition_year_start to composition_year_end
    // ----------------------------
    if (composition_year_start && composition_year_end) {
      conditions.push(`
        w.composition_year_start IS NOT NULL
        AND w.composition_year_end IS NOT NULL
        AND w.composition_year_start <= $${i}
        AND w.composition_year_end >= $${i + 1}
      `);
      values.push(Number(composition_year_end));
      values.push(Number(composition_year_start));
      i += 2;
    }
    else if (composition_year_start) {
      conditions.push(`
        w.composition_year_end IS NOT NULL
        AND w.composition_year_end >= $${i}`);
      values.push(Number(composition_year_start));
      i++;
    }
    else if (composition_year_end) {
      conditions.push(`
        w.composition_year_start IS NOT NULL
        AND w.composition_year_start <= $${i}`);
      values.push(Number(composition_year_end));
      i++;
    }

    let query = `
      SELECT DISTINCT
        w.id,
        w.title_main,
        w.title_alt,
        w.catalogue_number,
        w.composition_date_text,
        w.composition_year_start,
        w.composition_year_end,
        w.work_key,
        w.tempo,
        w.meter_count,
        w.meter_unit,
        REPLACE(REPLACE(REPLACE(w.classification, '{', ''), '}', ''), '"', '') AS classification,

        (
          SELECT string_agg(DISTINCT wm2.medium_name, ', ')
          FROM work_medium wm2
          WHERE wm2.work_id = w.id
        ) AS medium,

        (
          SELECT string_agg(p.name, ', ')
          FROM work_person wp
          JOIN person p ON p.id = wp.person_id
          WHERE wp.work_id = w.id
            AND wp.role = 'composer'
        ) AS composer

      FROM work w
      LEFT JOIN work_medium wm ON wm.work_id = w.id
    `;

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY w.title_main ASC`;

    const result = await db.query(query, values);
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching works:", err);
    res.status(500).json({ error: "Failed to fetch works" });
  }
});

// Single work with details
app.get("/api/works/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const workRes = await db.query(
      `
      SELECT
        id,
        mei_id,
        title_main,
        title_alt,
        catalogue_number,
        REPLACE(REPLACE(REPLACE(classification, '{', ''), '}', ''), '"', '') AS classification,
        composition_date_text,
        composition_year_start,
        composition_year_end,
        work_key,
        tempo,
        meter_count,
        meter_unit
      FROM work
      WHERE id = $1
      `,
      [id]
    );

    if (workRes.rows.length === 0) {
      return res.status(404).json({ error: "Work not found" });
    }

    const work = workRes.rows[0];

    const personsRes = await db.query(
      `
      SELECT p.id, p.name, wp.role
      FROM work_person wp
      JOIN person p ON p.id = wp.person_id
      WHERE wp.work_id = $1
      `,
      [id]
    );

    const movementsRes = await db.query(
      `
      SELECT id, position, title
      FROM movement
      WHERE work_id = $1
      ORDER BY position
      `,
      [id]
    );

    const sourcesRes = await db.query(
      `
      SELECT id, source_type, publisher, source_title, digital_url
      FROM source
      WHERE work_id = $1
      `,
      [id]
    );

    const mediumRes = await db.query(
      `
      SELECT medium_name, medium_code
      FROM work_medium
      WHERE work_id = $1
      ORDER BY medium_name;
      `,
      [id]
    );

    work.persons = personsRes.rows;
    work.movements = movementsRes.rows;
    work.sources = sourcesRes.rows;
    work.mediums = mediumRes.rows;

    res.json(work);
  } catch (err) {
    console.error("Error fetching work detail:", err);
    res.status(500).json({ error: "Failed to fetch work" });
  }
});

app.listen(PORT, () => {
  console.log(`MerMEId catalogue API listening on port ${PORT}`);
});