// Source extractor: extract source related catalogue information from an MEI document and returns as
//   {
//     source_type: String,
//     publisher: String | null,
//     digital_url: String | null,
//     source_title: String | null
//   }

const { asArray, textOf } = require("../helpers");

// Case 1: traditional <fileDesc><sourceDesc><source><bibl>
function sourceFromBibl(bibl) {
  if (!bibl) return null;

  const identifiers = asArray(bibl.identifier);

  // Field 1: Digital URL (identifier type="URI")
  const uriIdentifier = identifiers.find((id) => {
    const attrs = id?.$ || {};
    return (attrs.type || "").toLowerCase() === "uri";
  });
  const digital_url = textOf(uriIdentifier);

  // Field 2: Title of source
  const source_title = textOf(bibl?.title?.titlePart || bibl?.title);

  // Field 3: Publisher 
  const respStmt = bibl?.imprint?.respStmt;

  let publisher = null;

  if (respStmt) {
    for (const key of Object.keys(respStmt)) {
      if (key === "$" || key === "_") continue;

      const elements = asArray(respStmt[key]);

      const match = elements.find(
        (el) => el?.$?.role?.toLowerCase() === "publisher"
      );

      if (match) {
        publisher = textOf(match);
        break;
      }
    }
  }

  if (!digital_url && !publisher && !source_title) return null; //<bibl> contains no usable source information so null is returned

  return {
    source_type: "bibl",
    publisher: publisher || null,
    digital_url: digital_url || null,
    source_title: source_title || null
  };
}

// Case 2: FRBR-style <manifestationList><manifestation>
function sourceFromManifestation(man) {
  if (!man) return null;

  const identifiers = asArray(man.identifier);

  // Field 1: Digital URL
  const uriIdentifier = identifiers.find((id) => {
    const attrs = id?.$ || {};
    return (attrs.type || "").toLowerCase() === "uri";
  });

  const digital_url = textOf(uriIdentifier);

  // Field 2: Title of source
  const titles = asArray(man?.titleStmt?.title)
    .map(textOf)
    .filter(Boolean);

  const source_title= titles.length ? titles.join(" | ") : null;

  // Field 3: Publisher 
  const respStmt = man?.pubStmt?.respStmt;

  let publisher = null;

  if (respStmt) {
    for (const key of Object.keys(respStmt)) {
      if (key === "$" || key === "_") continue;

      const elements = asArray(respStmt[key]);

      const match = elements.find(
        (el) => el?.$?.role?.toLowerCase() === "publisher"
      );

      if (match) {
        publisher = textOf(match);
        break;
      }
    }
  }

  if (!digital_url && !source_title && !publisher) return null;

  return {
    source_type: "manifestation",
    publisher: publisher || null,
    digital_url: digital_url || null,
    source_title: source_title || null
  };
}

//Extract all sources from MEI JSON object and returns deduplicated array of normalized source objects
function getSources(mei) {
  const results = [];

  // Case 1: <fileDesc><sourceDesc><source><bibl> -> old-style source descrption
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

  // Case 2: <manifestationList><manifestation> -> FRBR style 
  const manifestationList = mei?.meiHead?.manifestationList;

  if (manifestationList?.manifestation) {
    const mans = asArray(manifestationList.manifestation);

    for (const man of mans) {
      const src = sourceFromManifestation(man);
      if (src) results.push(src);
    }
  }


  // Deduplicate results (identical if all normalized fields match)
  const seen = new Set();
  const deduped = [];

  for (const r of results) {
    const key = `${r.source_type || ""}|${r.publisher || ""}|${r.digital_url || ""}|${r.source_title || ""}`;

    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(r);
  }

  validateSources(deduped);
  return deduped;

// Final validation that logs suspicious output
function validateSources(sources) {
  if (!Array.isArray(sources)) {
    console.warn("[sources] result is not an array");
    return;
  }

  sources.forEach((s, index) => {
    if (!s.source_type) {
      console.warn(`[sources] source ${index} missing source_type`, s);
    }
  });
}}

module.exports = {
  getSources,
};