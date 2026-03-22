// Coordinates the whole workflow
// Logging commands available but commented out or clearer overview in terminal

const path = require("path");
const fs = require("fs/promises");
const xml2js = require("xml2js");

const db = require("../db/db");

const { getWorkData } = require("../mei/extractors/workExtractor");
const { getPersons } = require("../mei/extractors/personExtractor");
const { getSources } = require("../mei/extractors/sourceExtractor");
const { getMovements } = require("../mei/extractors/movementExtractor");
const { getWorkMediums } = require("../mei/extractors/mediumExtractor");

const { insertWork } = require("../db/repositories/workRepository");
const { insertPerson, linkWorkPerson } = require("../db/repositories/personRepository");
const { insertMovement } = require("../db/repositories/movementRepository");
const { insertSource } = require("../db/repositories/sourceRepository");
const { insertWorkMedium } = require("../db/repositories/mediumRepository");

const { validateExtractedData } = require("../validation/validateExtractedData");
const { logInfo, logError } = require("../logging/logger");

async function importMeiFile(filePath) {
  const fileName = path.basename(filePath);

  logInfo("Starting MEI import", { fileName, filePath });

  try {
    // Read + parse
    // logInfo("Reading MEI file", { fileName });
    const xml = await fs.readFile(filePath, "utf-8");

    // logInfo("Parsing MEI XML", { fileName });
    const meiJson = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const mei = meiJson.mei;

    // Extraction layer
    // logInfo("Extracting MEI data", { fileName });

    const work = getWorkData(mei, filePath);
    const persons = getPersons(mei);
    const sources = getSources(mei);
    const movements = getMovements(mei);
    const mediums = getWorkMediums(mei);

    const extracted = { work, persons, sources, movements, mediums }
    // logInfo("Extraction complete", {
    //   fileName,
    //   title: work?.title_main || null,
    //   persons: persons.length,
    //   sources: sources.length,
    //   movements: movements.length,
    //   mediums: mediums.length
    // });

    // Validation layer
    // logInfo("Validating extracted data", { fileName });
    validateExtractedData(extracted);

    // Persistence layer
    // logInfo("Inserting work", {
    //   fileName,
    //   mei_id: work?.mei_id || null,
    //   title: work?.title_main || null,
    // });

    const workId = await insertWork(db, work, fileName);

    const personIds = [];
    for (const p of persons) {
      // logInfo("Inserting person", {
      //   fileName,
      //   name: p.name,
      //   role: p.role || null,
      // });

      const personId = await insertPerson(db, p);
      await linkWorkPerson(db, workId, personId, p.role);
      personIds.push(personId);
    }

    const movementIds = [];
    for (const m of movements) {
      // logInfo("Inserting movement", {
      //   fileName,
      //   position: m.position || null,
      //   title: m.title || null,
      // });

      const movementId = await insertMovement(db, workId, m);
      movementIds.push(movementId);
    }

    const sourceIds = [];
    for (const s of sources) {
      // logInfo("Inserting source", {
      //   fileName,
      //   source_type: s.source_type || null,
      //   repository: s.repository || null
      // });

      const sourceId = await insertSource(db, workId, s);
      sourceIds.push(sourceId);
    }

    const mediumIds = [];
    for (m of mediums) {

      // logInfo("Inserting work medium",{
      //   fileName,
      //   medium_name: m.medium_name || null,
      //   medium_code: m.medium_code || null
      // })

      const mediumId = await insertWorkMedium(db, workId, m);
      mediumIds.push(mediumId);

    }


    logInfo("MEI import completed", {
      fileName,
      workId,
      personCount: personIds.length,
      movementCount: movementIds.length,
      sourceCount: sourceIds.length,
      mediumCount: mediumIds.length
    });

    return {
      extracted,
      workId,
      personIds,
      movementIds,
      sourceIds,
      mediumIds
    };
  } catch (err) {
    logError("MEI import failed in importService", {
      fileName,
      error: err.message,
    });
    throw err;
  }
}

module.exports = { importMeiFile };