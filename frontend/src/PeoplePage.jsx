import { useEffect, useState } from "react";
import { api } from "./api.js";
import Field from "./Field.jsx";

const EMPTY = { name: "", email: "", phone: "" };

export default function PeoplePage() {
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadPeople = async () => {
    setLoading(true);
    setLoadError("");
    try {
      setPeople(await api.getPeople());
    } catch (err) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeople();
  }, []);

  const reset = () => {
    setForm(EMPTY);
    setEditingId(null);
    setErrors({});
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setMessage("");
    setError("");

    const errs = {};
    if (!form.name.trim()) errs.name = "Enter a name.";
    if (form.email.trim() && !/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.updatePerson(editingId, payload);
      } else {
        await api.createPerson(payload);
      }
      setMessage(editingId ? "Changes saved." : "Person added.");
      reset();
      await loadPeople();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (person) => {
    setEditingId(person.id);
    setForm({ name: person.name, email: person.email || "", phone: person.phone || "" });
    setErrors({});
    setMessage("");
  };

  const handleDelete = async (person) => {
    if (!window.confirm(`Delete ${person.name}? Their plants will stay but become unassigned.`)) {
      return;
    }
    if (deletingId !== null || saving) return;
    setDeletingId(person.id);
    setMessage("");
    setError("");
    try {
      await api.deletePerson(person.id);
      if (editingId === person.id) reset();
      setMessage("Person deleted.");
      await loadPeople();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <section className="panel">
        <h2>{editingId ? "Edit person" : "Add a person"}</h2>
        <form onSubmit={handleSubmit} noValidate aria-busy={saving}>
          <fieldset disabled={saving || deletingId !== null}>
            <Field label="Name *" name="name" maxLength={100} required value={form.name} onChange={handleChange} error={errors.name} />
            <Field
              label="Email"
              name="email"
              maxLength={120}
              type="email"
              value={form.email}
              onChange={handleChange}
              error={errors.email}
            />
            <Field label="Phone" name="phone" type="tel" maxLength={120} value={form.phone} onChange={handleChange} />
            <div className="actions">
              <button type="submit" className="btn-primary">
                {saving ? "Saving..." : editingId ? "Save changes" : "Add person"}
              </button>
              {editingId && (
                <button type="button" className="link-btn" onClick={reset}>
                  Cancel
                </button>
              )}
            </div>
          </fieldset>
        </form>
        {message && <p className="message" role="status">{message}</p>}
        {error && <p className="error" role="alert">{error}</p>}
        {loadError && <p className="error" role="alert">{loadError}</p>}
      </section>

      <section className="panel">
        <h2>People ({people.length})</h2>
        {loading ? (
          <p className="muted" role="status">Loading people...</p>
        ) : loadError && people.length === 0 ? (
          <p className="muted">Could not load the list. <button className="link-btn" onClick={loadPeople}>Try again</button></p>
        ) : people.length === 0 ? (
          <p className="muted">No people yet. Add someone above to assign them plants.</p>
        ) : (
          <ul className="rows">
            {people.map((person) => (
              <li key={person.id}>
                <div>
                  <div className="item-title">{person.name}</div>
                  <div className="muted small">
                    {[person.email, person.phone].filter(Boolean).join(", ") || "No contact details"}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="link-btn" disabled={saving || deletingId !== null} onClick={() => startEdit(person)}>
                    Edit
                  </button>
                  <button className="link-btn danger" disabled={saving || deletingId !== null} onClick={() => handleDelete(person)}>
                    Delete
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
