const express = require("express");
const cors = require("cors");
const db = require("./db/db");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// health check endpoint
app.get("/api/health", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW() as now");
    res.json({ ok: true, dbTime: result.rows[0].now });
  } catch (err) {
    console.error("Health check failed:", err);
    res.status(500).json({ ok: false, error: "DB connection failed" });
  }
});

// // ---- Mock data (later replace with DB + MEI ingestion) ----
// const works = [
//   {
//     id: 1,
//     mei_id: "work1",
//     title_main: "Sonate für Klavier in C-Dur",
//     title_alternative: "Piano Sonata in C major",
//     catalogue_number: "WoO 32",
//     genre: "Sonata",
//     composition_date: "1794",
//     composer: {
//       id: 1,
//       name: "Ludwig van Beethoven"
//     },
//     movements: [
//       { id: 101, title: "Allegro", order: 1 },
//       { id: 102, title: "Adagio", order: 2 }
//     ],
//     sources: [
//       {
//         id: 201,
//         source_type: "manuscript",
//         library: "Staatsbibliothek zu Berlin",
//         shelfmark: "Mus.ms. autogr. Beethoven 12",
//         digital_url: "https://example.org/scan/201"
//       }
//     ]
//   },
//   {
//     id: 2,
//     mei_id: "work2",
//     title_main: "String Quartet in G major",
//     title_alternative: null,
//     catalogue_number: "Op. 18 No. 2",
//     genre: "String Quartet",
//     composition_date: "1798–1800",
//     composer: {
//       id: 1,
//       name: "Ludwig van Beethoven"
//     },
//     movements: [],
//     sources: []
//   }
// ];

// ---- API endpoints ----

// // List works with simple search ?q=
// app.get("/api/works", (req, res) => {
//   const { q } = req.query;
//   let result = works;

//   if (q) {
//     const query = q.toLowerCase();
//     result = works.filter(w =>
//       (w.title_main && w.title_main.toLowerCase().includes(query)) ||
//       (w.catalogue_number && w.catalogue_number.toLowerCase().includes(query)) ||
//       (w.composer?.name && w.composer.name.toLowerCase().includes(query))
//     );
//   }

//   res.json(result);
// });

// // Single work by ID
// app.get("/api/works/:id", (req, res) => {
//   const id = Number(req.params.id);
//   const work = works.find(w => w.id === id);

//   if (!work) {
//     return res.status(404).json({ error: "Work not found" });
//   }

//   res.json(work);
// });

// // Movements for a work
// app.get("/api/works/:id/movements", (req, res) => {
//   const id = Number(req.params.id);
//   const work = works.find(w => w.id === id);

//   if (!work) {
//     return res.status(404).json({ error: "Work not found" });
//   }

//   res.json(work.movements || []);
// });

// // Sources for a work
// app.get("/api/works/:id/sources", (req, res) => {
//   const id = Number(req.params.id);
//   const work = works.find(w => w.id === id);

//   if (!work) {
//     return res.status(404).json({ error: "Work not found" });
//   }

//   res.json(work.sources || []);
// });

// List works (simple version) -> to replace mock data used in first draft
// app.get("/api/works", async (req, res) => {
//   try {
//     const { q } = req.query;

//     let baseQuery = `
//       SELECT
//         w.id,
//         w.mei_id,
//         w.title_main,
//         w.title_alt,
//         w.catalogue_number,
//         REPLACE( REPLACE(w.classification, '{', ''), '}', '') AS classification,
//         w.meter_count,
//         w.meter_unit,
//         w.composition_date_text,
//         w.composition_year_start,
//         w.composition_year_end,
//         w.work_key,
//         w.tempo,
//         COALESCE(string_agg(DISTINCT p.name, ', '), '') AS composers
//       FROM work w
//       LEFT JOIN work_person wp ON wp.work_id = w.id AND wp.role = 'composer'
//       LEFT JOIN person p ON p.id = wp.person_id
//     `;
//     const params = [];

//     if (q) {
//       baseQuery += `
//         WHERE
//           w.title_main ILIKE $1
//           OR w.catalogue_number ILIKE $1
//           OR p.name ILIKE $1
//       `;
//       params.push(`%${q}%`);
//     }

//     baseQuery += `
//       GROUP BY w.id
//       ORDER BY w.title_main
//       LIMIT 100
//     `;

//     const result = await db.query(baseQuery, params);
//     res.json(result.rows);
//   } catch (err) {
//     console.error("Error fetching works:", err);
//     res.status(500).json({ error: "Failed to fetch works" });
//   }
// });