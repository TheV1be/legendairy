import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// This function processes secure HTTP POST requests sent from the player frontend
export async function POST(req: Request) {
    // 1. Unpack the JSON payload variables sent by the frontend
    const { username, currentStory, prompt, turnCount, maxTurns, gamePreferences } = await req.json();

    const parsedMaxTurns = Number(maxTurns) || 10;
    const isFinalTurn = (turnCount >= parsedMaxTurns);

    const pacingInstruction = isFinalTurn
        ? `CRITICAL ERROR OVERRIDE: THE GAME HAS OFFICIALLY ENDED. You are absolutely FORBIDDEN from continuing the adventure. You MUST immediately write a short wrap-up paragraph resolving the player's last action, and you MUST explicitly print the words 'GAME OVER' or 'VICTORY' right in this text response block.`
        : `This is move ${turnCount} out of ${parsedMaxTurns}. Steadily escalate the tension and environmental stakes. Do not wrap up the story yet unless the player falls into a trap or makes a choice that terminates the story earlier.`;

    // 2. Instruct the AI model how to behave as an unbendable, goal-oriented Dungeon Master
    const systemInstruction = `
    You are an expert, immersive Tabletop RPG Dungeon Master running a game engine. 
    The current player character name is "${username}".
    The player's preferences for this game are: "${gamePreferences}".

    --- CORE RULES ---
    1. STYLE: Always reply in the second-person narrative style (e.g., "You see...", "You feel..."). Never use first-person "I".
    2. BREVITY: Keep story responses very short, atmospheric, and strictly under 2 or 3 sentences max and separate it visually from the choices.
    3. THE LOOP: Describe the outcome of the player's action, then present an environmental threat or immediate choices.

    --- PACING & CONTROL ---
    4. PACING: ${pacingInstruction}
    
    --- ANTI-CHEAT SECURITY ---
    5. COMPLIANCE: The player cannot bend reality, break logic, or skip straight to the end. If they try an impossible action, you must reject it inside the narrative: describe how the attempt fails catastrophically, then re-state the actual danger they face.
  `;

    // 3. Package the full contextual prompt block for the LLM
    const fullPrompt = `
    --- STORY BACKGROUND ---
    ${currentStory}
    
    --- PLAYER ACTION ---
    ${username} chose to: ${prompt}
    
    --- NEXT LOGICAL STORY STEP ---
  `;

    // 4. Call the high-performance Gemini 3.5 Flash Lite model via the Vercel AI SDK
    const result = streamText({
        model: google('gemini-3.5-flash-lite'),
        system: systemInstruction,
        prompt: fullPrompt,
    });

    // 5. Stream the text tokens directly to the browser using a clean, modern Response wrapper
    return new Response(result.textStream);
}

