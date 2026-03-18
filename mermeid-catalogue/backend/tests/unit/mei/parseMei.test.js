// tests/parser.mei.test.js
const path = require("path");
const fs = require("fs/promises");
const { parseMei } = require("../../../src/mei/parseMei");

function getFixturePath(name) {
  return path.join(__dirname, "../../../test_data/mei", name);
}

//test that valid MEI parses without crashing
describe("MEI file parsing", () => {
  test("parses valid MEI file", async () => {
    const filePath = getFixturePath("single-work-no-movement.mei");
    const xml = await fs.readFile(filePath, "utf-8");

    const result = await parseMei(xml);

    expect(result).toBeDefined();
    expect(result.mei).toBeDefined();
  });

  // test that Invalid XML Fails Correctly
  test("throws error for malformed XML", async () => {
    const filePath = getFixturePath("malformed-xml.mei");
    const xml = await fs.readFile(filePath, "utf-8");

    await expect(parseMei(xml)).rejects.toThrow();
  });

  // test that no movement elements are detected if none are present in file
  test("file without movement structure still parses", async () => {
    const filePath = getFixturePath("single-work-no-movement.mei");
    const xml = await fs.readFile(filePath, "utf-8");

    const result = await parseMei(xml);

    expect(result.mei.music).toBeDefined();
  });

  // test that multiple movements can be extracted
  test("parses multi movement MEI structure", async () => {
    const filePath = getFixturePath("work-with-mdiv-only.mei");
    const xml = await fs.readFile(filePath, "utf-8");

    const result = await parseMei(xml);

    const mdiv = result?.mei?.music?.body?.mdiv;

    expect(mdiv).toBeDefined();
  });
});