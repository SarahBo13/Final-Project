// All helper functions

// Ensure a value is always returned as an array, as xml2js sometimes returns single object when only one element exists. 
// Helper to normalize behavior so it is always an array returned so code can iterate safely.
function asArray(x) {
  return Array.isArray(x) ? x : x ? [x] : [];
}

// Extract simple text content from node while ignoring attributes to return a trimmed string or null of no usable text exists
function textOf(x) {
  if (!x) return null;

  // Case 1: node is already a string
  if (typeof x === "string") {
    const t = x.trim();
    return t ? t : null;
  }

  // Case 2: xml2js object with "_" holding text content
  if (typeof x === "object" && typeof x._ === "string") {
    const t = x._.trim();
    return t ? t : null;
  }

  return null;
}

// Recursive function to extract full text from node (handles nested tags)
function deepText(x) {
  if (x == null) return null;

  // Case 1: node is plain string
  if (typeof x === "string") {
    const t = x.trim();
    return t ? t : null;
  }

  // Case 2: node is object with nested children
  if (typeof x === "object") {
    const parts = [];

    // collect direct text content
    if (typeof x._ === "string") {
      const t = x._.trim();
      if (t) parts.push(t);
    }

    // recursively collect text from child nodes
    for (const key of Object.keys(x)) {
      if (key === "$" || key === "_") continue; // skip attribute object ($) and main text node (_)
      for (const c of asArray(x[key])) {
        const t = deepText(c);
        if (t) parts.push(t);
      }
    }

    // join all text fragments into single normalized string
    const joined = parts.join(" ").replace(/\s+/g, " ").trim();
    return joined ? joined : null;
  }

  return null;
}

// Function to find <work> node in MEI

function findWorkNode(meiRoot) {
  if (!meiRoot) {
    throw new Error("No MEI JSON object");
  }

  // xml2js often gives { mei: { ... } } as the top-level so unwrap if needed:
  const root = meiRoot.mei || meiRoot;

  // Case 1: <meiHead><workList><work>
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


  // Case 2: <work> directly under <mei>
  if (root.work) {
    return Array.isArray(root.work) ? root.work[0] : root.work;
  }


  // Case 3: <workList><work> under <mei>
  if (root.workList && root.workList.work) {
    const wl = root.workList;
    return Array.isArray(wl.work) ? wl.work[0] : wl.work;
  }


  // Case 4: <music><body> or <music><body><workList>
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

//Function to filter out movements when extracting mei_id
function isProbablyMovementWork(work) {
  if (!work) return false;

  const attrs = work.$ || {};
  const type = (attrs.type || "").toLowerCase();
  const label = (attrs.label || "").toLowerCase();
  const n = String(attrs.n || "").toLowerCase();

  if (type.includes("movement")) return true;
  if (type.includes("component")) return true;
  if (label.includes("movement")) return true;

  const titleText = (deepText(work.title || work.titleStmt?.title || "") || "").toLowerCase();

  // Common movement-only titles
  if (/^(i+|iv|v?i{0,3})\./i.test(titleText)) return true;
  if (/^(allegro|adagio|andante|presto|scherzo|menuetto|minuet|finale)\b/i.test(titleText)) return true;

  // xml:id / n patterns like movement1, mov1, mvt1
  const xmlId = String(attrs["xml:id"] || "").toLowerCase();
  if (/^movement\d+$/.test(xmlId)) return true;
  if (/^mov\d+$/.test(xmlId)) return true;
  if (/^mvt\d+$/.test(xmlId)) return true;
  if (/^movement\d+$/.test(n)) return true;

  return false;
}

//Function to find main work node to identify mei_id
function findMainWorkNode(meiRoot) {
  if (!meiRoot) {
    throw new Error("No <mei> root in MEI JSON");
  }

  const candidates =
    asArray(meiRoot?.meiHead?.workList?.work).length
      ? asArray(meiRoot.meiHead.workList.work)
      : asArray(meiRoot?.workList?.work).length
      ? asArray(meiRoot.workList.work)
      : asArray(meiRoot?.work);

  if (!candidates.length) return null;

  const nonMovementWorks = candidates.filter((w) => !isProbablyMovementWork(w));

  return nonMovementWorks[0] || candidates[0] || null;
}

//Function to find title and title text
function getDirectTitleText(titleNode) {
  if (!titleNode) return null;

  if (typeof titleNode === "string") {
    const t = titleNode.trim();
    return t || null;
  }

  if (typeof titleNode === "object" && typeof titleNode._ === "string") {
    const t = titleNode._.trim();
    return t || null;
  }

  return null;
}

//Function to filter out composition dates from encoding dates as tag <date> under <work> is used for both 
//This check that the year is prior to 1999 (MEi first presented)
function isLikelyCompositionYear(year) {
  if (!year) return false;

  const y = parseInt(year);
  if (isNaN(y)) return false;

  return y < 1999; // year that MEI was first presented, so cannot have files that were encoded earlier
}

//Function to filter out composition dates from encoding dates as tag <date> under <work> is used for both 
//Function to also filter historic ranges as many MEi files have ranges listed
function isLikelyCompositionDateNode(dateNode) {
  if (!dateNode) return false;

  const notBefore = dateNode?.$?.notbefore;
  const notAfter = dateNode?.$?.notafter;

  if (notBefore || notAfter) {
    const start = parseInt(notBefore, 10);
    const end = parseInt(notAfter, 10);

    if (!isNaN(start) && start < 1999) return true;
    if (!isNaN(end) && end < 1999) return true;
    return false;
  }

  const text = textOf(dateNode);
  return isLikelyCompositionYear(text);
}

module.exports = {
  asArray,
  textOf,
  deepText,
  findWorkNode,
  findMainWorkNode,
  getDirectTitleText,
  isLikelyCompositionDateNode
};
