//  Person extractor: extract person-role relationships from MEI document to return a normalized list of contributors.
//   {
//     name: String,
//     role: String,
//     authority_id: String | null
//   }
//
// Design choice: only works with restricted set of roles that are relevant to catalogue

const { asArray, findWorkNode } = require("../helpers");


// Function to find main <work> node, recursively collect all <persName> elements and filter to a defined set of allowed roles. 
function getPersons(mei) {
  const work = findWorkNode(mei);

  if (!work) return [];

  // Only keep contributor roles that are meaningful for catalogue display and database storage.
  const allowedRoles = [
    "composer",
    "librettist",
    "arranger",
    "translator",
    "poet",
    "editor",
    "dedicatee",
  ];

  // Collect all <persName> nodes recursively from the work node
  const rawPersNames = collectPersNames(mei);

  const person = [];
  const seen = new Set();

  for (const p of rawPersNames) {
    if (!p) continue;

    const attrs = p.$ || {};

    const name =
      typeof p === "string"
        ? p.trim()
        : (p._ || "").trim();   // xml2js may represent a persName either as "Ludwig van Beethoven" or { _: "Ludwig van Beethoven", $: {...} }

    if (!name) continue;

    const role = attrs.role ? attrs.role.toLowerCase() : null;

    // Ignore people without a recognized catalogue-relevant role
    if (!role || !allowedRoles.includes(role)) continue;

    // Deduplicate by contributor name + role
    const key = `${name}|${role}`;
    if (seen.has(key)) continue;
    seen.add(key);

    person.push({
      name,
      role,
      authority_id: attrs.codedval || null,
    });
  }

  return person;
}



//Function to recursively collect all <persName> nodes under given MEI node (diff nesting levels)
function collectPersNames(node, persons = []) {
  // Stop recursion if node is missing or not an object
  if (!node || typeof node !== "object") return persons;

  // Collect any <persName> elements directly under this node
  if (node.persName) {
    for (const p of asArray(node.persName)) {
        persons.push(p);
    }
  }

  // Recursively search all child objects/arrays for nested <persName> elements
  for (const key of Object.keys(node)) {
    const child = node[key];

    if (Array.isArray(child)) {
      for (const c of child) {
        if (typeof c === "object") collectPersNames(c, persons);
      }
    } else if (typeof child === "object") {
      collectPersNames(child, persons);
    }
  }

  return persons;
}


module.exports = {
  getPersons,
};