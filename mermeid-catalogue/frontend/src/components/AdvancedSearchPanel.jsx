function AdvancedSearchPanel({ filters, onChange }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: "1rem",
        padding: "1rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <div>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={filters.title}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="composer">Composer</label>
        <input
          id="composer"
          name="composer"
          type="text"
          value={filters.composer}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="classification">Classification</label>
        <input
          id="classification"
          name="classification"
          type="text"
          value={filters.classification}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="composition_date_text">Composition Date</label>
        <input
          id="composition_date_text"
          name="composition_date_text"
          type="text"
          value={filters.composition_date_text}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="work_key">Key</label>
        <input
          id="work_key"
          name="work_key"
          type="text"
          value={filters.work_key}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="tempo">Tempo</label>
        <input
          id="tempo"
          name="tempo"
          type="text"
          value={filters.tempo}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="meter_count">Meter Count</label>
        <input
          id="meter_count"
          name="meter_count"
          type="number"
          onWheel={() => document.activeElement.blur()}
          value={filters.meter_count}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="meter_unit">Meter Unit</label>
        <input
          id="meter_unit"
          name="meter_unit"
          type="number"
          onWheel={() => document.activeElement.blur()}
          value={filters.meter_unit}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="composition_year_start">Year From</label>
        <input
          id="composition_year_start"
          name="composition_year_start"
          type="number"
          onWheel={() => document.activeElement.blur()}
          value={filters.composition_year_start}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>

      <div>
        <label htmlFor="composition_year_end">Year To</label>
        <input
          id="composition_year_end"
          name="composition_year_end"
          type="number"
          onWheel={() => document.activeElement.blur()}
          value={filters.composition_year_end}
          onChange={onChange}
          style={{ width: "100%", padding: "0.5rem", marginTop: "0.25rem" }}
        />
      </div>
    </div>
  );
}

export default AdvancedSearchPanel;