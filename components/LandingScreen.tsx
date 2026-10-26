'use client';

interface LandingScreenProps {
    username: string;
    setUsername: (value: string) => void;
    gamePreferences: string;
    setGamePreferences: (value: string) => void;
    maxTurns: string;
    setMaxTurns: (value: string) => void;
    isLoading: boolean;
    handleStartGame: () => void;
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
    );
}

