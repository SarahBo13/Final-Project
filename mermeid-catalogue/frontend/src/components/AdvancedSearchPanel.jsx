//Advanced Search Functionality
function AdvancedSearchPanel({ filters, onChange }) {
  return (
    <div className="advanced-panel">
      <div className="advanced-field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={filters.title}
          onChange={onChange}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="composer">Composer</label>
        <input
          id="composer"
          name="composer"
          type="text"
          value={filters.composer}
          onChange={onChange}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="classification">Classification</label>
        <input
          id="classification"
          name="classification"
          type="text"
          value={filters.classification}
          onChange={onChange}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="medium">Medium</label>
        <input
          id="medium"
          name="medium"
          type="text"
          value={filters.medium}
          onChange={onChange}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="work_key">Key</label>
        <input
          id="work_key"
          name="work_key"
          type="text"
          value={filters.work_key}
          onChange={onChange}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="tempo">Tempo</label>
        <input
          id="tempo"
          name="tempo"
          type="text"
          value={filters.tempo}
          onChange={onChange}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="meter_count">Meter Count</label>
        <input
          id="meter_count"
          name="meter_count"
          type="number"
          value={filters.meter_count}
          onChange={onChange}
          onWheel={(e) => e.target.blur()}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="meter_unit">Meter Unit</label>
        <input
          id="meter_unit"
          name="meter_unit"
          type="number"
          value={filters.meter_unit}
          onChange={onChange}
          onWheel={(e) => e.target.blur()}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="composition_year_start">Year From</label>
        <input
          id="composition_year_start"
          name="composition_year_start"
          type="number"
          value={filters.composition_year_start}
          onChange={onChange}
          onWheel={(e) => e.target.blur()}
        />
      </div>

      <div className="advanced-field">
        <label htmlFor="composition_year_end">Year To</label>
        <input
          id="composition_year_end"
          name="composition_year_end"
          type="number"
          value={filters.composition_year_end}
          onChange={onChange}
          onWheel={(e) => e.target.blur()}
        />
      </div>
    </div>
  );
}

export default AdvancedSearchPanel;