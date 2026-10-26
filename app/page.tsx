'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);

    const [username, setUsername] = useState('');
    const [story, setStory] = useState('');
    const [playerInput, setPlayerInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [gamePreferences, setGamePreferences] = useState('A damp stone dungeon, medium difficulty');

    const [turnCount, setTurnCount] = useState(0);
    const [maxTurns, setMaxTurns] = useState('10');
    const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

    const storyEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Automatically scroll down whenever the story text updates
    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    // Keep the focus inside the input bar whenever the AI finishes typing
    useEffect(() => {
        if (!isLoading && isPlaying && gameState === 'PLAYING') {
            inputRef.current?.focus();
        }
    }, [isLoading, isPlaying, gameState]);

    // Handles generating the custom opening story paragraph
    const handleStartGame = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setIsPlaying(true);
        setStory('');
        setTurnCount(0);
        setGameState('PLAYING');

        try {
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: `STARTING NEW GAME. Player Preferences: ${gamePreferences}`,
                    prompt: 'Generate the opening scene paragraph introducing the setting.',
                    turnCount: 0,
                    gamePreferences,
                    maxTurns: Number(maxTurns) || 10
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

    // Handles submitting player choices mid-game
    const handleChoiceSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!playerInput.trim() || isLoading || gameState !== 'PLAYING') return;

        const userAction = playerInput.trim();
        setPlayerInput('');
        setIsLoading(true);

        // Document the action onto the visual feed log box
        setStory((prev) => prev + `\n\n> ${username}: ${userAction}\n\n`);

        try {
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: story,
                    prompt: userAction,
                    turnCount,
                    gamePreferences,
                    maxTurns: Number(maxTurns) || 10
                }),
            });

            if (!response.body) throw new Error('Readable stream missing from engine channel');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullResponseText = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value);
                fullResponseText += textChunk;
                setStory((prev) => prev + textChunk);
            }

            // Action processed successfully: Increment our local move tally state
            setTurnCount((prev) => prev + 1);

            // Scan the text for explicit keywords to trigger end conditions
            const upperText = fullResponseText.toUpperCase();
            if (upperText.includes('GAME OVER')) {
                setGameState('LOST');
            } else if (upperText.includes('VICTORY')) {
                setGameState('WON');
            }

        } catch (error) {
            console.error(error);
            setStory((prev) => prev + '\n\n[System Error: Engine disconnected from AI grid.]');
        } finally {
            setIsLoading(false);
        }
    };

    // Resets the state machine variables completely to restart on the main landing screen
    const handleResetGame = () => {
        setIsPlaying(false);
        setStory('');
        setPlayerInput('');
        setTurnCount(0);
        setGameState('PLAYING');
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

                    <p className="text-zinc-400 mb-2 font-mono text-xs text-left">Campaign length (Total number of choices):</p>
                    <input
                        type="number"
                        value={maxTurns}
                        onChange={(e) => setMaxTurns(e.target.value)}
                        placeholder="10"
                        min="0"
                        max="50"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-zinc-50 font-mono mb-6"
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
                    <div className="flex justify-between font-mono text-xs text-zinc-500 mb-2 uppercase tracking-widest">
                        <p>Adventurer: <span className="text-amber-400 font-bold">{username}</span></p>
                        <p>Move: <span className="text-amber-400 font-bold">{turnCount}</span> / {maxTurns}</p>
                    </div>

                    <div className="bg-zinc-950 p-4 rounded h-[50vh] overflow-y-auto border border-zinc-800 font-mono text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                        {story}
                        <div ref={storyEndRef} />
                    </div>

                    {/* ACTIVE GAME CONTROL LAYOUT INPUT */}
                    {gameState === 'PLAYING' && (
                        <form onSubmit={handleChoiceSubmit} className="flex gap-2">
                            <input
                                ref={inputRef}
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
                    )}

                    {/* END-GAME CAMPAIGN RESOLUTION DISPLAY BAR */}
                    {gameState !== 'PLAYING' && (
                        <div className={`mt-2 p-4 rounded border text-center font-mono ${gameState === 'WON'
                            ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
                            : 'bg-rose-950/40 border-rose-800/60 text-rose-400'
                            }`}>
                            <p className="text-lg font-black tracking-widest uppercase mb-3">
                                {gameState === 'WON' ? '🏆 Campaign Victory' : '💀 Game Over'}
                            </p>
                            <button
                                type="button"
                                onClick={handleResetGame}
                                className="bg-zinc-50 hover:bg-zinc-200 text-zinc-950 font-bold px-6 py-2 rounded text-sm transition"
                            >
                                PLAY AGAIN
                            </button>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}

