//SQL query to insert all metadata found into work table
async function insertWork(db, work, fileName) {
  // Prefer MEI xml:id; fall back to filename
  const externalId = work?.mei_id || fileName || null;

  // Check if the work already exists
  if (externalId) {
    const existing = await db.query(
      "SELECT id FROM work WHERE mei_id = $1",
      [externalId]
    );

    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
  }

  // Insert new work
  const result = await db.query(
    `INSERT INTO work (
      mei_id,
      title_main,
      title_alt,
      catalogue_number,
      classification,
      work_key,
      tempo,
      meter_count,
      meter_unit,
      composition_date_text,
      composition_year_start,
      composition_year_end
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING id`,
    [
      externalId,
      work?.title_main || "Untitled work",
      work?.title_alt || null,
      work?.catalogue_number || null,
      work?.classification || null,
      work?.work_key || null,
      work?.tempo || null,
      work?.meter_count || null,
      work?.meter_unit || null,
      work?.composition_date_text || null,
      work?.composition_year_start || null,
      work?.composition_year_end || null,
    ]
  );

  return result.rows[0].id;
}

module.exports = { insertWork };