# Plant Health

A small React and FastAPI app for managing people and plants and getting plant-care suggestions from Gemini. SQLAlchemy handles the database. Successful AI analyses are saved under the selected plant and displayed in its analysis history.

## Run locally

From the project root:

```powershell
python -m venv backend/venv
backend/venv/Scripts/python -m pip install -r backend/requirements.txt
```

Create `backend/.env`:

```dotenv
DATABASE_URL=sqlite:///./backend/plant_health.db
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=your_available_model_name
```

The SQLite URL above assumes you start the server from the project root. A MySQL URL also works. Keep API keys private and out of frontend environment variables.

Start the backend:

```powershell
backend/venv/Scripts/python -m uvicorn backend.main:app --reload --host 127.0.0.1
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. Add a person (optional), add a plant, then use Analyse. Upload a plant photo (JPEG, PNG, or WebP, up to 5 MB), describe symptoms, or provide both. Successful results are saved in the selected plant's history. API documentation is at http://localhost:8000/docs. Set `VITE_API_URL` in `frontend/.env` if the backend uses another address.

## Checks

From the project root:

```powershell
backend/venv/Scripts/python -m unittest discover -s backend/tests -v
```

From `frontend`, run `npm run build` to check the production build. Backend tests mock Gemini and use an isolated database.
