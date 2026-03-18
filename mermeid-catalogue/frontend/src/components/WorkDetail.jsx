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

  const nonComposerPeople = work.persons?.filter(
  (person) => person.role?.toLowerCase() !== "composer"
);

  return (
    <div>
      <h2>Details</h2>
      <h3>{work.title_main}</h3>
      {work.title_alt && (
        <p>
          <em>{work.title_alt}</em>
        </p>
      )}
      <p>
        <strong>Composer:</strong>{" "}
        {work.persons
          ?.filter((person) => person.role === "composer")
          .map((person) => person.name)
          .join(", ") || "—"}
      </p>
      {work.composition_date_text && (
        <p>
          <strong>Composition date:</strong> {work.composition_date_text}
        </p>
      )}
      {work.classification && (
        <p>
          <strong>Classification:</strong>  {work.classification?.replaceAll(",", ", ")}
        </p>
      )}
      <h3> Musical information </h3>
      {work.work_key && (
        <p>
          <strong>Key:</strong> {work.work_key}
        </p>
      )}
      {work.tempo && (
        <p>
          <strong>Tempo:</strong> {work.tempo}
        </p>
      )}
      {work.meter_count && (
        <p>
          <strong>Meter Count:</strong> {work.meter_count}
        </p>
      )}    
      {work.meter_unit && (
        <p>
          <strong>Meter Unit:</strong> {work.meter_unit}
        </p>
      )}
      {work.mediums?.length > 0 && (
          <p>
            <strong>Medium:</strong>{" "}
            {work.mediums.map((m) => m.medium_name).join(", ")}
          </p>
        )}
      {nonComposerPeople && nonComposerPeople.length > 0 && (   
        <>   
          <h3> Other Contributors </h3> 
            {roles
              .filter(({ key }) => key !== "composer")
              .map(({ key, label }) => {
                const value = groupByRole(key);
                if (!value) return null;

                return (
                  <p key={key}>
                    <strong>{label}:</strong> {value}
                  </p>
                );
              })}
        </> 
      )}
      {work.movements && work.movements.length > 0 && (
        <>
          <h3>Movements</h3>
          <ol>
            {work.movements.map((mvt) => (
              <li key={mvt.id}>{mvt.title || `Movement ${mvt.order}`}</li>
            ))}
          </ol>
        </>
      )}
      {work.sources && work.sources.length > 0 && (
        <>
          <h3>Sources</h3>
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
