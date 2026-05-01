import sys
import traceback
from services.llm_service import generate_quiz

try:
    res = generate_quiz('DBMS', 'medium', 5)
    print("SUCCESS")
    print(res)
except Exception as e:
    print("FAILED")
    print(traceback.format_exc())
