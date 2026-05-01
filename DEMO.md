# LearnMate AI Demo Flow

## Goal
Show adaptive tutoring, quiz feedback, memory persistence, and progress evolution in one short walkthrough.

## Demo Steps

1. **Start backend and frontend**
   - Backend: `cd backend && uvicorn main:app --reload`
   - Frontend: `cd frontend && python -m http.server 5500`
   - Open `http://127.0.0.1:5500`

2. **Enter identity and topic**
   - Use `user_id`: `demo_user`
   - Use topic: `Recursion`

3. **Learn first explanation**
   - Click **Learn**
   - Observe adaptation level and base explanation.

4. **Generate quiz**
   - Click **Generate Quiz**
   - Verify difficulty label appears.

5. **Answer intentionally wrong**
   - Pick incorrect options for most questions.
   - Click **Submit Quiz**.
   - Observe:
     - score and accuracy
     - wrong answers highlighted in red
     - correct answers highlighted in green
     - explanation shown under each question

6. **View progress**
   - Click **View Progress**
   - Verify:
     - lower accuracy
     - weak areas populated
     - streak shown
     - progress bar reflects accuracy

7. **Learn topic again**
   - Click **Learn** for the same topic.
   - Confirm explanation becomes simpler due to updated memory/adaptation.

8. **Show raw memory**
   - Click **Show Raw Memory**
   - Verify full JSON state includes mistakes, weak_areas, quiz_performance, and history.

9. **Optional resources demo**
   - Set `FIRECRAWL_API_KEY`.
   - Click **Get Resources** and show summarized external material.

10. **Optional reset**
    - Click **Reset Progress**
    - Confirm progress and memory return to default state.
