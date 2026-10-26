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
    Always reply in the first person narrative style. 
    Keep your story steps concise, atmospheric, and under 4 sentences. 
    Present immediate environmental threats or choices to the player.
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
        model: google('gemini-3.8-flash'),
        system: systemInstruction,
        prompt: fullPrompt,
    });

    // 5. Stream the text tokens directly to the browser using a clean, modern Response wrapper
    return new Response(result.textStream);
}

