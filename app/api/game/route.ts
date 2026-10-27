import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

// This function processes secure HTTP POST requests sent from the player frontend
export async function POST(req: Request) {
    // 1. Unpack the JSON payload variables sent by the frontend
    const { username, currentStory, prompt, turnCount, maxTurns, gamePreferences, currentInventory, currentZone } = await req.json();

    const parsedMaxTurns = Number(maxTurns) || 10;

    const movesLeft = parsedMaxTurns - turnCount;

    let pacingInstruction = '';
    if (movesLeft <= 0) {
        pacingInstruction = `CRITICAL OVERRIDE: 0 MOVES REMAIN. The adventure has hit its absolute end. You are FORBIDDEN from generating new threats or actions. Wrap up the story completely right now based on the player's last choice and force a clean narrative conclusion. You MUST explicitly print the words 'GAME OVER' or 'VICTORY' in this final paragraph.`;
    } else if (movesLeft === 1) {
        pacingInstruction = `FINALE APPROACHING: EXACTLY 1 MOVE REMAINING AFTER THIS ONE. The player is about to hit their absolute final choice. Set up the definitive climax, final chamber entrance, or ultimate obstacle confrontation right now so they face a massive do-or-die choice on their very next move.`;
    } else {
        pacingInstruction = `GAME ONGOING: ${movesLeft} moves remain before the campaign finale threshold. You have complete storytelling freedom. Feel free to create pacing waves—ups, downs, dynamic successes, narrow escapes, or sudden tactical setbacks. Keep the plot engaging and move them realistically through the layout zones.`;
    }

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

    --- ENGINE METADATA PACKING (CRITICAL) ---
    At the absolute end of your response, after a blank line, you MUST append a data control block wrapped in strict custom element tags. Do not mention these tags in the narrative text.
    
    - Map Tracking: Output the exact name of the room or area the player is currently inside wrapped in <Zone>...</Zone> tags. (Current zone is: "${currentZone || 'Starting Area'}". Use consistent, simple room names like 'Dungeon Cell', 'Shadowed Hallway', 'Armory' so we can map them visually!).
    - Item Management: Based on the action, if the player gains an item, wrap it in <Add>Item Name</Add>. If they consume or lose an item in their current inventory ${JSON.stringify(currentInventory)}, wrap it in <Remove>Item Name</Remove>. If nothing changes, leave them out.
    - Status Metrics: Output a 1-sentence analytical status note regarding their safety footprint wrapped in <Status>...</Status> tags (e.g., 'Exposed', 'Shielded', 'In Danger').
    
    Example layout of the very bottom of your response:
    <Zone>Dark Catacombs</Zone>
    <Add>Rusty Key</Add>
    <Status>Cornered by shadows</Status>
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

