function validateExtractedData(extracted) {
  if (!extracted.work) {
    throw new Error("No work data extracted");
  }

  if (!extracted.work.title_main) {
    throw new Error("Work is missing title_main");
  }

  if (!Array.isArray(extracted.persons)) {
    throw new Error("Persons must be an array");
  }

  for (const person of extracted.persons) {
    if (!person.name) {
      throw new Error("Person is missing name");
    }
  }

  for (const person of extracted.persons) {
    if (!person.role) {
      throw new Error("Person is missing role");
    }
  }

  if (!Array.isArray(extracted.sources)) {
    throw new Error("Sources must be an array");
  }

  for (const source of extracted.sources) {
    if (!source.source_type) {
      throw new Error("Source is missing type");
    }
  }

  if (!Array.isArray(extracted.movements)) {
    throw new Error("Movements must be an array");
  }

  for (const movement of extracted.movements) {
    if (!movement.title && !movement.movement_number && !movement.tempo) {
      throw new Error("Movement is missing identifying information");
    }
  }
}

module.exports = { validateExtractedData };