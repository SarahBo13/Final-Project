// display component for results 
// receive worlks, loading, error, onSelectWork 
// no search logic

function WorkList({ works = [], onSelectWork, selectedWork }) {
  return (
    <div className="work-list">
      {works.length === 0 ? (
        <div className="work-list-empty">
          <p>No works found.</p>
        </div>
      ) : (
        works.map((work) => {

          const isSelected = selectedWork?.id === work.id;

          return(
            <article
              key={work.id}
              className={`work-card ${isSelected ? "work-card--selected" : ""}`}
              onClick={() => onSelectWork(work)}
            >
              <div className="work-card-header">
                <h3 className="work-card-title">
                  {work.title_main || "Untitled work"}
                </h3>

                {work.catalogue_number && (
                  <span className="work-card-catalogue">
                    {work.catalogue_number}
                  </span>
                )}
              </div>

              <p className="work-card-meta">
                <span>{work.composer || "Unknown composer"}</span>
                <span>•</span>
                <span>
                  {work.classification?.replaceAll(",", ", ") || "Unclassified"}
                </span>
                <span>•</span>
                <span>{work.composition_date_text || "Date unknown"}</span>
              </p>
            </article>
          );
        })
      )}
    </div>
  );
}

export default WorkList;