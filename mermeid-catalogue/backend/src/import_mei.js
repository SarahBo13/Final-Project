const fs = require("fs");
const path = require("path");
const xml2js = require("xml2js");
const db = require("./db");

const MEI_DIR = path.join(__dirname, "..", "mei_samples");
// const MEI_DIR = path.join(__dirname, "..", "test_data/mei");

// -- HELPER FUNCTIONS -- //
// -- Helper Function to parse MEI -- //

// Async parser function
async function parseMeiFile(filePath) {
  const xml = fs.readFileSync(filePath, "utf-8");
  const parser = new xml2js.Parser({ explicitArray: false });
  const result = await parser.parseStringPromise(xml);
  return result;
}

// Helper function to find find nodes by key anywhere
function collectNodesByKey(node, key, results = []) {
  if (!node || typeof node !== "object") return results;

  if (Object.prototype.hasOwnProperty.call(node, key)) {
    const val = node[key];
    if (Array.isArray(val)) results.push(...val);
    else results.push(val);
  }

  for (const k of Object.keys(node)) {
    const child = node[k];
    if (Array.isArray(child)) {
      for (const c of child) collectNodesByKey(c, key, results);
    } else if (typeof child === "object") {
      collectNodesByKey(child, key, results);
    }
  }
  return results;
}


// -- Helper Function to find <work> node in MEI  -- //

function findWorkNode(meiRoot) {
  if (!meiRoot) {
    throw new Error("No MEI JSON object");
  }

  // xml2js often gives { mei: { ... } } as the top-level,
  // so unwrap if needed:
  const root = meiRoot.mei || meiRoot;

  // ---------------------------
  // Case 1: <meiHead><workList><work>
  // ---------------------------
  if (
    root.meiHead &&
    root.meiHead.workList &&
    root.meiHead.workList.work
  ) {
    const wl = root.meiHead.workList;
    return Array.isArray(wl.work) ? wl.work[0] : wl.work;
  }

  // Optional: <meiHead><work> directly
  if (root.meiHead && root.meiHead.work) {
    const w = root.meiHead.work;
    return Array.isArray(w) ? w[0] : w;
  }

  // ---------------------------
  // Case 2: <work> directly under <mei>
  // ---------------------------
  if (root.work) {
    return Array.isArray(root.work) ? root.work[0] : root.work;
  }

  // ---------------------------
  // Case 3: <workList><work> under <mei>
  // ---------------------------
  if (root.workList && root.workList.work) {
    const wl = root.workList;
    return Array.isArray(wl.work) ? wl.work[0] : wl.work;
  }

  // ---------------------------
  // Case 4: <music><body> or <music><body><workList>
  // ---------------------------
  if (root.music && root.music.body) {
    const body = root.music.body;

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

// -- Helper Function to recursively collect all <persName> nodes under a given node -- //
function collectPersNames(node, results = []) {
  if (!node || typeof node !== "object") return results; //return empty array of no node given 

  //<persName> directly under given node or child node if function called recursively 
  if (node.persName) {
    const pers = Array.isArray(node.persName) ? node.persName : [node.persName];
    for (const p of pers) {
      results.push(p);
    }
  }

  //Recursively collect all <persName> if found in child nodes
  for (const key of Object.keys(node)) {
    const child = node[key];

    if (Array.isArray(child)) {
      for (const c of child) {
        if (typeof c === "object") collectPersNames(c, results);
      }
    } else if (typeof child === "object") {
      collectPersNames(child, results);
    }
  }

  return results;
}

// ---------- Utility helpers ----------

function asArray(x) {
  return Array.isArray(x) ? x : x ? [x] : [];
}

function textOf(x) {
  if (!x) return null;

  if (typeof x === "string") {
    const t = x.trim();
    return t ? t : null;
  }

  if (typeof x === "object" && typeof x._ === "string") {
    const t = x._.trim();
    return t ? t : null;
  }

  return null;
}

// Extract full text from node (handles nested tags like <titlePart>)
function deepText(x) {
  if (x == null) return null;

  if (typeof x === "string") {
    const t = x.trim();
    return t ? t : null;
  }

  if (typeof x === "object") {
    const parts = [];

    if (typeof x._ === "string") {
      const t = x._.trim();
      if (t) parts.push(t);
    }

    for (const key of Object.keys(x)) {
      if (key === "$" || key === "_") continue;
      for (const c of asArray(x[key])) {
        const t = deepText(c);
        if (t) parts.push(t);
      }
    }

    const joined = parts.join(" ").replace(/\s+/g, " ").trim();
    return joined ? joined : null;
  }

  return null;
}

// Only read direct child tag (not recursive)
function directChildDeepText(node, key) {
  if (!node || typeof node !== "object") return null;
  const val = node[key];
  if (!val) return null;
  return deepText(asArray(val)[0]);
}

function pickDirectTextFromKeys(node, keys) {
  for (const k of keys) {
    const t = directChildDeepText(node, k);
    if (t) return t;
  }
  return null;
}


// ---------- Movement extraction ----------

function getMovements(mei) {
  const movements = [];

  // ==================================================
  // Pattern 1: Multiple <work> entries in <workList>
  // (each with xml:id containing "movement")
  // ==================================================

  const workListWorks =
    mei?.meiHead?.workList?.work ||
    mei?.workList?.work ||
    null;

  const worksInList = workListWorks ? asArray(workListWorks) : [];

  // Only treat this as movements if:
  //  - there is more than one work
  //  - AND at least one has xml:id including "movement"
  const movementWorks = worksInList.filter((w) => {
    const attrs = w.$ || {};
    const id = (attrs["xml:id"] || "").toLowerCase();
    return id.includes("movement");
  });

  if (movementWorks.length > 1) {
    movementWorks.forEach((w, idx) => {
      if (!w || typeof w !== "object") return;

      const attrs = w.$ || {};
      const pos = attrs.n ? Number(attrs.n) || idx + 1 : idx + 1;

      const title =
        pickDirectTextFromKeys(w, ["title"]) ||
        `Movement ${pos}`;

      movements.push({
        position: pos,
        title,
      });
    });

    // We’ve positively detected explicit "movement" works,
    // so we can return them directly.
      const result = finalizeMovements(movements);
      validateMovements(result);
      return result;
  }

    // ==================================================
  // Pattern 2: <mdiv> under <body> (each mdiv = movement)
  // ==================================================

  // Some MEI encodings model each movement as an <mdiv> inside <body>.
  // To avoid over-detecting, only treat this as multi-movement
  // if there is more than one <mdiv>.
  const body =
    mei?.mei?.music?.body ||
    mei?.music?.body ||
    null;

  const mdivs = body?.mdiv ? asArray(body.mdiv) : [];

  if (mdivs.length > 1) {
    mdivs.forEach((node, idx) => {
      if (!node || typeof node !== "object") return;

      const attrs = node.$ || {};
      const pos = attrs.n ? Number(attrs.n) || idx + 1 : idx + 1;

      // Try typical places for a movement title:
      //   <mdiv><title>, <mdiv><label>, or <mdiv><head><title>/<label>
      const title =
        pickDirectTextFromKeys(node, ["title", "label"]) ||
        (node.head
          ? pickDirectTextFromKeys(node.head, ["title", "label"])
          : null) ||
        `Movement ${pos}`;

      movements.push({
        position: pos,
        title,
      });
    });

      const result = finalizeMovements(movements);
      validateMovements(result);
      return result;
  }

  // ==================================================
  // Pattern 3: <movement> or <component> under <work>
  // (explicit movement markup)
  // ==================================================

  let work = null;
  try {
    work = findWorkNode(mei);
  } catch {
    work = null;
  }

  if (work) {
    const movementNodes = [
      ...(work.movement ? asArray(work.movement) : []),
      ...(work.component ? asArray(work.component) : []),
    ];

    if (movementNodes.length > 0) {
      movementNodes.forEach((node, idx) => {
        if (!node || typeof node !== "object") return;

        const attrs = node.$ || {};
        const pos = attrs.n ? Number(attrs.n) || idx + 1 : idx + 1;

        const title =
          pickDirectTextFromKeys(node, ["title", "label", "tempo"]) ||
          `Movement ${pos}`;

        movements.push({
          position: pos,
          title,
        });
      });

      const result = finalizeMovements(movements);
      validateMovements(result);
      return result;
    }
  }

  // ==================================================
  // No explicit movement markers found
  // -> this is treated as a single-movement work (no entries)
  // ==================================================

  return [];
}

// ---------- Final normalization ----------

function validateMovements(movements) {
  if (!Array.isArray(movements)) {
    console.warn("[movements] result is not an array");
    return;
  }

  movements.forEach((m, index) => {
    if (typeof m.position !== "number") {
      console.warn(`[movements] movement ${index} has invalid position`, m);
    }
    if (!("title" in m)) {
      console.warn(`[movements] movement ${index} has no title field`, m);
    }
  });
}

function finalizeMovements(movements) {
  movements.sort((a, b) => a.position - b.position);

  const seen = new Set();
  const deduped = [];

  for (const m of movements) {
    const key = `${m.position}|${m.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(m);
  }

  return deduped;
}
// -- Helper functions to find all <sources>-like things -- //

// Reuse your helpers:
// - asArray(x)
// - textOf(node)

// Extract a "source" object from a <bibl> element (current behaviour)
function sourceFromBibl(bibl) {
  if (!bibl) return null;

  const identifiers = asArray(bibl.identifier);

  // 1. Digital URL (identifier type="URI")
  const uriIdentifier = identifiers.find((id) => {
    const attrs = id?.$ || {};
    return (attrs.type || "").toLowerCase() === "uri";
  });
  const digital_url = textOf(uriIdentifier);

  // 2. Shelfmark (identifier type="shelfmark" or <idno>)
  const shelfIdentifier = identifiers.find((id) => {
    const attrs = id?.$ || {};
    return (attrs.type || "").toLowerCase() === "shelfmark";
  });

  const shelfmark =
    textOf(shelfIdentifier) ||
    textOf(bibl.idno) ||      // sometimes encoded as <idno>
    null;

  // 3. Repository detection
  const repository =
    textOf(bibl.repository) ||
    textOf(bibl.settlement) ||
    textOf(bibl.institution) ||
    textOf(bibl.collection) ||
    null;

  // 4. Title
  const title = textOf(bibl.title);

  // 5. Publisher / imprint info
  const publisher = textOf(bibl?.imprint?.respStmt?.corpName);

  const addrLines = asArray(bibl?.imprint?.address?.addrLine)
    .map(textOf)
    .filter(Boolean);

  const imprintAnnot = textOf(bibl?.imprint?.annot);

  const noteParts = [];
  if (title) noteParts.push(title);
  if (publisher) noteParts.push(`Publisher: ${publisher}`);
  if (addrLines.length > 0) noteParts.push(`Address: ${addrLines.join(", ")}`);
  if (imprintAnnot) noteParts.push(imprintAnnot);

  const notes = noteParts.length > 0 ? noteParts.join(" | ") : null;

  if (!digital_url && !repository && !shelfmark && !notes) return null;

  return {
    source_type: "bibl",
    repository,
    shelfmark,
    digital_url: digital_url || null,
    notes,
  };
}

// Extract a "source" object from a <manifestation> element (FRBR style)
function sourceFromManifestation(man) {
  if (!man) return null;

  const identifiers = asArray(man.identifier);

  // identifier type="URI" as digital URL
  const uriIdentifier = identifiers.find((id) => {
    const attrs = id?.$ || {};
    return (attrs.type || "").toLowerCase() === "uri";
  });

  const digital_url = textOf(uriIdentifier);

  // --- Handle titles as array ---
  const titles = asArray(man?.titleStmt?.title)
    .map(textOf)
    .filter(Boolean);

  const notes = titles.length ? titles.join(" | ") : null;

  // No repository/shelfmark in your Beethoven snippet; keep null for now.
  const repository = null;
  const shelfmark = null;

  if (!digital_url && !notes) return null;

  return {
    source_type: "manifestation",
    repository,
    shelfmark,
    digital_url: digital_url || null,
    notes,
  };
}

function getSources(meiJson) {
  const mei = meiJson.mei;
  const results = [];

  // -----------------------------------
  // A) Old-style <fileDesc><sourceDesc><source><bibl>
  // -----------------------------------
  const sourceDesc = mei?.meiHead?.fileDesc?.sourceDesc || null;
  if (sourceDesc) {
    const sources = asArray(sourceDesc.source);
    for (const s of sources) {
      const bibl = s?.bibl;
      if (!bibl) continue;

      const src = sourceFromBibl(bibl);
      if (src) results.push(src);
    }
  }

  // -----------------------------------
  // B) FRBR-style <manifestationList><manifestation>
  // -----------------------------------
  const manifestationList = mei?.meiHead?.manifestationList;
  if (manifestationList?.manifestation) {
    const mans = asArray(manifestationList.manifestation);
    for (const man of mans) {
      const src = sourceFromManifestation(man);
      if (src) results.push(src);
    }
  }

  // -----------------------------------
  // Deduplicate (same logic as before)
  // -----------------------------------
  const seen = new Set();
  const deduped = [];

  for (const r of results) {
    const key = `${r.source_type || ""}|${r.repository || ""}|${r.shelfmark || ""}|${r.digital_url || ""}|${r.notes || ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  return deduped;
}


// CONTINUE TO COMMENT
// -- EXTRACTOR FUNCTIONS -- //

function getWorkData(meiJson) {
  const mei = meiJson?.mei;
  if (!mei) {
  throw new Error("No <mei> root found in MEI JSON");
  }

  const work = findWorkNode(mei);

  const meiId = work.$ && work.$["xml:id"] ? work.$["xml:id"] : null;

  // Titles: could be an array or single object or string
  let titles = [];
  if (Array.isArray(work.title)) {
    titles = work.title;
  } else if (work.title) {
    titles = [work.title];
  }

  // Normalize text
  const extractTitleText = (t) => {
    if (typeof t === "string") return t;
    if (t && typeof t === "object") return (t._ || "").trim();
    return "";
  };

  const titleMain =
    titles.length > 0 ? extractTitleText(titles[0]) || "Untitled work" : "Untitled work";

  // Concatenated list for alternative titles if applicable
  const altTitles = titles.slice(1).map(extractTitleText).filter(Boolean);
  const titleAlt = altTitles.length > 0 ? altTitles.join(" | ") : null;

  // Catalogue number / genre: for now, we leave them null until we inspect more MEI
  const catalogueNumber = null;
  const genre = null;
  const notes = null;

  return {
    mei_id: meiId,
    title_main: titleMain.trim(),
    title_alt: titleAlt,
    catalogue_number: catalogueNumber,
    genre,
    notes,
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
    "dedicatee"
  ];

  const rawPersNames = collectPersNames(mei);
  const result = [];
  const seen = new Set();

  for (const p of rawPersNames) {
    if (!p) continue;
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
      authority_id: attrs.auth || null,
    });
  }

  return result;
}

// ---------- DB helpers ----------

async function findOrCreatePerson(p) {
  // Simple dedup by name
  const existing = await db.query(
    "SELECT id FROM person WHERE name = $1",
    [p.name]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  const res = await db.query(
    "INSERT INTO person (name, authority_id) VALUES ($1, $2) RETURNING id",
    [p.name, p.authority_id]
  );
  return res.rows[0].id;
}

async function findOrCreateWork(workData, fileName) {
  // 1. If MEI has a stable xml:id, use that
  let externalId = workData.mei_id;

  // 2. If there is no mei_id, fall back to the file name as a surrogate ID
  if (!externalId && fileName) {
    externalId = fileName;
  }

  // 3. If we have any externalId, dedupe only by that
  if (externalId) {
    const existing = await db.query(
      "SELECT id FROM work WHERE mei_id = $1",
      [externalId]
    );
    if (existing.rows.length > 0) {
      return existing.rows[0].id;
    }
  }

  // 4. Insert new row (do not dedupe by title_main anymore)
  const res = await db.query(
    `INSERT INTO work (mei_id, title_main, title_alt, catalogue_number, genre, notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      externalId,                 // store mei_id or fileName here
      workData.title_main,
      workData.title_alt,
      workData.catalogue_number,
      workData.genre,
      workData.notes,
    ]
  );

  return res.rows[0].id;
}


async function linkWorkPerson(workId, personId, role) {
  // Avoid duplicates in work_person
  const existing = await db.query(
    `SELECT id FROM work_person WHERE work_id = $1 AND person_id = $2 AND role = $3`,
    [workId, personId, role]
  );
  if (existing.rows.length > 0) return existing.rows[0].id;

  const res = await db.query(
    `INSERT INTO work_person (work_id, person_id, role)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [workId, personId, role]
  );
  return res.rows[0].id;
}

async function insertMovements(workId, movements) {
  if (!movements || movements.length === 0) return;

  for (const m of movements) {
    await db.query(
      `INSERT INTO movement (work_id, position, title)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [workId, m.position, m.title]
    );
  }
}


async function insertSources(workId, sources) {
  if (!sources || sources.length === 0) return;

  for (const s of sources) {
    await db.query(
      `INSERT INTO source (work_id, source_type, repository, shelfmark, digital_url, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [
        workId,
        s.source_type,
        s.repository,
        s.shelfmark,
        s.digital_url,
        s.notes,
      ]
    );
  }
}



// ---------- Import a single file ----------

async function importSingleFile(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n=== Importing ${fileName} ===`);

  try {
    const meiJson = await parseMeiFile(filePath);

    const workData = getWorkData(meiJson);
    const persons = getPersons(meiJson);
    const movements = getMovements(meiJson);
    const sources = getSources(meiJson);

    console.log("  Work:", workData.title_main);
    if (persons.length > 0) {
      console.log(
        "  Persons:",
        persons.map((p) => `${p.name} (${p.role})`).join(", ")
      );
    } else {
      console.log("  Persons: none found");
    }

    if (movements.length > 0) {
      console.log(
        "  Movements:",
        movements.map((m) => `${m.position}: ${m.title}`).join(" | ")
      );
    } else {
      console.log("  Movements: none found");
    }

    if (sources.length > 0) {
      console.log(
        "  Sources:",
        sources.map((s) => `${s.digital_url}`)
      );
    } else {
      console.log("  Sources: none found");
    }

    const workId = await findOrCreateWork(workData, fileName);
    console.log(`  -> work id: ${workId}`);

    // persons
    for (const p of persons) {
      const personId = await findOrCreatePerson(p);
      await linkWorkPerson(workId, personId, p.role);
      console.log(`  -> linked ${p.name} as ${p.role}`);
    }

    // movements
    await insertMovements(workId, movements);

    // sources
    await insertSources(workId, sources);

    console.log(`=== Done: ${fileName} ===`);

  } catch (err) {
    console.error(`!!! Failed to import ${fileName}:`, err.message);
  }
}

// ---------- Main: loop over all .mei files ----------

async function main() {
  const files = fs
    .readdirSync(MEI_DIR)
    .filter((f) => f.toLowerCase().endsWith(".mei"));

  if (files.length === 0) {
    console.log("No .mei files found in", MEI_DIR);
    process.exit(0);
  }

  console.log(`Found ${files.length} MEI files in ${MEI_DIR}`);

  for (const file of files) {
    const fullPath = path.join(MEI_DIR, file);
    await importSingleFile(fullPath);
  }

  console.log("\nAll imports finished.");
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error("Unexpected error in import:", err);
    process.exit(1);
  });
}

// export for testing
module.exports = {
  parseMeiFile,
  getMovements,
  findWorkNode,
  getWorkData,
  getSources,
  getPersons,
};