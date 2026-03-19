// Work extractor: Extract core work-level metadata from an MEI document for normalized metadata for catalogue
//
// {
//   mei_id: String | null,
//   title_main: String,
//   title_alt: String | null,
//   catalogue_number: String | null,
//   classification: String | null,
//   meter_count: Integer | null,
//   meter_unit: Integer | null,
//   composition_date_text: String | null,
//   composition_year_start: Integer | null,
//   composition_year_end: Integer | null,
//   work_key: String | null,
//   tempo: String | null
// }
//
// Design choice: Only first title is treated as main title, other titles are treated as secondary/ alternative

const { asArray, textOf, findMainWorkNode, deepText, getDirectTitleText, isLikelyCompositionDateNode } = require("../helpers");
const path = require("path");

//Function to find <titleStmt><title>
function getTitleStmtTitles(mei) {
  return asArray(mei?.meiHead?.fileDesc?.titleStmt?.title);
}

//Function to find title of work and alt. title
function getWorkTitles(mei) {
  const titles = getTitleStmtTitles(mei);

  if (titles.length === 0) {
    return {
      titleMain: "Untitled work",
      titleAlt: null
    };
  }

  const firstTitle = titles[0];
  const titleMain = getDirectTitleText(firstTitle) || "Untitled work";

  const altTitles = [];

  for (const t of titles.slice(1)) {
    const txt = getDirectTitleText(t);
    if (txt) altTitles.push(txt);
  }

  return {
    titleMain,
    titleAlt: altTitles.length ? altTitles.join(" | ") : null
  };
}

//Function to extract catalogue number (opus, catalogue, etc.) from work
//Fallback function in case straightforward catalogue number cant be found through identifier
function findCataloguePattern(text) {
  if (!text) return null;

  const patterns = [
    /\bOp\.?\s*\d+(?:\s*No\.?\s*\d+)?[a-zA-Z0-9:\-\/]*\b/i,
    /\bWoO\.?\s*\d+[a-zA-Z0-9:\-\/]*\b/i,
    /\bBWV\.?\s*\d+[a-zA-Z0-9:\-\/]*\b/i,
    /\bK\.?\s*\d+[a-zA-Z0-9:\-\/]*\b/i,
    /\bKV\.?\s*\d+[a-zA-Z0-9:\-\/]*\b/i,
    /\bHob\.?\s*[A-Z0-9:\-\/.]+\b/i,
    /\bD\.?\s*\d+[a-zA-Z0-9:\-\/]*\b/i,
    /\bRV\.?\s*\d+[a-zA-Z0-9:\-\/]*\b/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }

  return null;
}

function getCatalogueNumberFromTitleStmt(mei) {
  const titles = getTitleStmtTitles(mei);

  for (const title of titles) {
    const titleParts = asArray(title?.titlePart);

    for (const part of titleParts) {
      const partText = textOf(part);
      const match = findCataloguePattern(partText);
      if (match) return match;
    }

    const directText = getDirectTitleText(title);
    const fallbackMatch = findCataloguePattern(directText);
    if (fallbackMatch) return fallbackMatch;
  }

  return null;
}

function getCatalogueNumber(work, mei) {

  if (!work) return null;

  //Case 1: Structured identifiers first
  const identifiers = asArray(work.identifier);

  const structuredId = identifiers.find((id) => {
    const attrs = id?.$ || {};
    const type = (attrs.type || "").toLowerCase();

    return [
      "catalogue",
      "catalognumber",
      "catalogue_number",
      "opus",
      "work",
      "worknumber",
      "work_number"
    ].includes(type);
  });

  const structuredValue = textOf(structuredId);
  if (structuredValue) return structuredValue;

  //Case 2: Try title/titlePart
  const titleValue = getCatalogueNumberFromTitleStmt(mei);
  if (titleValue) return titleValue;

  //Case 3: Broader scan as fallback
  const allText = deepText(mei);
  return findCataloguePattern(allText);
}


// Function to extract classification from work
function getClassification(work) {
  const classifications = asArray(work.classification);
  const classes = [];

  for (const c of classifications) {
    const terms = asArray(c.termList?.term);

    for (const t of terms) {
      const text = textOf(t);
      if (text) classes.push(text);
    }
  }

  return classes.length ? classes : null;
}

//Function to extract the Composition Date
function parseCompositionDate(dateNode) {
  if (!dateNode) {
    return {
      composition_date_text: null,
      composition_year_start: null,
      composition_year_end: null,
    };
  }

  const attrs = dateNode.$ || {};
  const text = textOf(dateNode);

  const notbefore = attrs.notbefore ? Number(attrs.notbefore) : null;
  const notafter = attrs.notafter ? Number(attrs.notafter) : null;

  //Case 1: Attribute-based range: <date notbefore="1829" notafter="1832"/>
  if (notbefore || notafter) {
    let composition_date_text = null;

    if (notbefore && notafter) {
      composition_date_text = `${notbefore}-${notafter}`;
    } else if (notbefore) {
      composition_date_text = `from ${notbefore}`;
    } else if (notafter) {
      composition_date_text = `until ${notafter}`;
    }

    return {
      composition_date_text,
      composition_year_start: notbefore,
      composition_year_end: notafter,
    };
  }

  //Case 2: Text-based single year: <date>1785</date>
  if (text && /^\d{4}$/.test(text)) {
    const year = Number(text);
    return {
      composition_date_text: text,
      composition_year_start: year,
      composition_year_end: year,
    };
  }

  //Case 3: Text-based range: <date>1784-1785</date>
  if (text) {
    const rangeMatch = text.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (rangeMatch) {
      return {
        composition_date_text: text,
        composition_year_start: Number(rangeMatch[1]),
        composition_year_end: Number(rangeMatch[2]),
      };
    }
  }

  // Fallback: preserve text if present
  return {
    composition_date_text: text || null,
    composition_year_start: null,
    composition_year_end: null,
  };
}

// Function to extract work-level metadata from MEI.
function getWorkData(mei, filePath) {
  if (!mei) {
    throw new Error("No <mei> root found in MEI JSON");
  }

  // Locate the main <work> element
  const work = findMainWorkNode(mei);
  if (!work) {
    throw new Error("No main <work> element found in MEI");
  }

  //Work identifier
  //Using file name as stable import identifier
  const meiId = path.basename(filePath, ".mei");

  // Titles (<titleStmt>, <work><title> or fallback untitled)
  const { titleMain, titleAlt } = getWorkTitles(mei);

  //Catalogue No.
  const catalogueNumber = getCatalogueNumber(work, mei);

  //Classification
  const classification = getClassification(work);

  //Key (works with key as text or attribute)
  const keyNode = work.key || null;
  const work_key =
    textOf(keyNode) ||
    (
      keyNode?.$?.pname
        ? `${keyNode.$.pname}${keyNode?.$?.mode ? " " + keyNode.$.mode : ""}`
        : null
    );

  //Tempo
  const tempo = textOf(work.tempo) || null;

  //Meter
  const meterNode = work.meter || null;
  const meter_count = meterNode?.$?.count ? Number(meterNode.$.count) : null;
  const meter_unit = meterNode?.$?.unit ? Number(meterNode.$.unit) : null;

  //Creation Date
  const creationDateNode =
    work?.history?.creation?.date ||
    work?.creation?.date ||
    null;

  let compositionDate = {
    composition_date_text: null,
    composition_year_start: null,
    composition_year_end: null
  };

  if (isLikelyCompositionDateNode(creationDateNode)) {
    compositionDate = parseCompositionDate(creationDateNode);
  }

  return {
    mei_id: meiId,
    title_main: titleMain.trim(),
    title_alt: titleAlt,
    catalogue_number: catalogueNumber,
    classification,
    work_key,
    tempo,
    meter_count,
    meter_unit,
    composition_date_text: compositionDate.composition_date_text,
    composition_year_start: compositionDate.composition_year_start,
    composition_year_end: compositionDate.composition_year_end
  };
}


module.exports = {
  getWorkData,
};