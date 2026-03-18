const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const db = require("./db");

async function parseMeiFile(filePath) {
  const xml = fs.readFileSync(filePath, "utf-8");
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xml);
  return result;
}

function findWorkNode(meiRoot) {
  if (!meiRoot) {
    throw new Error("No <mei> root in MEI JSON");
  }

  // Case A: <meiHead><workList><work>...</work></workList></meiHead>
  if (meiRoot.meiHead && meiRoot.meiHead.workList && meiRoot.meiHead.workList.work) {
    const wl = meiRoot.meiHead.workList;
    return Array.isArray(wl.work) ? wl.work[0] : wl.work;
  }

  // Case B: <work> directly under <mei>
  if (meiRoot.work) {
    return Array.isArray(meiRoot.work) ? meiRoot.work[0] : meiRoot.work;
  }

  // Case C: <workList><work> directly under <mei>
  if (meiRoot.workList && meiRoot.workList.work) {
    const wl = meiRoot.workList;
    return Array.isArray(wl.work) ? wl.work[0] : wl.work;
  }

  // Case D: under <music><body>...
  if (meiRoot.music && meiRoot.music.body) {
    const body = meiRoot.music.body;

    if (body.work) {
      return Array.isArray(body.work) ? body.work[0] : body.work;
    }

    if (body.workList && body.workList.work) {
      const wl = body.workList;
      return Array.isArray(wl.work) ? wl.work[0] : wl.work;
    }
  }

  throw new Error("Could not find <work> element in any known location");
}

//helper function to find any <persName>. MEI allows contributors to be encoded at diff structural levels -> Instead of relying on fixed paths, recursive traversal is used to identify all <persName> elements within a work, followed by role-based filtering.
function collectPersNames(node, results = []) {
  if (!node || typeof node !== "object") return results;

  // If this node *is* a <persName>
  if (node.persName) {
    const pers = Array.isArray(node.persName)
      ? node.persName
      : [node.persName];

    for (const p of pers) {
      results.push(p);
    }
  }

  // Recurse into all child properties
  for (const key of Object.keys(node)) {
    const child = node[key];

    if (Array.isArray(child)) {
      for (const c of child) {
        collectPersNames(c, results);
      }
    } else if (typeof child === "object") {
      collectPersNames(child, results);
    }
  }

  return results;
}

function getWorkData(meiJson) {
  const mei = meiJson.mei;
  const work = findWorkNode(mei);  // using helper function to locate correct element

  const meiId = work.$ && work.$["xml:id"] ? work.$["xml:id"] : null;

  // Titles: could be an array or single object
  let titles = [];
  if (Array.isArray(work.title)) {
    titles = work.title;
  } else if (work.title) {
    titles = [work.title];
  }

  const titleMain = titles.length > 0
    ? (typeof titles[0] === "string" ? titles[0] : titles[0]._ || "")
    : "Untitled work";

  const altTitles = titles.slice(1).map((t) =>
    typeof t === "string" ? t : t._ || ""
  );
  const titleAlt = altTitles.length > 0 ? altTitles.join(" | ") : null;

  const catalogueNumber = null; // can refine later

  return {
    mei_id: meiId,
    title_main: titleMain.trim(),
    title_alt: titleAlt,
    catalogue_number: catalogueNumber,
    genre: null,
    notes: null,
  };
}


function getPersons(meiJson) {
  const mei = meiJson.mei;
  const work = findWorkNode(mei);
  if (!work) return [];

  const allowedRoles = [
    "composer",
    "librettist",
    "arranger",
    "translator",
    "poet",
    "editor",
  ];

  const rawPersNames = collectPersNames(work);
  const result = [];
  const seen = new Set(); // deduplicate name+role

  for (const p of rawPersNames) {
    const attrs = p.$ || {};
    const name =
      typeof p === "string"
        ? p.trim()
        : (p._ || "").trim();

    if (!name) continue;

    const role = attrs.role ? attrs.role.toLowerCase() : null;
    if (!role || !allowedRoles.includes(role)) continue;

    const key = `${name}|${role}`;
    if (seen.has(key)) continue;
    seen.add(key);

    result.push({
      name,
      role,
      authority_id: attrs.codedval || null,
    });
  }

  console.log("Collected persons:", result);
  return result;
}

async function importBeethoven() {
  const filePath = path.join(__dirname, "..", "mei_samples", "raw", "Beethoven_Hymn_to_joy.mei");
  const meiJson = await parseMeiFile(filePath);

  const workData = getWorkData(meiJson);
  const persons = getPersons(meiJson);

  // Insert work
  const workRes = await db.query(
    `INSERT INTO work (mei_id, title_main, title_alt, catalogue_number, genre, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      workData.mei_id,
      workData.title_main,
      workData.title_alt,
      workData.catalogue_number,
      workData.genre,
      workData.notes,
    ]
  );

  const workId = workRes.rows[0].id;
  console.log("Inserted work with id:", workId);

  // Insert persons (deduplicate by name within this import)
  for (const p of persons) {
    // Try to find existing person by name
    const existing = await db.query(
      "SELECT id FROM person WHERE name = $1",
      [p.name]
    );

    let personId;
    if (existing.rows.length > 0) {
      personId = existing.rows[0].id;
    } else {
      const personRes = await db.query(
        "INSERT INTO person (name, authority_id) VALUES ($1, $2) RETURNING id",
        [p.name, p.authority_id]
      );
      personId = personRes.rows[0].id;
      console.log("Inserted person:", p.name, "id:", personId);
    }

    await db.query(
      "INSERT INTO work_person (work_id, person_id, role) VALUES ($1, $2, $3)",
      [workId, personId, p.role]
    );
    console.log(`Linked person ${p.name} to work with role ${p.role}`);
  }

  console.log("Import done.");
}

importBeethoven()
  .then(() => {
    console.log("Finished import");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
