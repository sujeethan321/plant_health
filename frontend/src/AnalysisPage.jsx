import { useEffect, useRef, useState } from "react";
import { api } from "./api.js";
import PlantAIResult from "./PlantAIResult.jsx";
import Field from "./Field.jsx";
import AnalysisHistory from "./AnalysisHistory.jsx";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function today() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
}

export default function AnalysisPage() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState(() => ({ plant_id: "", observation_date: today(), location: "", symptoms: "" }));
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [analysing, setAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const imageInput = useRef(null);

  useEffect(() => {
    if (!image) { setImagePreview(""); return; }
    const url = URL.createObjectURL(image);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    setAnalysis(null);
    setError("");
    setImage(null);
    if (file && (!IMAGE_TYPES.includes(file.type) || file.size === 0 || file.size > MAX_IMAGE_BYTES)) {
      setErrors((current) => ({ ...current, image: "Choose a JPEG, PNG, or WebP image up to 5 MB." }));
      event.target.value = "";
      return;
    }
    setErrors({});
    setImage(file || null);
  };

  const removeImage = () => {
    setImage(null);
    if (imageInput.current) imageInput.current.value = "";
    setErrors({});
    setAnalysis(null);
  };

  useEffect(() => {
    let active = true;
    api.getPlants()
      .then((items) => { if (active) setPlants(items); })
      .catch((err) => { if (active) setLoadError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "plant_id" ? { location: plants.find((plant) => String(plant.id) === value)?.location || "" } : {}),
    }));
    setErrors({});
    setError("");
    setAnalysis(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (analysing) return;
    const nextErrors = {};
    if (!plants.some((plant) => String(plant.id) === form.plant_id)) nextErrors.plant_id = "Choose a plant.";
    if (!form.observation_date) nextErrors.observation_date = "Choose an observation date.";
    if (!form.location.trim()) nextErrors.location = "Enter the plant's location.";
    if (!form.symptoms.trim() && !image) nextErrors.symptoms = "Describe symptoms or upload a plant image.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setAnalysing(true);
    setError("");
    setAnalysis(null);
    try {
      const formData = new FormData();
      formData.append("plant_id", form.plant_id);
      formData.append("observation_date", form.observation_date);
      formData.append("location", form.location.trim());
      formData.append("symptoms", form.symptoms.trim());
      if (image) formData.append("image", image);
      const result = await api.analyzePlant(formData);
      setAnalysis(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalysing(false);
    }
  };

  return (
    <>
      <section className="panel">
        <h2>Analyse plant health</h2>
        <p className="muted">Choose a saved plant, then upload a photo or describe what you observed.</p>
        {loading && <p role="status">Loading plantsâ€¦</p>}
        {loadError && <p className="error" role="alert">{loadError}</p>}
        {!loading && !loadError && plants.length === 0 && <p className="muted">Add a plant in My Plants before starting an analysis.</p>}
        <form onSubmit={handleSubmit} aria-busy={analysing}>
          <Field label="Plant *" name="plant_id" as="select" value={form.plant_id} onChange={handleChange}
            error={errors.plant_id} required disabled={loading || analysing || plants.length === 0}>
            <option value="">Choose a plant</option>
            {plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.name} ({plant.plant_type})</option>)}
          </Field>
          <Field label="Observation date *" type="date" name="observation_date" value={form.observation_date}
            onChange={handleChange} error={errors.observation_date} required disabled={analysing} />
          <Field label="Location *" name="location" value={form.location} onChange={handleChange}
            error={errors.location} maxLength={120} required disabled={analysing} />
          <Field label={image ? "Symptoms (optional)" : "Symptoms"} name="symptoms" as="textarea" rows={5} value={form.symptoms}
            onChange={handleChange} error={errors.symptoms} maxLength={2000} required={!image} disabled={analysing}
            placeholder="For example: yellow leaves with brown spots, starting three days ago." />
          <section className="image-upload" aria-labelledby="image-upload-title">
            <h3 id="image-upload-title">Plant image</h3>
            <label className="field">
              <span>Upload an image (optional)</span>
              <input ref={imageInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange}
                disabled={analysing} aria-invalid={!!errors.image} aria-describedby="image-help image-error" />
            </label>
            <p id="image-help" className="muted small">JPEG, PNG, or WebP, up to 5 MB. Use a clear photo of the selected plant. Its identity must match before health analysis.</p>
            <p id="image-error" className="error" role={errors.image ? "alert" : undefined}>{errors.image || ""}</p>
            {image && (
              <div>
                {imagePreview && <img className="image-preview" src={imagePreview} alt="Selected plant photo" />}
                <p className="muted small">{image.name}</p>
                <button className="link-btn" type="button" disabled={analysing} onClick={removeImage}>Remove image</button>
              </div>
            )}
          </section>
          <div className="actions">
            <button className="btn-primary" type="submit" disabled={loading || analysing || !!loadError || plants.length === 0}>
              {analysing ? "Analysingâ€¦" : "Analyse"}
            </button>
          </div>
        </form>
        <p className="muted small">Your plant details, observations, and selected image are sent to Gemini when you select Analyse. The analysis result is saved to your plant; the uploaded image is not stored.</p>
        {analysing && <p className="message" role="status">Gemini is reviewing the observationsâ€¦</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </section>
      {analysis && (
        <section className="panel" aria-live="polite">
          <h2>Analysis for {analysis.plant_name}</h2>
          <p className="message" role="status">Saved to this plant's analysis history.</p>
          <p className="muted small">Observed on {analysis.observation_date} Â· {analysis.location}</p>
          <PlantAIResult result={analysis.ai_result} />
          <p className="muted small">AI assessment based on your observations. Confirm the cause before treating the plant.</p>
        </section>
      )}
      {form.plant_id && (
        <section className="panel">
          <AnalysisHistory plantId={Number(form.plant_id)} refreshKey={analysis?.id || 0} />
        </section>
      )}
    </>
  );
}
