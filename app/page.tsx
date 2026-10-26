'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [username, setUsername] = useState('');
    const [story, setStory] = useState('');
    const [playerInput, setPlayerInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [gamePreferences, setGamePreferences] = useState('A damp stone dungeon, medium difficulty');

    // Laser pointers for automated interface control
    const storyEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null); // New: Pointer targeting the typing box

    // Automatically scroll down whenever the story text updates
    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    // New Observer: Watch the loader state. The instant AI stops thinking, force cursor focus back!
    useEffect(() => {
        if (!isLoading && isPlaying) {
            inputRef.current?.focus();
        }
    }, [isLoading, isPlaying]);

    const handleStartGame = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setIsPlaying(true);
        setStory('');

        try {
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: `STARTING NEW GAME. Player Preferences: ${gamePreferences}`,
                    prompt: 'Generate the opening scene paragraph introducing the setting.',
                }),
            });

            if (!response.body) throw new Error('Readable stream missing from engine channel');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value);
                setStory((prev) => prev + textChunk);
            }
        } catch (error) {
            console.error(error);
            setStory('[System Error: Failed to generate opening narrative.]');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChoiceSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!playerInput.trim() || isLoading) return;

        const userAction = playerInput.trim();
        setPlayerInput('');
        setIsLoading(true);

        setStory((prev) => prev + `\n\n> ${username}: ${userAction}\n\n`);

        try {
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

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value);
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

                    <p className="text-zinc-400 mb-2 font-mono text-xs text-left">Describe your custom adventure (Setting, difficulty, tone...):</p>
                    <textarea
                        value={gamePreferences}
                        onChange={(e) => setGamePreferences(e.target.value)}
                        placeholder="e.g., A cyberpunk neon city, hard difficulty, intense combat..."
                        rows={3}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-zinc-50 font-mono mb-4 resize-none"
                    />

                    <button
                        type="button"
                        disabled={isLoading || !username.trim()}
                        onClick={handleStartGame}
                        className="w-full bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold px-4 py-2 rounded text-sm transition font-mono"
                    >
                        {isLoading ? "GENERATING REALM..." : "ENTER REALM"}
                    </button>
                </div>
            )}

            {/* 2. THE GAMEPLAY TEXT SCREEN */}
            {isPlaying && (
                <div className="w-full max-w-xl bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl">
                    <p className="font-mono text-xs text-zinc-500 mb-2 uppercase tracking-widest">
                        Adventurer: <span className="text-amber-400 font-bold">{username}</span>
                    </p>

                    {/* Swapped h-[300px] to h-[50vh] to handle dynamic, relative screen expansion scaling */}
                    <div className="bg-zinc-950 p-4 rounded h-[50vh] overflow-y-auto border border-zinc-800 font-mono text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {story}
                        <div ref={storyEndRef} />
                    </div>

                    <form onSubmit={handleChoiceSubmit} className="flex gap-2">
                        <input
                            ref={inputRef} // Attached the ref selector right here onto the text element field
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

