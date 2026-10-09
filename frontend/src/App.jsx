import { useState } from "react";
import PeoplePage from "./PeoplePage.jsx";
import PlantsPage from "./PlantsPage.jsx";
import AnalysisPage from "./AnalysisPage.jsx";

const TABS = [
  { id: "people", label: "People" },
  { id: "plants", label: "My Plants" },
  { id: "analysis", label: "Analyse" },
];

export default function App() {
  const [tab, setTab] = useState("people");

  return (
    <>
      <header>
        <h1 className="brand">Plant Health</h1>
        <nav>
          {TABS.map((item) => (
            <button
              key={item.id}
              className={`nav-btn${tab === item.id ? " active" : ""}`}
              aria-current={tab === item.id ? "page" : undefined}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </header>
      <main>{tab === "people" ? <PeoplePage /> : tab === "plants" ? <PlantsPage /> : <AnalysisPage />}</main>
    </>
  );
}
