import { useState } from "react";
import AdvancedSearchPanel from "./AdvancedSearchPanel";

function SearchControls({ onSearch }) {
  const [basicQuery, setBasicQuery] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [advancedFilters, setAdvancedFilters] = useState({
    title: "",
    composer: "",
    classification: "",
    composition_date_text: "",
    work_key: "",
    tempo: "",
    meter_count: "",
    meter_unit: "",
    composition_year_start: "",
    composition_year_end: "",
  });

  function handleAdvancedChange(e) {
    const { name, value } = e.target;
    setAdvancedFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSearch({
      basicQuery,
      advancedFilters,
    });
  }

  function handleClear() {
    const cleared = {
      title: "",
      composer: "",
      classification: "",
      composition_date_text: "",
      work_key: "",
      tempo: "",
      meter_count: "",
      meter_unit: "",
      composition_year_start: "",
      composition_year_end: "",
    };

    setBasicQuery("");
    setAdvancedFilters(cleared);

    onSearch({
      basicQuery: "",
      advancedFilters: cleared,
    });
  }

    return (
        <form onSubmit={handleSubmit} style={{ marginBottom: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <input
            type="text"
            placeholder="Search by title, catalogue number, composer..."
            value={basicQuery}
            onChange={(e) => setBasicQuery(e.target.value)}
            style={{ padding: "0.5rem", width: "70%" }}
            />

            <button type="submit" style={{ padding: "0.5rem 1rem" }}>
            Search
            </button>

            <button
            type="button"
            onClick={() => { setShowAdvanced((prev) => !prev);
            //clear basic search input
            setBasicQuery("");    
            }}
            style={{ padding: "0.5rem 1rem" }}
            >
            {showAdvanced ? "Hide advanced" : "Advanced search"}
            </button>

            <button
            type="button"
            onClick={handleClear}
            style={{ padding: "0.5rem 1rem" }}
            >
            Clear
            </button>
        </div>

        {showAdvanced && (
            <div style={{ marginTop: "1rem" }}>
            <AdvancedSearchPanel
                filters={advancedFilters}
                onChange={handleAdvancedChange}
            />
            </div>
        )}
        </form>
    );
}

export default SearchControls;