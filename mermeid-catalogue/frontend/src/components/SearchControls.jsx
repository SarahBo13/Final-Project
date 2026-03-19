import { useState } from "react";
import AdvancedSearchPanel from "./AdvancedSearchPanel";

function SearchControls({ onSearch, resultsCount }) {
  const [basicQuery, setBasicQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState("Showing all works");

  const emptyFilters = {
    title: "",
    composer: "",
    classification: "",
    medium: "",
    work_key: "",
    tempo: "",
    meter_count: "",
    meter_unit: "",
    composition_year_start: "",
    composition_year_end: "",
  };

  const [advancedFilters, setAdvancedFilters] = useState(emptyFilters);

  function handleAdvancedChange(e) {
    const { name, value } = e.target;
    setAdvancedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function buildSearchFeedback(query, filters) {
    const activeAdvanced = Object.entries(filters).filter(
      ([, value]) => value.trim() !== ""
    );

    if (query.trim()) {
      return `Showing results for "${query}"`;
    }

    if (activeAdvanced.length > 0) {
      return `Showing results with ${activeAdvanced.length} advanced filter${
        activeAdvanced.length === 1 ? "" : "s"
      }`;
    }

    return "Showing all works";
  }

  function handleSubmit(e) {
    e.preventDefault();

    onSearch({
      basicQuery,
      advancedFilters,
    });

    setSearchFeedback(buildSearchFeedback(basicQuery, advancedFilters));
  }

  function handleClear() {
    setBasicQuery("");
    setAdvancedFilters(emptyFilters);
    setSearchFeedback("Showing all works");

    onSearch({
      basicQuery: "",
      advancedFilters: emptyFilters,
    });
  }

  function toggleAdvanced() {
    setShowAdvanced((prev) => !prev);
  }

  return (
    <section
      style={{
        background: "#7c8295",
        border: "1px solid #3f3e42",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h2
          style={{
            margin: 0,
            fontSize: "1.2rem",
            color: "#ffffff",
          }}
        >
          Search Catalogue
        </h2>
        <p
          style={{
            margin: "0.35rem 0 0",
            color: "#e5e7eb",
            fontSize: "0.95rem",
          }}
        >
          Search works and refine your search using advanced filters
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
        >
          <input
            id="search"
            type="text"
            placeholder="Search by title, catalogue number, composer..."
            value={basicQuery}
            onChange={(e) => setBasicQuery(e.target.value)}
            style={{
              flex: "1 1 320px",
              minWidth: "260px",
              padding: "0.8rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "1rem",
            }}
          />

          <button
            type="submit"
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Search
          </button>

          <button
            type="button"
            onClick={toggleAdvanced}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            {showAdvanced ? "Hide advanced" : "Advanced search"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            style={{
              padding: "0.75rem 1rem",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        </div>

        {showAdvanced && (
          <div style={{ marginTop: "1rem", marginBottom: "1rem" }}>
            <AdvancedSearchPanel
              filters={advancedFilters}
              onChange={handleAdvancedChange}
            />
          </div>
        )}

        <div
          style={{
            marginTop: "1rem",
            paddingTop: "0.9rem",
            borderTop: "1px solid rgba(255,255,255,0.25)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              color: "#ffffff",
              fontSize: "0.95rem",
              fontWeight: 600,
            }}
          >
            {resultsCount} result{resultsCount === 1 ? "" : "s"}
          </span>

          <span
            style={{
              color: "#e5e7eb",
              fontSize: "0.92rem",
            }}
          >
            {searchFeedback}
          </span>
        </div>
      </form>
    </section>
  );
}

export default SearchControls;