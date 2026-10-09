export default function PlantAIResult({ result }) {
  if (!result) {
    return <p className="muted">This older analysis has no structured result. Run a new analysis to see the detailed assessment.</p>;
  }
  return (
    <div className="analysis-result">
      <h3>Possible Issue</h3>
      <p>{result.possible_issue}</p>
      <h3>Explanation</h3>
      <p>{result.explanation}</p>
      <h3>Care Suggestions</h3>
      <ul>{result.care_suggestions.map((item, index) => <li key={index}>{item}</li>)}</ul>
      <h3>Expert Advice</h3>
      <p className={result.expert_advice_needed ? "error" : "muted"}>
        {result.expert_advice_needed
          ? "Expert agricultural advice is recommended."
          : "Expert advice is not indicated by this assessment. Seek help if symptoms persist or worsen."}
      </p>
    </div>
  );
}
