'use client';

import { useRef, useEffect } from 'react';

interface GameScreenProps {
    username: string;
    story: string;
    playerInput: string;
    setPlayerInput: (value: string) => void;
    isLoading: boolean;
    turnCount: number;
    maxTurns: string;
    gameState: 'PLAYING' | 'WON' | 'LOST';
    handleChoiceSubmit: (e: React.SyntheticEvent) => void;
    handleResetGame: () => void;
}

export default function GameScreen({
    username,
    story,
    playerInput,
    setPlayerInput,
    isLoading,
    turnCount,
    maxTurns,
    gameState,
    handleChoiceSubmit,
    handleResetGame,
}: GameScreenProps) {
    const storyEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Automatically scroll down whenever the story text updates
    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    // Keep focus inside the input bar whenever the AI finishes typing
    useEffect(() => {
        if (!isLoading && gameState === 'PLAYING') {
            inputRef.current?.focus();
        }
    }, [isLoading, gameState]);

    return (
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
    );
}

