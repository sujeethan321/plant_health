import { useEffect, useState } from "react";
import { api } from "./api.js";
import PlantAIResult from "./PlantAIResult.jsx";

export default function AnalysisHistory({ plantId, refreshKey = 0 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setItems([]);
    setError("");
    api.getPlantAnalyses(plantId)
      .then((results) => { if (active) setItems(results); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [plantId, refreshKey, retry]);
  return (
    <div className="analysis-history">
      <h3>Saved analyses</h3>
      {loading ? <p className="muted" role="status">Loading analyses...</p>
        : error ? <p className="error" role="alert">{error} <button className="link-btn" onClick={() => setRetry((value) => value + 1)}>Try again</button></p>
        : items.length === 0 ? <p className="muted">No saved analyses yet. Run an analysis for this plant to start its history.</p>
        : items.map((item) => (
          <details className="history-entry" key={item.id}>
            <summary>Observed on {item.observation_date} / {item.location}</summary>
            <p className="symptoms"><strong>Symptoms:</strong> {item.symptoms}</p>
            <PlantAIResult result={item.ai_result} />
          </details>
        ))}
    </div>
  );
}
