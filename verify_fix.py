import asyncio
import os
import json
from main import call_groq_with_retry
from dotenv import load_dotenv

load_dotenv()

async def test_json_format():
    print("Testing JSON format enforcement...")
    # This should trigger the "Output must be in JSON format." addition
    prompt = "Give me a list of three colors."
    system_prompt = "You are a helpful assistant."
    try:
        content = await call_groq_with_retry(prompt, system_prompt=system_prompt)
        print(f"Content: {content}")
        json.loads(content)
        print("✅ JSON format test passed.")
    except Exception as e:
        print(f"❌ JSON format test failed: {e}")

async def test_text_format():
    print("\nTesting text format (no JSON requirement)...")
    prompt = "Write a short poem about a cat."
    system_prompt = "You are a poet."
    try:
        content = await call_groq_with_retry(prompt, system_prompt=system_prompt, response_format=None)
        print(f"Content: {content}")
        if "json" not in content.lower():
            print("✅ Text format test passed.")
        else:
            print("⚠️ Text format test might have included JSON instruction unnecessarily.")
    except Exception as e:
        print(f"❌ Text format test failed: {e}")

if __name__ == "__main__":
    if not os.environ.get("GROQ_API_KEY"):
        print("Error: GROQ_API_KEY not found in environment.")
    else:
        asyncio.run(test_json_format())
        asyncio.run(test_text_format())
