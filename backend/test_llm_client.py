import os
import sys
from agents.llm_client import gemini_hazir_mi, metin_uret

print(f"gemini_hazir_mi(): {gemini_hazir_mi()}")
print(f"API KEY from env: {os.getenv('GEMINI_API_KEY')}")

try:
    result = metin_uret(
        system_prompt="Sen bir asistansın.",
        user_prompt="Merhaba!",
        timeout=10
    )
    print(f"Result: {result}")
except Exception as e:
    print(f"ERROR: {e}")
