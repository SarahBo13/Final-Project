function WorkDetail({ work }) {
  function formatClassification(value) {
    if (!value) return "—";

    return value
      .replace(/[{}"]/g, "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .join(", ");
  }

  function groupByRole(role) {
    return work?.persons
      ?.filter((p) => p.role?.toLowerCase() === role.toLowerCase())
      .map((p) => p.name)
      .join(", ");
  }

  if (!work) {
    return (
      <aside className="detail-card">
        <h2 className="detail-card__heading">Details</h2>
        <p className="detail-card__empty">Select a work to see details.</p>
      </aside>
    );
  }

  const roles = [
    { key: "composer", label: "Composer" },
    { key: "poet", label: "Poet" },
    { key: "arranger", label: "Arranger" },
    { key: "librettist", label: "Librettist" },
    { key: "translator", label: "Translator" },
    { key: "editor", label: "Editor" },
    { key: "dedicatee", label: "Dedicatee" },
  ];

  const nonComposerPeople = work.persons?.filter(
    (person) => person.role?.toLowerCase() !== "composer"
  );

  return (
    <aside className="detail-card">
      <h2 className="detail-card__heading">Details</h2>

      <div className="detail-card__hero">
        <h3 className="detail-card__title">{work.title_main || "Untitled work"}</h3>

        {work.catalogue_number && (
          <span className="detail-card__badge">{work.catalogue_number}</span>
        )}
      </div>

      {work.title_alt && (
        <p className="detail-card__subtitle">
          <em>{work.title_alt}</em>
        </p>
      )}

      <section className="detail-card__section">
        <div className="detail-card__grid">
          <p className="detail-card__item">
            <strong>Composer:</strong>{" "}
            {groupByRole("composer") || "—"}
          </p>

          {work.composition_date_text && (
            <p className="detail-card__item">
              <strong>Composition date:</strong> {work.composition_date_text}
            </p>
          )}

          {work.classification && (
            <p className="detail-card__item detail-card__item--full">
              <strong>Classification:</strong> {formatClassification(work.classification)}
            </p>
          )}
        </div>
      </section>

      <section className="detail-card__section">
        <h3 className="detail-card__section-title">Musical information</h3>

        <div className="detail-card__grid">
          {work.work_key && (
            <p className="detail-card__item">
              <strong>Key:</strong> {work.work_key}
            </p>
          )}

          {work.tempo && (
            <p className="detail-card__item">
              <strong>Tempo:</strong> {work.tempo}
            </p>
          )}

          {work.meter_count && (
            <p className="detail-card__item">
              <strong>Meter count:</strong> {work.meter_count}
            </p>
          )}

          {work.meter_unit && (
            <p className="detail-card__item">
              <strong>Meter unit:</strong> {work.meter_unit}
            </p>
          )}

          {work.mediums?.length > 0 && (
            <p className="detail-card__item detail-card__item--full">
              <strong>Medium:</strong>{" "}
              {work.mediums.map((m) => m.medium_name).join(", ")}
            </p>
          )}
        </div>
      </section>

      {nonComposerPeople && nonComposerPeople.length > 0 && (
        <section className="detail-card__section">
          <h3 className="detail-card__section-title">Other contributors</h3>

          <div className="detail-card__grid">
            {roles
              .filter(({ key }) => key !== "composer")
              .map(({ key, label }) => {
                const value = groupByRole(key);
                if (!value) return null;

                return (
                  <p key={key} className="detail-card__item">
                    <strong>{label}:</strong> {value}
                  </p>
                );
              })}
          </div>
        </section>
      )}

      {work.movements && work.movements.length > 0 && (
        <section className="detail-card__section">
          <h3 className="detail-card__section-title">Movements</h3>

          <ol className="detail-card__list">
            {work.movements.map((mvt) => (
              <li key={mvt.id}>
                {mvt.title || `Movement ${mvt.position}`}
              </li>
            ))}
          </ol>
        </section>
      )}

      {work.sources && work.sources.length > 0 && (
        <section className="detail-card__section">
          <h3 className="detail-card__section-title">Sources</h3>

          <ul className="detail-card__list">
            {work.sources.map((src) => (
              <li key={src.id}>
                {src.source_type && <strong>{src.source_type}</strong>}
                {src.publisher && ` – ${src.publisher}`}
                {src.source_title && ` (${src.source_title})`}{" "}
                {src.digital_url && (
                  <a href={src.digital_url} target="_blank" rel="noreferrer">
                    [Digital facsimile]
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

export default WorkDetail;