//SQL query to insert parsed data on mediums for a work into table work_medium
async function insertWorkMedium(db, workId, medium) {
  const res = await db.query(
    `INSERT INTO work_medium (work_id, medium_name, medium_code, medium_order)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [
      workId,
      medium.medium_name || null,
      medium.medium_code || null,
      medium.medium_order || null,
    ]
  );

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  return null;
}

module.exports = { insertWorkMedium };