'use client';

import { GameMode } from '@/app/page'; // Safely pull our structural type constraint contract definition

interface LandingScreenProps {
    username: string;
    setUsername: (value: string) => void;
    gamePreferences: string;
    setGamePreferences: (value: string) => void;
    maxTurns: string;
    setMaxTurns: (value: string) => void;
    isLoading: boolean;
    handleStartGame: () => void;

    // Refactored State Properties Types:
    gameMode: GameMode;
    setGameMode: (value: GameMode) => void;
}

export default function LandingScreen({
    username,
    setUsername,
    gamePreferences,
    setGamePreferences,
    maxTurns,
    setMaxTurns,
    isLoading,
    handleStartGame,
    gameMode,
    setGameMode,
}: LandingScreenProps) {
    return (
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
                min="1"
                max="50"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-zinc-50 font-mono mb-4"
            />

            {/* REFACTORED: String check matching logic makes adding future options a breeze */}
            <p className="text-zinc-400 mb-2 font-mono text-xs text-left">Gameplay Input Mode:</p>
            <div className="grid grid-cols-2 gap-2 mb-6 font-mono text-xs">
                <button
                    type="button"
                    onClick={() => setGameMode('FREE')}
                    className={`py-2 rounded border transition font-bold ${gameMode === 'FREE'
                            ? 'bg-amber-600/10 border-amber-500 text-amber-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-400'
                        }`}
                >
                    ✍️ Free Action Text
                </button>
                <button
                    type="button"
                    onClick={() => setGameMode('CHOICE')}
                    className={`py-2 rounded border transition font-bold ${gameMode === 'CHOICE'
                            ? 'bg-amber-600/10 border-amber-500 text-amber-400'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-400'
                        }`}
                >
                    🔢 Strict 1 / 2 / 3 Choices
                </button>
            </div>

            <button
                type="button"
                disabled={isLoading || !username.trim()}
                onClick={handleStartGame}
                className="w-full bg-amber-600 hover:bg-amber-500 text-zinc-950 font-bold px-4 py-2 rounded text-sm transition font-mono"
            >
                {isLoading ? "GENERATING REALM..." : "ENTER REALM"}
            </button>
        </div>
    );
}

