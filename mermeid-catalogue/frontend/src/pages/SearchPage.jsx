// Top-level search screen
// Holds results, selected work, and loading state
// Calls backend search endpoints
// Passes results into WorkList and WorkDetail
// Receives search input from SearchControls

import { useEffect, useState } from "react";
import SearchControls from "../components/SearchControls";
import WorkList from "../components/WorkList";
import WorkDetail from "../components/WorkDetail";

const API_BASE = "http://localhost:4000";

function SearchPage() {
  const [works, setWorks] = useState([]);
  const [selectedWork, setSelectedWork] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch all works or filtered works
  const fetchWorks = async (searchData = null) => {
    try {
      setLoading(true);

      let url = `${API_BASE}/api/works`;

      if (searchData) {
        const params = new URLSearchParams();

        // Basic keyword search
        if (searchData.basicQuery?.trim()) {
          params.append("q", searchData.basicQuery.trim());
        }

        // Advanced filters
        Object.entries(searchData.advancedFilters || {}).forEach(
          ([key, value]) => {
            if (value?.trim()) {
              params.append(key, value.trim());
            }
          }
        );

        const queryString = params.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();

      setWorks(Array.isArray(data) ? data : []);
      setSelectedWork(null); // clear detail when search changes
    } catch (err) {
      console.error("Error fetching works:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load all works on first render
  useEffect(() => {
    fetchWorks();
  }, []);

  // Load one work in detail panel
  const handleSelectWork = async (work) => {
    try {
      const res = await fetch(`${API_BASE}/api/works/${work.id}`);
      const data = await res.json();
      setSelectedWork(data);
    } catch (err) {
      console.error("Error fetching work detail:", err);
    }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "1rem" }}>
      <h1>Music Catalogue</h1>
      <p>Browse works from the music catalogue.</p>

      <SearchControls onSearch={fetchWorks} resultsCount={works.length}/>

      {loading && <p>Loading works…</p>}

      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: "1rem",
          }}
        >
          <WorkList works={works} onSelectWork={handleSelectWork} selectedWork={selectedWork}/>
          <WorkDetail work={selectedWork} />
        </div>
      )}
    </div>
  );
}

export default SearchPage;