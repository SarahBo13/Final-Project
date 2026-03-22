//SQL query to insert found movements in a work into table movement
async function insertMovement(db, workId, movement) {
  const res = await db.query(
    `INSERT INTO movement (work_id, position, title)
     VALUES ($1, $2, $3)
     ON CONFLICT DO NOTHING
     RETURNING id`,
    [workId, movement.position, movement.title]
  );

  if (res.rows.length > 0) {
    return res.rows[0].id;
  }

  return null;
}

module.exports = { insertMovement };