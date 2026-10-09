const API_BASE = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/+$/, "");

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: options.body instanceof FormData ? {} : { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and make sure the backend is running.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d) => d.msg).join(", ")
      : body.detail;
    throw new Error(detail || `Request failed (${res.status})`);
  }

  return res.status === 204 ? null : res.json();
}

const json = (data) => JSON.stringify(data);

export const api = {
  analyzePlant: (data) => request("/analysis", { method: "POST", body: data }),

  getPeople: () => request("/people"),
  createPerson: (data) => request("/people", { method: "POST", body: json(data) }),
  updatePerson: (id, data) => request(`/people/${id}`, { method: "PUT", body: json(data) }),
  deletePerson: (id) => request(`/people/${id}`, { method: "DELETE" }),

  getPlants: () => request("/plants"),
  getPlantAnalyses: (id) => request(`/plants/${id}/analyses`),
  createPlant: (data) => request("/plants", { method: "POST", body: json(data) }),
  deletePlant: (id) => request(`/plants/${id}`, { method: "DELETE" }),
};
