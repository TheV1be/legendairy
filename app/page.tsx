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

    // Core game length and campaign engine state markers
    const [turnCount, setTurnCount] = useState(1);
    const [maxTurns, setMaxTurns] = useState('10');
    const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

    // Dynamic game-world telemetry engines
    const [inventory, setInventory] = useState<string[]>([]);
    const [currentZone, setCurrentZone] = useState('Starting Area');
    const [tacticalStatus, setTacticalStatus] = useState('Ready for adventure');

    // Handles generating the custom opening story paragraph
    const handleStartGame = async () => {
        if (isLoading) return;
        setIsLoading(true);
        setIsPlaying(true);
        setStory('');
        setTurnCount(1);
        setGameState('PLAYING');
        setInventory([]);
        setCurrentZone('Starting Area');
        setTacticalStatus('Ready for adventure');

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
                    maxTurns: Number(maxTurns) || 10,
                    currentInventory: [],
                    currentZone: 'Starting Area'
                }),
            });

            if (!response.body) throw new Error('Readable stream missing from engine channel');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullIncomingText = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value);
                fullIncomingText += textChunk;

                // Dynamic Filter: Separate narrative text from control block telemetry tags
                const parsedStory = parseMetadata(fullIncomingText);
                setStory(parsedStory.cleanStory);
            }

            // Post-stream evaluation processing
            processTelemetries(fullIncomingText);

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
                    maxTurns: Number(maxTurns) || 10,
                    currentInventory: inventory,
                    currentZone
                }),
            });

            if (!response.body) throw new Error('Readable stream missing from engine channel');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullIncomingText = '';
            const baseStoryHistory = story + `\n\n> ${username}: ${userAction}\n\n`;

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value);
                fullIncomingText += textChunk;

                const parsedStory = parseMetadata(fullIncomingText);
                setStory(baseStoryHistory + parsedStory.cleanStory);
            }

            setTurnCount((prev) => prev + 1);

            // Parse game-world properties and end states dynamically
            processTelemetries(fullIncomingText);

        } catch (error) {
            console.error(error);
            setStory((prev) => prev + '\n\n[System Error: Engine disconnected from AI grid.]');
        } finally {
            setIsLoading(false);
        }
    };

    // Helper: Strips tracking metadata brackets out of visual context logs dynamically
    const parseMetadata = (text: string) => {
        const cleanStory = text
            .replace(/<Zone>[\s\S]*?<\/Zone>/gi, '')
            .replace(/<Add>[\s\S]*?<\/Add>/gi, '')
            .replace(/<Remove>[\s\S]*?<\/Remove>/gi, '')
            .replace(/<Status>[\s\S]*?<\/Status>/gi, '')
            .trim();
        return { cleanStory };
    };

    // Helper: Reads tag metadata updates to mutate local state registers safely
    const processTelemetries = (text: string) => {
        const zoneMatch = /<Zone>([\s\S]*?)<\/Zone>/i.exec(text);
        if (zoneMatch && zoneMatch[1]) setCurrentZone(zoneMatch[1].trim());

        const statusMatch = /<Status>([\s\S]*?)<\/Status>/i.exec(text);
        if (statusMatch && statusMatch[1]) setTacticalStatus(statusMatch[1].trim());

        // Process array element drops and loops
        const addMatches = [...text.matchAll(/<Add>([\s\S]*?)<\/Add>/gi)];
        addMatches.forEach(match => {
            const item = match[1].trim();
            setInventory(prev => prev.includes(item) ? prev : [...prev, item]);
        });

        const removeMatches = [...text.matchAll(/<Remove>([\s\S]*?)<\/Remove>/gi)];
        removeMatches.forEach(match => {
            const item = match[1].trim();
            setInventory(prev => prev.filter(i => i !== item));
        });

        // Check strict narrative resolution conditions
        const upperText = text.toUpperCase();
        if (upperText.includes('GAME OVER')) {
            setGameState('LOST');
        } else if (upperText.includes('VICTORY')) {
            setGameState('WON');
        } else if (turnCount >= Number(maxTurns)) {
            setGameState('WON');
        }
    };

    const handleResetGame = () => {
        setIsPlaying(false);
        setStory('');
        setPlayerInput('');
        setTurnCount(1);
        setGameState('PLAYING');
        setInventory([]);
        setCurrentZone('Starting Area');
        setTacticalStatus('Ready for adventure');
    };

    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-zinc-50 p-6">
            <h1 className="text-2xl font-black text-amber-500 mb-6">LEGENDAIRY ENGINE</h1>

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
                    inventory={inventory}
                    currentZone={currentZone}
                    tacticalStatus={tacticalStatus}
                />
            )}
        </main>
    );
}

