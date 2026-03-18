//  Movement extraction: extract structured movement data from MEI document by checking several common patterns and normalizes them into 
//   {
//     position: Number,
//     title: String
//   }

// Design choices:
// Only explicit movement structures are treated as movements. If no explicit markers are found, we return [] and assume the work is effectively single-movement for catalogue purposes.

const { asArray, deepText, findWorkNode } = require("../helpers");

// Function to pick the first non-empty text value from a list of candidate keys.
function pickDirectTextFromKeys(node, keys) {
  if (!node || typeof node !== "object") return null;

  for (const key of keys) {
    const value = node[key];
    if (!value) continue;

    // Try simple text extraction first
    for (const item of asArray(value)) {
        const text= deepText(item);
        if (text) return text;
    }
  }
  return null;
}

// Extract movements from MEI object, returns: Array<{ position: number, title: string }>
// Supports the following patterns:
//  1. Multiple <work> entries in <workList> where xml:id contains "movement"
//  2. Multiple <mdiv> elements inside <music><body>
//  3. Explicit <movement> or <component> elements inside a <work></work>
function getMovements(mei) {
  const movements = [];

  // Case 1: Multiple <work> entries in <workList> with xml:id containing "movement"
  const workListWorks =
    mei?.meiHead?.workList?.work ||
    mei?.workList?.work ||
    null;

  const worksInList = workListWorks ? asArray(workListWorks) : [];

  // Only treat this as movements if there is more than one work  AND at least one has xml:id including "movement"
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

      const result = finalizeMovements(movements);
      validateMovements(result);
      return result;
  }

  // Case 2: <mdiv> under <body> (each mdiv = movement). To avoid over-detecting, only treat this as multi-movement if there is more than one <mdiv>.
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

      // Try typical places for a movement title: <mdiv><title>, <mdiv><label>, or <mdiv><head><title>/<label>
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


  // Case 3: <movement> or <component> under <work> (explicit movement markup)
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

  // Case 4:No explicit movement markers found -> this is treated as a single-movement work (no entries)
  return [];
}

// Final validation that logs suspicious output
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

// Final cleanup before results are returned (sort by position, remove exact duplicates)
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

module.exports = {
    getMovements,
 }