// Only parse XML -> JSON
const xml2js = require("xml2js");

async function parseMei(xml) {
  return xml2js.parseStringPromise(xml, {
    explicitArray: false,
    mergeAttrs: false,
  });
}

module.exports = { parseMei };