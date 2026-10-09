import { useEffect, useState } from "react";
import { api } from "./api.js";
import Field from "./Field.jsx";
import AnalysisHistory from "./AnalysisHistory.jsx";

const PLANT_TYPES = ["Vegetable", "Fruit", "Herb", "Flower", "Tree", "Shrub", "Houseplant", "Other"];
const EMPTY = { name: "", plant_type: "", owner_id: "", location: "" };

export default function PlantsPage() {
  const [plants, setPlants] = useState([]);
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [historyPlantId, setHistoryPlantId] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const [plantList, peopleList] = await Promise.all([api.getPlants(), api.getPeople()]);
      setPlants(plantList);
      setPeople(peopleList);
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const ownerName = (ownerId) => people.find((p) => p.id === ownerId)?.name || "Unassigned";

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setMessage("");
    setError("");

    const errs = {};
    if (!form.name.trim()) errs.name = "Enter the plant's name.";
    if (!form.plant_type) errs.plant_type = "Choose a plant type.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await api.createPlant({
        name: form.name.trim(),
        plant_type: form.plant_type,
        owner_id: form.owner_id ? Number(form.owner_id) : null,
        location: form.location.trim() || null,
      });
      setForm(EMPTY);
      setErrors({});
      setMessage("Plant added.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plant) => {
    if (!window.confirm(`Remove ${plant.name} from your plants?`)) return;
    if (deletingId !== null || saving) return;
    setDeletingId(plant.id);
    setMessage("");
    setError("");
    try {
      await api.deletePlant(plant.id);
      setMessage("Plant removed.");
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section className="panel">
        <h2>Add a plant</h2>
        <form onSubmit={handleSubmit} noValidate aria-busy={saving}>
          <fieldset disabled={saving || deletingId !== null}>
            <Field
              label="Plant name *"
              name="name"
              maxLength={100}
              required
              value={form.name}
              onChange={handleChange}
              error={errors.name}
            />
            <Field
              label="Plant type *"
              name="plant_type"
              required
              as="select"
              value={form.plant_type}
              onChange={handleChange}
              error={errors.plant_type}
            >
              <option value="">Choose a type</option>
              {PLANT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </Field>
            <Field label="Owner" name="owner_id" as="select" value={form.owner_id} onChange={handleChange}>
              <option value="">Unassigned</option>
              {people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Field>
            <Field label="Location (optional)" name="location" maxLength={120} value={form.location} onChange={handleChange} />
            <div className="actions">
              <button type="submit" className="btn-primary">
                {saving ? "Adding..." : "Add plant"}
              </button>
            </div>
          </fieldset>
        </form>
        {message && <p className="message" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {loadError && <p className="error" role="alert">{loadError}</p>}
      </section>

      <section className="panel">
        <h2>My plants ({plants.length})</h2>
        {loading ? (
          <p className="muted" role="status">Loading plants...</p>
        ) : loadError && plants.length === 0 ? (
          <p className="muted">Could not load the list. <button className="link-btn" onClick={loadData}>Try again</button></p>
        ) : plants.length === 0 ? (
          <p className="muted">No plants yet. Add one above to get started.</p>
        ) : (
          <ul className="rows">
            {plants.map((plant) => (
              <li key={plant.id}>
                <div>
                  <div className="item-title">
                    {plant.name} <span className="muted small">{plant.plant_type}</span>
                  </div>
                  <div className="muted small">
                    Owner: {ownerName(plant.owner_id)}. Location: {plant.location || "not given"}.
                  </div>
                  {plant.symptoms && <p className="symptoms">{plant.symptoms}</p>}
                  {historyPlantId === plant.id && <AnalysisHistory plantId={plant.id} />}
                </div>
                <div className="row-actions">
                  <button className="link-btn" aria-expanded={historyPlantId === plant.id} onClick={() => setHistoryPlantId((current) => current === plant.id ? null : plant.id)}>
                    {historyPlantId === plant.id ? "Hide analyses" : "View analyses"}
                  </button>
                  <button className="link-btn danger" disabled={saving || deletingId !== null} onClick={() => handleDelete(plant)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
