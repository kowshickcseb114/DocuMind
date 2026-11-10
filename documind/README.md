# DocuMind — Single-Deployment Document Research Workspace

DocuMind is a full-stack document research workspace. Upload PDF, DOCX and TXT files, ask questions across your documents, search relevant passages, summarize files, compare documents, and inspect source references.

## Single-deployment architecture

The React/Vite frontend is built into the same Docker image as the FastAPI backend. FastAPI serves both the website and `/api/*` endpoints from one Render Web Service.

- Frontend: React + Vite
- Backend: Python + FastAPI
- Text extraction: PyMuPDF and python-docx
- Retrieval: lightweight Python TF-IDF-style cosine ranking (no scikit-learn/NumPy dependency)
- Optional answer generation: Gemini API
- Deployment: one Render Web Service using the Free compute plan

## Deploy once on Render Free

1. Push the complete `documind` folder contents to a GitHub repository. `render.yaml` must be at the repository root.
2. In Render, choose **New → Blueprint** and connect that repository.
3. Render reads `render.yaml` and creates one web service named `documind`.
4. Confirm the service uses the **Free** plan, then deploy.
5. Wait for the build and deployment to finish. Open the service's `https://<service-name>.onrender.com` URL.

No GitHub Pages deployment, second backend service, frontend URL variable, CORS configuration, or persistent disk is required.

### Optional Gemini AI

To enable generated answers, summaries and comparisons, add `GEMINI_API_KEY` in the Render service's Environment settings. Keep the key secret; do not put it in frontend code or commit it to GitHub.

Without a Gemini key, upload, retrieval, search and source excerpts still work. The generated-answer features use a retrieval-only fallback.

## Local development

### Backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:
```powershell
.venv\\Scripts\\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server proxies `/api` requests to `http://127.0.0.1:8000`. No frontend `.env` file is required. In production, the same relative `/api` paths are handled by FastAPI on the same Render service.

## Free-plan limitations — read before using

Render Free web services have 512 MB RAM and spin down after 15 minutes without inbound traffic. A sleeping service can take about a minute to wake up.

**Uploaded files are not permanent on Render Free.** The free service has an ephemeral filesystem; uploaded documents and metadata are lost whenever the service spins down, restarts, or redeploys. Do not use this deployment for important or confidential documents. The app currently has no user accounts or per-user access control, so it is a public demo rather than a secure multi-user document vault.

The upload limit defaults to 10 MB per file. This is a practical guardrail, not a guarantee that every large or complex document will fit within the free instance's memory.

## Features

- Upload multiple PDF, DOCX and TXT files
- Ask questions across all documents or selected documents
- Search for relevant passages
- Summarize selected documents
- Compare two or more documents
- View source references (PDF page, DOCX paragraph/table row, or TXT line)
- Delete documents from the current running instance
- Responsive dashboard
- Optional Gemini-powered generation and retrieval-only fallback

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Health status |
| GET | `/api/documents` | List uploaded documents |
| POST | `/api/documents/upload` | Upload multiple files |
| DELETE | `/api/documents/{id}` | Delete a document |
| POST | `/api/ask` | Ask a question |
| POST | `/api/search` | Search passages |
| POST | `/api/summarize` | Summarize selected documents |
| POST | `/api/compare` | Compare selected documents |

## Important notes

- Scanned/image-only PDFs need OCR; OCR is not included.
- DOCX does not have stable page numbers, so paragraph/table-row references are used.
- Retrieval relevance is not a guarantee of correctness. Verify important answers against source documents.
- This starter does not implement authentication or authorization.

## License

MIT — see `LICENSE`.
