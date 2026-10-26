'use client';

import { useState } from 'react';
import LandingScreen from '@/components/LandingScreen';
import GameScreen from '@/components/GameScreen';

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [username, setUsername] = useState('');
    const [story, setStory] = useState('');
    const [playerInput, setPlayerInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [gamePreferences, setGamePreferences] = useState('A damp stone dungeon, medium difficulty');

    const [turnCount, setTurnCount] = useState(1);
    const [maxTurns, setMaxTurns] = useState('10');
    const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

    // Handles generating the custom opening story paragraph
    const handleStartGame = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setIsPlaying(true);
        setStory('');
        setTurnCount(1);
        setGameState('PLAYING');

        try {
            const response = await fetch('/api/game', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: `STARTING NEW GAME. Player Preferences: ${gamePreferences}`,
                    prompt: 'Generate the opening scene paragraph introducing the setting.',
                    turnCount: 1,
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

            setTurnCount((prev) => prev + 1);

            const upperText = fullResponseText.toUpperCase();
            if (upperText.includes('GAME OVER') || upperText.includes('YOU LOSE') || upperText.includes('DIED')) {
                setGameState('LOST');
            } else if (upperText.includes('VICTORY') || upperText.includes('YOU WIN') || upperText.includes('TRIUMPH')) {
                setGameState('WON');
            }

        } catch (error) {
            console.error(error);
            setStory((prev) => prev + '\n\n[System Error: Engine disconnected from AI grid.]');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetGame = () => {
        setIsPlaying(false);
        setStory('');
        setPlayerInput('');
        setTurnCount(1);
        setGameState('PLAYING');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-6">
            <h1 className="text-2xl font-black text-amber-500 mb-6">LEGENDAIRY ENGINE</h1>

            {/* 1. THE MAIN PRESENTATION PAGE */}
            {!isPlaying && (
                <LandingScreen
                    username={username}
                    setUsername={setUsername}
                    gamePreferences={gamePreferences}
                    setGamePreferences={setGamePreferences}
                    maxTurns={maxTurns}
                    setMaxTurns={setMaxTurns}
                    isLoading={isLoading}
                    handleStartGame={handleStartGame}
                />
            )}

            {/* 2. THE GAMEPLAY TEXT SCREEN */}
            {isPlaying && (
                <GameScreen
                    username={username}
                    story={story}
                    playerInput={playerInput}
                    setPlayerInput={setPlayerInput}
                    isLoading={isLoading}
                    turnCount={turnCount}
                    maxTurns={maxTurns}
                    gameState={gameState}
                    handleChoiceSubmit={handleChoiceSubmit}
                    handleResetGame={handleResetGame}
                />
            )}
        </main>
    );
}

