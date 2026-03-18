async function insertSource(db, workId, source) {
  const res = await db.query(
    `INSERT INTO source (
      work_id,
      source_type,
      publisher,
      digital_url,
      source_title
    )
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING
    RETURNING id`,
    [
      workId,
      source.source_type,
      source.publisher,
      source.digital_url,
      source.source_title
    ]
  );

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  return null;
}

module.exports = { insertSource };