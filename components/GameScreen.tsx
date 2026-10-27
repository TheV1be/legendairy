'use client';

import { useRef, useEffect, useState } from 'react';

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
    inventory: string[];
    currentZone: string;
    tacticalStatus: string;
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
    inventory,
    currentZone,
    tacticalStatus,
}: GameScreenProps) {
    const storyEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Tracks only the exact rooms that the player has discovered during the game
    const [discoveredZones, setDiscoveredZones] = useState<string[]>([]);

    useEffect(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [story]);

    useEffect(() => {
        if (!isLoading && gameState === 'PLAYING') {
            inputRef.current?.focus();
        }
    }, [isLoading, gameState]);

    // Capture new zones dynamically as the AI generates them down the line
    useEffect(() => {
        const cleanZone = currentZone ? currentZone.trim() : 'Starting Area';
        setDiscoveredZones((prev) => {
            if (prev.includes(cleanZone)) return prev; // If it's already recorded, do nothing!
            return [...prev, cleanZone]; // Only append if it's completely unique
        });
    }, [currentZone]);

    return (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-4 gap-6 items-start">

            {/* COLUMN 1: TELEMETRY & DYNAMIC DISCOVERY MAP */}
            <div className="flex flex-col gap-4 md:col-span-1">

                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs shadow-xl">
                    <p className="text-zinc-500 uppercase tracking-wider mb-2 font-bold text-[10px]">📟 DUNGEON TELEMETRY</p>
                    <div className="bg-zinc-950 p-2.5 rounded border border-zinc-800/60 leading-relaxed text-zinc-300">
                        <span className="text-amber-500 font-bold">STATUS:</span> {tacticalStatus || 'Calculating...'}
                    </div>
                </div>

                {/* REFACTORED: Map grows dynamically based on actual discovery */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs shadow-xl">
                    <p className="text-zinc-500 uppercase tracking-wider mb-2 font-bold text-[10px]">🗺️ DISCOVERED ZONES</p>
                    <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                        {discoveredZones.map((zoneName) => {
                            const isActive = zoneName.toLowerCase() === (currentZone ? currentZone.trim().toLowerCase() : 'starting area');
                            return (
                                <div
                                    key={zoneName}
                                    className={`p-2 rounded text-xs transition border text-left flex justify-between items-center ${isActive
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-bold shadow-[0_0_12px_rgba(245,158,11,0.05)]'
                                        : 'bg-zinc-950/40 border-zinc-800/20 text-zinc-400'
                                        }`}
                                >
                                    <span>📍 {zoneName}</span>
                                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-2" />}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* COLUMN 2 & 3: MAIN LOG INTERFACE CARD CONTAINER */}
            <div className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-lg p-6 shadow-2xl flex flex-col">
                <div className="flex justify-between font-mono text-xs text-zinc-500 mb-2 uppercase tracking-widest">
                    <p>Hero: <span className="text-amber-400 font-bold">{username}</span></p>
                    <p>Move: <span className="text-amber-400 font-bold">{turnCount}</span> / {maxTurns}</p>
                </div>

                <div className="bg-zinc-950 p-4 rounded h-[50vh] overflow-y-auto border border-zinc-800 font-mono text-sm leading-relaxed mb-4 whitespace-pre-wrap">
                    {story}
                    <div ref={storyEndRef} />
                </div>

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
                            className="bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 text-zinc-950 disabled:text-zinc-500 font-bold px-6 py-2 rounded text-sm transition font-mono whitespace-nowrap"
                        >
                            {isLoading ? "..." : "Action"}
                        </button>
                    </form>
                )}

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

            {/* COLUMN 4: INVENTORY SLOTS BOX */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 font-mono text-xs shadow-xl md:col-span-1">
                <p className="text-zinc-500 uppercase tracking-wider mb-3 font-bold text-[10px]">🎒 EQUIPMENT INVENTORY</p>
                {inventory.length === 0 ? (
                    <div className="bg-zinc-950/40 border border-zinc-800/50 border-dashed rounded-lg p-6 text-center text-zinc-600 italic">
                        Your inventory slots are completely empty...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1">
                        {inventory.map((item, index) => (
                            <div
                                key={index}
                                className="bg-zinc-950 border border-zinc-800/80 rounded px-3 py-2 text-zinc-300 flex items-center gap-2 text-xs border-l-2 border-l-amber-600/70"
                            >
                                <span className="text-zinc-600 font-bold text-[10px]">{String(index + 1).padStart(2, '0')}</span>
                                <span className="truncate">{item}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

