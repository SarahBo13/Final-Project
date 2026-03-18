// /* eslint-disable react/prop-types */
function WorkDetail({ work }) {
  if (!work) {
    return (
      <div>
        <h2>Details</h2>
        <p>Select a work to see details.</p>
      </div>
    );
  }

  const groupByRole = (role) =>
  work?.persons
    ?.filter((p) => p.role === role)
    .map((p) => p.name)
    .join(", ");

  const roles = [
    { key: "composer", label: "Composer" },
    { key: "poet", label: "Poet" },
    { key: "arranger", label: "Arranger" },
    { key: "librettist", label: "Librettist" },
    { key: "translator", label: "Translator" },
    { key: "editor", label: "Editor" },
    { key: "dedicatee", label: "Dedicatee" },
  ];

  return (
    <div>
      <h2>Details</h2>
      <h3>{work.title_main}</h3>
      {work.title_alt && (
        <p>
          <em>{work.title_alt}</em>
        </p>
      )}
      {roles.map(({ key, label }) => {
        const value = groupByRole(key);
        if (!value) return null;

        return (
          <p key={key}>
            <strong>{label}:</strong> {value}
          </p>
        );
      })}
      {work.composition_date && (
        <p>
          <strong>Composition date:</strong> {work.composition_date_text}
        </p>
      )}
      {work.classification && (
        <p>
          <strong>Classification:</strong>  {work.classification?.replaceAll(",", ", ")}
        </p>
      )}

      {work.movements && work.movements.length > 0 && (
        <>
          <h4>Movements</h4>
          <ol>
            {work.movements.map((mvt) => (
              <li key={mvt.id}>{mvt.title || `Movement ${mvt.order}`}</li>
            ))}
          </ol>
        </>
      )}

      {work.sources && work.sources.length > 0 && (
        <>
          <h4>Sources</h4>
          <ul>
            {work.sources.map((src) => (
              <li key={src.id}>
                {src.source_type && <strong>{src.source_type}</strong>}{" "}
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
        </>
      )}
    </div>
  );
}

export default WorkDetail;
