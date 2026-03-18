async function insertPerson(db, p) {
  const existing = await db.query(
    "SELECT id FROM person WHERE name = $1",
    [p.name]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const res = await db.query(
    `INSERT INTO person (name, authority_id)
     VALUES ($1, $2)
     RETURNING id`,
    [p.name, p.authority_id]
  );

  return res.rows[0].id;
}

async function linkWorkPerson(db, workId, personId, role) {
  const existing = await db.query(
    `SELECT id FROM work_person
     WHERE work_id = $1 AND person_id = $2 AND role = $3`,
    [workId, personId, role]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const res = await db.query(
    `INSERT INTO work_person (work_id, person_id, role)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [workId, personId, role]
  );

  return res.rows[0].id;
}

module.exports = {
  insertPerson,
  linkWorkPerson
};