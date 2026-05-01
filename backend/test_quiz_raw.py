import sys
from services.llm_service import generate_response, parse_text_quiz

topic = "DBMS"

prompt = f"""You are LearnMate AI Quiz Generator.

Generate exactly 5 multiple-choice questions for the topic entered by the student.

Topic: {topic}

Rules:

* Questions must be directly related to the topic.
* Avoid generic or repeated wording.
* Every question must have:

  * Question
  * 4 answer options
  * Correct answer
* Mix easy and medium-level questions.
* Questions should test understanding, not memorization only.
* Do not repeat the same question structure.
* Never use phrases like:

  * Which statement best reflects a key idea
  * Core principle
  * Rare edge cases
  * Unrelated to learning
* Make each question meaningful.

Return the quiz in this format:

Question 1:
Question: What does DBMS stand for?
A. Data Backup Management System
B. Database Management System
C. Data Building Monitoring Service
D. Database Backup Monitoring Software
Correct Answer: B

Question 2:
Question: Which of the following is an example of a DBMS?
A. Chrome
B. Linux
C. MySQL
D. Windows
Correct Answer: C

Continue until 5 questions are generated."""

try:
    raw, model_used = generate_response(prompt)
    print("--- RAW OUTPUT ---")
    print(f"Model used: {model_used}")
    print(raw)
    print("--- PARSED OUTPUT ---")
    res = parse_text_quiz(raw)
    print(res)
except Exception as e:
    import traceback
    print(traceback.format_exc())
