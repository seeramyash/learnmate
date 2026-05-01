# LearnMate AI Viva Report

## 1. Project Summary

LearnMate AI is an adaptive learning web application with:

- FastAPI backend
- HTML/CSS/JavaScript frontend
- AI-generated topic explanations
- AI-generated quizzes
- quiz submission and grading
- progress tracking
- persistent user memory
- optional external learning resources

Main learning flow:

`Learn -> Quiz -> Submit -> Progress`

## 2. Tech Stack

- Backend: FastAPI, Pydantic, Python
- Frontend: HTML, CSS, JavaScript
- Primary LLM design: Gemini
- Current working LLM in live testing: Ollama (`llama3.1:8b`)
- Fallback storage: JSON file
- External resources: Firecrawl search + summary fallback

## 3. Project Structure

- `backend/main.py`
  Main FastAPI application
- `backend/routes/tutor.py`
  `/learn` and `/resources`
- `backend/routes/quiz.py`
  `/quiz` and `/quiz/submit`
- `backend/routes/progress.py`
  `/progress`
- `backend/services/llm_service.py`
  Gemini -> Ollama -> safe fallback logic
- `backend/services/memory_service.py`
  user memory persistence
- `backend/services/firecrawl_service.py`
  resource fetching and summaries
- `backend/data/memory.json`
  stored user learning data
- `frontend/index.html`
  UI structure
- `frontend/app.js`
  frontend logic
- `frontend/style.css`
  UI styling
- `start_learnmate.ps1` / `start_learnmate.bat`
  one-command launcher

## 4. Architecture

Frontend sends requests to FastAPI endpoints.

FastAPI routes call service layers:

- tutor service for explanations
- quiz service for quiz generation
- memory service for persistence
- progress route for analytics
- firecrawl service for resource links

LLM flow:

1. Try Gemini
2. If Gemini fails or returns empty output, try Ollama
3. If Ollama also fails, return safe fallback text

## 5. Current Model Status

### Intended design

- Primary: Gemini
- Fallback: Ollama
- Final fallback: safe text response

### Actual live status during testing

The app is currently using:

- `ollama` for `/learn`
- `ollama` for `/quiz` when generation succeeds

### Why Gemini is not being used now

Gemini key is present in `.env`, but runtime Gemini generation failed in testing.

Observed Gemini error:

- `models/gemini-pro is not found for API version v1beta`

This means the app is currently falling through to Ollama, which is why your live successful responses show:

- `model_used: "ollama"`

### Why the UI showed "Fallback" in your screenshot

The header badge starts in a default state before any API call.
After a successful `/learn` or `/quiz` response, it updates dynamically.

So:

- before first request: `Fallback`
- after successful Ollama response: `Local (Ollama)`
- after successful Gemini response: `API (Gemini)`

## 6. Where User Data Is Stored

Yes, user data is being stored.

Storage file:

- `backend/data/memory.json`

What gets stored:

- `user_id`
- `topics_learned`
- `weak_areas`
- `strong_areas`
- `mistakes`
- `learning_style`
- `quiz_performance`
- `accuracy_history`
- `study_streak`
- `last_activity_date`
- `quiz_sessions`
- `repeated_topic_errors`

### Verified persistence

During testing, `viva_submit_user` was written into `memory.json` with:

- `total_questions: 5`
- `correct_answers: 3`
- `accuracy: 60.0`
- mistakes on question indices `3` and `4`
- `quiz_sessions: 1`
- `repeated_topic_errors: { "Recursion": 2 }`

So persistence is working.

## 7. API Endpoints

### `GET /health`

Checks whether backend is running.

### `POST /learn`

Input:

```json
{
  "user_id": "student_001",
  "topic": "Recursion"
}
```

Output includes:

- explanation
- adaptation level
- `model_used`

### `POST /quiz`

Input:

```json
{
  "user_id": "student_001",
  "topic": "Recursion",
  "num_questions": 5
}
```

Output includes:

- questions
- difficulty
- `model_used`

### `POST /quiz/submit`

Input:

- user id
- topic
- questions
- selected answers

Output includes:

- score
- total
- accuracy percentage
- per-question correctness

### `GET /progress?user_id=...`

Returns:

- questions attempted
- correct answers
- accuracy
- streak
- learning style
- topic-wise stats

### `POST /resources`

Returns:

- topic
- summary
- source list with `title`, `url`, `summary`

## 8. Live Testing Results

These checks were performed on the running project.

### Health

Passed:

- `/health` returned

```json
{"status":"ok","service":"learnmate-ai"}
```

### Learn

Passed:

- `/learn` returned a full explanation on `Recursion`
- `model_used` returned `ollama`

### Quiz

Passed after parser stabilization:

- quiz generation works with Ollama output format
- `model_used` returned `ollama`

Note:

- Ollama responses can be slower and occasionally inconsistent
- a transient `502` was observed during one quiz generation attempt

### Quiz Submit

Passed:

- manual submit test returned:
  - score: `3/5`
  - accuracy: `60.0`

### Progress

Passed:

- `/progress` reflected the submitted quiz stats correctly

### Resources

Passed:

- `/resources` returned:
  - summary
  - clickable source links
  - source summaries

## 9. Fixes Applied During Verification

The following fixes were applied while checking the project:

- changed Ollama model from `llama3:8b` to `llama3.1:8b`
- removed OpenAI dependency and runtime usage
- added root `main.py` so `uvicorn main:app` works from project root
- added one-command launcher:
  - `start_learnmate.ps1`
  - `start_learnmate.bat`
- improved quiz parsing for Ollama outputs
- increased Ollama timeout to reduce quiz failures
- added dynamic `model_used` support for frontend/backend
- added clickable resources with summaries

## 10. Current Limitations

### 1. Gemini is not currently active

Although configured, Gemini is failing in runtime tests, so the project currently works through Ollama.

### 2. Ollama can be slow

Longer quiz prompts can take noticeable time.

### 3. Occasional transient quiz failure

One live quiz request returned `502`, but subsequent quiz generation worked after parser improvements.

### 4. Deprecated Gemini library warning

The backend currently uses `google.generativeai`, which now shows a deprecation warning.

## 11. How to Run the Project

From project root:

```powershell
.\start_learnmate.bat
```

Then open:

- Frontend: `http://127.0.0.1:5500`
- Backend: `http://127.0.0.1:8000/health`

## 12. Viva Talking Points

If asked "What does this project do?"

Answer:

This project is an adaptive AI tutor. It explains topics, generates quizzes, evaluates answers, tracks progress, and stores learning history for each user.

If asked "How is it adaptive?"

Answer:

It changes explanation depth based on user performance, streaks, weak areas, and repeated mistakes stored in memory.

If asked "Where is memory stored?"

Answer:

It is stored in `backend/data/memory.json` as persistent per-user learning state.

If asked "Which AI model is being used?"

Answer:

The architecture is Gemini-first with Ollama fallback, but in the current tested environment the app is using Ollama because Gemini is failing.

If asked "What is stored for each student?"

Answer:

Topics learned, weak and strong areas, mistakes, quiz counts, accuracy history, repeated errors, learning style, and study streak.

If asked "How does quiz submission affect the system?"

Answer:

The submission updates memory, accuracy, mistakes, topic stats, and progress analytics. That data is later used to adapt future explanations and difficulty.

If asked "What happens if AI fails?"

Answer:

The backend tries Gemini first, then Ollama, and if both fail it returns a safe fallback response so the app does not completely break.

## 13. Final Conclusion

The project is functional and usable.

Confirmed working:

- backend startup
- frontend startup
- learn flow
- quiz generation
- quiz submission
- progress updates
- resource fetching
- user data persistence

Current real execution model:

- `Ollama (llama3.1:8b)`

Current main improvement opportunity:

- fix Gemini model/runtime configuration so the app can truly use Gemini as primary instead of falling back to Ollama.

