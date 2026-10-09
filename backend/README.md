# Backend

Run from the project root:

```powershell
python -m pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --host 127.0.0.1
```

Or, from the backend directory, use `python -m uvicorn main:app --reload --host 127.0.0.1`.

Keep `DATABASE_URL` in `backend/.env`. Its location is resolved relative to the backend directory, regardless of the working directory. Existing environment variables take precedence.

## Structure

- `main.py`: compatibility entry point.
- `app/main.py`: FastAPI setup, CORS, router registration, and startup table creation.
- `app/config.py`: environment and local CORS configuration.
- `app/database.py`: engine, session factory, declarative base, and session dependency.
- `app/models/`: SQLAlchemy database models.
- `app/schemas/`: Pydantic request and response schemas.
- `app/routers/`: people and plant endpoints, plus the shared record lookup helper.

API paths, request/response fields, and database tables are unchanged. Table creation runs during application startup; it does not migrate existing tables. The application uses the database selected by `DATABASE_URL`; the existing SQLite file is not moved or modified.

## Gemini plant analysis

Open the Analyse tab, choose a saved plant, and enter the observation date, location, and symptoms. The selected plant's location is prefilled and can be changed for this observation. Analyse sends these details to Gemini through POST /analysis and displays the returned text. Each successful analysis is saved under the selected plant with its observation date, location, symptoms, and result. View history in My Plants or below the Analyse form.

Set GEMINI_API_KEY in backend/.env. The existing Gemini_api_key spelling is also supported. Never put the key in a frontend VITE variable. Restart the backend after changing environment variables.

GEMINI_MODEL is optional; its default is gemini-3.8-flash. Set it to a model available to your API key if needed. Requests use Google's generateContent REST endpoint with a 45-second timeout, so no extra SDK dependency is needed. Internet access and a working Gemini API key with available quota are required.

Google API reference: https://ai.google.dev/api/generate-content

From the project root, run the mocked service tests with:

python -m unittest discover -s backend/tests -v

## Image analysis

The Analyse form accepts an optional JPEG, PNG, or WebP image up to 5 MB.
Symptoms may be omitted when an image is selected. The backend validates the
base64, size, and image signature, then sends the image as inline data with
the observations to Gemini. Successful results are saved in plant history;
image files are not stored.

Gemini image input reference: https://ai.google.dev/gemini-api/docs/generate-content/image-understanding

## Structured results

POST /analysis and GET /plants/{plant_id}/analyses return ai_result with possible_issue, explanation, care_suggestions, and expert_advice_needed. The existing analyses.result Text column stores JSON. Legacy plain-text or invalid records return ai_result: null without modifying stored data.

## Multipart uploads

POST /analysis accepts multipart/form-data with plant_id, observation_date,
location, optional symptoms, and optional image. New analyses return HTTP 201.
The image belongs to that analysis request and is not permanently stored.
Files are checked for MIME type, signature, nonempty content, and a 5 MB limit.
python-multipart is included in requirements.txt. The image is base64-encoded
only inside the backend when sending it to Gemini.

Mocked scenario tests cover healthy/diseased classifications and rejection of
blurry/non-plant image-only requests. These tests do not measure Gemini vision
accuracy; real-photo checks require the live provider.

## Selected plant image matching

Gemini must identify the visible plant and confirm plant_match: match before
an image-based assessment is accepted. Mismatched or unverifiable images return
HTTP 422 and are not saved, even if symptoms were supplied. Plant names should
identify the species; nicknames alone may not provide enough information.
This is AI-based species matching, not proof of an individual plant's identity.
