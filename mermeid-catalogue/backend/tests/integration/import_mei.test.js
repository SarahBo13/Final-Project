//test the whole workflow works together
const path = require("path");
const { importMeiFile } = require("../../src/import/importService");
const { pool } = require("../../src/db/db");

describe("MEI import integration", () => {

  test("imports a simple MEI file successfully", async () => {
    const filePath = path.join(
      __dirname,
      "../../test_data/mei/single-work-no-movement.mei"
    );

    const result = await importMeiFile(filePath);

    expect(result).toBeDefined();

    expect(result.extracted).toBeDefined();
    expect(result.extracted.work).toBeDefined();

    expect(result.workId).toBeDefined();
    expect(Array.isArray(result.personIds)).toBe(true);
    expect(Array.isArray(result.sourceIds)).toBe(true);
    expect(Array.isArray(result.movementIds)).toBe(true);
  });

  //closing pool after test 
  afterAll(async () => {
    await pool.end();
    });

});

test("throws error for malformed MEI file", async () => {
  const filePath = path.join(
    __dirname,
    "../../test_data/mei/malformed-xml.mei"
  );

  await expect(importMeiFile(filePath)).rejects.toThrow();
});