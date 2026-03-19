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

  const safeResultsCount = resultsCount ?? 0;

  return (
    <section className="search-card">
      <div className="search-card__header">
        <h2 className="search-card__title">Search Catalogue</h2>
        <p className="search-card__subtitle">
          Search works and refine your search using advanced filters
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="search-card__row">
          <input
            id="search"
            type="text"
            placeholder="Search by title, catalogue number, composer..."
            value={basicQuery}
            onChange={(e) => setBasicQuery(e.target.value)}
            className="search-card__input"
          />

          <button type="submit" className="search-card__button search-card__button--primary">
            Search
          </button>

          <button
            type="button"
            onClick={toggleAdvanced}
            className="search-card__button search-card__button--secondary"
          >
            {showAdvanced ? "Hide advanced" : "Advanced search"}
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="search-card__button search-card__button--ghost"
          >
            Clear
          </button>
        </div>

        {showAdvanced && (
          <div className="search-card__advanced">
            <AdvancedSearchPanel
              filters={advancedFilters}
              onChange={handleAdvancedChange}
            />
          </div>
        )}

        <div className="search-card__footer">
          <span className="search-card__count">
            {safeResultsCount} result{safeResultsCount === 1 ? "" : "s"}
          </span>

          <span className="search-card__feedback">
            {searchFeedback}
          </span>
        </div>
      </form>
    </section>
  );
}

export default SearchControls;