'use client';

import { useState } from 'react';

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [username, setUsername] = useState('');
    const [story, setStory] = useState('You wake up in a damp, silent stone dungeon...');
    const [playerInput, setPlayerInput] = useState('');
    const [isLoading, setIsLoading] = useState(false); // Tracks if the AI is currently thinking

    const handleChoiceSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!playerInput.trim() || isLoading) return;

        const userAction = playerInput.trim();
        setPlayerInput(''); // Instantly clear the box for a responsive feel
        setIsLoading(true);

        // 1. Instantly log what the player chose onto the screen dashboard
        setStory((prev) => prev + `\n\n> ${username}: ${userAction}\n\n`);

        try {
            // 2. Broadcast the action payload across our local server route channel
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: story,
                    prompt: userAction,
                }),
            });

            if (!response.body) throw new Error('Readable stream missing from engine channel');

            // 3. Open a low-level Reader stream loop to read network text data tokens live
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                // Decode the stream binary block into clear string tokens
                const textChunk = decoder.decode(value);

                // Append characters to the screen log in real-time as they cross the network wire
                setStory((prev) => prev + textChunk);
            }
        } catch (error) {
            console.error(error);
            setStory((prev) => prev + '\n\n[System Error: Engine disconnected from AI grid.]');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-6">
            <h1 className="text-2xl font-black text-amber-500 mb-6">LEGENDAIRY ENGINE</h1>

            {/* 1. THE MAIN PRESENTATION PAGE */}
            {!isPlaying && (
                <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl text-center">
                    <p className="text-zinc-400 mb-4 font-mono text-sm">Welcome, Traveler. Identify yourself.</p>

                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-zinc-50 font-mono mb-4"
                    />

                    <button
                        type="button"
                        onClick={() => setIsPlaying(true)}
                        className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded text-sm transition font-mono"
                    >
                        ENTER REALM
                    </button>
                </div>
            )}

            {/* 2. THE GAMEPLAY TEXT SCREEN */}
            {isPlaying && (
                <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl">
                    <p className="font-mono text-xs text-zinc-500 mb-2 uppercase tracking-widest">
                        Adventurer: <span className="text-amber-400 font-bold">{username}</span>
                    </p>

                    <div className="bg-zinc-950 p-4 rounded h-[300px] overflow-y-auto border border-zinc-800 font-mono text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {story}
                    </div>

                    <form onSubmit={handleChoiceSubmit} className="flex gap-2">
                        <input
                            type="text"
                            value={playerInput}
                            disabled={isLoading}
                            onChange={(e) => setPlayerInput(e.target.value)}
                            placeholder={isLoading ? "The Dungeon Master is thinking..." : "What do you do next?..."}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-zinc-50 font-mono disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold px-6 py-2 rounded text-sm transition font-mono"
                        >
                            {isLoading ? "..." : "Action"}
                        </button>
                    </form>
                </div>
            )}
        </main>
    );
}

