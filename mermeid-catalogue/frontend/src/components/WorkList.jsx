// display component for results
// receive worlks, loading, error, onSelectWork
// no search logic
function WorkList({ works = [], onSelectWork }) {
  return (
    <div>
      {works.length === 0 ? (
        <p>No works found.</p>
      ) : (
        works.map((work) => (
          <div
            key={work.id}
            onClick={() => onSelectWork(work)}
            style={{
              border: "1px solid #ddd",
              padding: "0.75rem",
              marginBottom: "0.5rem",
              cursor: "pointer",
            }}
          >
            <h3>{work.title_main || "Untitled work"}</h3>
            {work.catalogue_number && (
              <span style={{ marginLeft: "0.5rem" }}>({work.catalogue_number})</span>
            )}
            <div style={{ fontSize: "0.9rem", color: "#555" }}>
              <p>
                {work.composer || "Unknown composer"} •{" "}
                {work.classification?.replaceAll(",", ", ") || "Unclassified"} •{" "}
                {work.composition_date_text || "Date unknown"}
              </p>
          </div>
        </div>
        ))
      )}
    </div>
  );
}

export default WorkList;
