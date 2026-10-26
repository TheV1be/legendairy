import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// This function processes secure HTTP POST requests sent from the player frontend
export async function POST(req: Request) {
    // 1. Unpack the JSON payload variables sent by the frontend
    const { username, currentStory, prompt } = await req.json();

    // 2. Instruct the AI model how to behave as an immersive Dungeon Master
    const systemInstruction = `
        You are an expert, immersive Tabletop RPG Dungeon Master. 
    The current player character name is "${username}".
    Always reply in the second-person narrative style (e.g., use "You see...", "You feel..."). 
    You are responding to the players actions as if talking to him as a dungeon master, an omniscient mind.
    Keep your story responses short, atmospheric, ideally under 2 or 3 sentences (except for a specific important passage for example). 
    End by presenting immediate choices or an environmental threat.
  `;

    // 3. Package the full contextual prompt block for the LLM
    const fullPrompt = `
    --- STORY BACKGROUND ---
    ${currentStory}
    
    --- PLAYER ACTION ---
    ${username} chose to: ${prompt}
    
    --- NEXT LOGICAL STORY STEP ---
  `;

    // 4. Call the high-performance Gemini 3.8 Flash model via the Vercel AI SDK
    const result = streamText({
        model: google('gemini-3.5-flash-lite'),
        system: systemInstruction,
        prompt: fullPrompt,
    });

    // 5. Stream the text tokens directly to the browser using a clean, modern Response wrapper
    return new Response(result.textStream);
}

