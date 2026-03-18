// Medium extractor: Extract the medium of a work, to be stored in separate table for easier search capabilities 
//
// {
//  medium_name: text || null,
//  medium_code: text || null,
//  medium_order: integer || null
// }

const { asArray, textOf, findMainWorkNode } = require("../helpers");

function getWorkMediums(mei) {
  if (!mei) return [];

  const work = findMainWorkNode(mei);
  if (!work) return [];

  const results = [];

  const perfMediums = asArray(work.perfMedium);

  for (const pm of perfMediums) {
    const lists = asArray(pm.perfResList);

    for (const list of lists) {
      const resources = asArray(list.perfRes);

      for (const res of resources) {
        results.push({
          medium_name: textOf(res),
          medium_code: res?.$?.codedval || null,
          medium_order: res?.$?.n ? Number(res.$.n) : null
        });
      }
    }
  }

  return results;
}

module.exports = { getWorkMediums };