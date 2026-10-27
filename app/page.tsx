'use client';

import { useState } from 'react';
import LandingScreen from '@/components/LandingScreen';
import GameScreen from '@/components/GameScreen';

// 1. Defining a strict, expandable type matrix layout list for all current and upcoming engine modes
export type GameMode = 'FREE' | 'CHOICE';

export default function Home() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [username, setUsername] = useState('');
    const [story, setStory] = useState('');
    const [playerInput, setPlayerInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [gamePreferences, setGamePreferences] = useState('A damp stone dungeon, medium difficulty');

    // Game lifecycle and turn pacing counters
    const [turnCount, setTurnCount] = useState(1);
    const [maxTurns, setMaxTurns] = useState('10');
    const [gameState, setGameState] = useState<'PLAYING' | 'WON' | 'LOST'>('PLAYING');

    // Dynamic telemetry metrics states
    const [inventory, setInventory] = useState<string[]>([]);
    const [currentZone, setCurrentZone] = useState('Starting Area');
    const [tacticalStatus, setTacticalStatus] = useState('Ready for adventure');

    // Refactored: Swapped binary true/false boolean out for a scalable type string selector
    const [gameMode, setGameMode] = useState<GameMode>('FREE');

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

        // Clean dynamic link router resolution block logic
        const targetApiRoute = gameMode === 'CHOICE' ? '/api/game/choice' : '/api/game/free';

        try {
            const response = await fetch(targetApiRoute, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: `STARTING NEW GAME. Player Preferences: ${gamePreferences}. Input limits mode state: ${gameMode}`,
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

                const parsedStory = parseMetadata(fullIncomingText);
                setStory(parsedStory.cleanStory);
            }

            processTelemetries(fullIncomingText, '');

        } catch (error) {
            console.error(error);
            setStory('[System Error: Failed to generate opening narrative.]');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChoiceSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (!playerInput.trim() || isLoading || gameState !== 'PLAYING') return;

        const cleanInput = playerInput.trim();

        // Type Enforcement Filter: If CHOICE engine mode matches true, reject any inputs outside numeric values
        if (gameMode === 'CHOICE' && !['1', '2', '3'].includes(cleanInput)) {
            setStory((prev) => prev + `\n\n> ${username}: ${cleanInput}\n[System Notice: Invalid selection. Choice mode active. Type exactly 1, 2, or 3.]`);
            setPlayerInput('');
            return;
        }

        setPlayerInput('');
        setIsLoading(true);

        const baseStoryHistory = story + `\n\n> ${username}: ${cleanInput}\n\n`;
        setStory(baseStoryHistory);

        const targetApiRoute = gameMode === 'CHOICE' ? '/api/game/choice' : '/api/game/free';

        try {
            const response = await fetch(targetApiRoute, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    currentStory: story,
                    prompt: gameMode === 'CHOICE' ? `Selected Option Number ${cleanInput}` : cleanInput,
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

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                const textChunk = decoder.decode(value);
                fullIncomingText += textChunk;

                const parsedStory = parseMetadata(fullIncomingText);
                setStory(baseStoryHistory + parsedStory.cleanStory);
            }

            setTurnCount((prev) => prev + 1);
            processTelemetries(fullIncomingText, maxTurns);

        } catch (error) {
            console.error(error);
            setStory((prev) => prev + '\n\n[System Error: Engine disconnected from AI grid.]');
        } finally {
            setIsLoading(false);
        }
    };

    const parseMetadata = (text: string) => {
        const cleanStory = text
            .replace(/<Zone>[\s\S]*?<\/Zone>/gi, '')
            .replace(/<Add>[\s\S]*?<\/Add>/gi, '')
            .replace(/<Remove>[\s\S]*?<\/Remove>/gi, '')
            .replace(/<Status>[\s\S]*?<\/Status>/gi, '')
            .trim();
        return { cleanStory };
    };

    const processTelemetries = (currentTurnRawText: string, currentMaxTurnsString: string) => {
        const zoneMatch = /<Zone>([\s\S]*?)<\/Zone>/i.exec(currentTurnRawText);
        if (zoneMatch && zoneMatch[1]) setCurrentZone(zoneMatch[1].trim()); // Fixed: Added [1]

        const statusMatch = /<Status>([\s\S]*?)<\/Status>/i.exec(currentTurnRawText);
        if (statusMatch && statusMatch[1]) setTacticalStatus(statusMatch[1].trim()); // Fixed: Added [1]

        const addMatches = [...currentTurnRawText.matchAll(/<Add>([\s\S]*?)<\/Add>/gi)];
        addMatches.forEach(match => {
            if (match[1]) { // Fixed: Added check and [1]
                const item = match[1].trim();
                setInventory(prev => prev.includes(item) ? prev : [...prev, item]);
            }
        });

        const removeMatches = [...currentTurnRawText.matchAll(/<Remove>([\s\S]*?)<\/Remove>/gi)];
        removeMatches.forEach(match => {
            if (match[1]) { // Fixed: Added check and [1]
                const item = match[1].trim();
                setInventory(prev => prev.filter(i => i !== item));
            }
        });

        const upperText = currentTurnRawText.toUpperCase();
        const targetMax = Number(currentMaxTurnsString) || 10;

        if (upperText.includes('GAME OVER') || upperText.includes('YOU LOSE') || upperText.includes('DIED') || upperText.includes('FAIL')) {
            setGameState('LOST');
        } else if (upperText.includes('VICTORY') || upperText.includes('YOU WIN') || upperText.includes('TRIUMPH')) {
            setGameState('WON');
        } else if (turnCount >= targetMax && targetMax > 1) {
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
                    // Passing down the clean string state framework variables props channel:
                    gameMode={gameMode}
                    setGameMode={setGameMode}
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

