'use client';

import { useState } from 'react';

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [username, setUsername] = useState('');
    const [story, setStory] = useState('You wake up in a damp, silent stone dungeon...');
    const [playerInput, setPlayerInput] = useState('');

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
                    <p className="font-mono text-sm leading-relaxed mb-4">
                        Hello, <span className="text-amber-400 font-bold">{username}</span>.
                    </p>
                    <p className="font-mono text-sm leading-relaxed text-zinc-300">{story}</p>
                </div>
            )}
        </main>
    );
}

