import os
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

async def test():
    key = os.environ.get("GROQ_API_KEY")
    print(f"Key found: {key[:5]}...{key[-5:]}" if key else "Key NOT found")
    if not key: return
    
    client = AsyncGroq(api_key=key)
    try:
        chat_completion = await client.chat.completions.create(
            messages=[{"role": "user", "content": "Hello, are you working?"}],
            model="llama-3.1-8b-instant",
        )
        print("Response:", chat_completion.choices[0].message.content)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())
