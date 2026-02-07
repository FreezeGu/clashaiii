"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { BattleCanvas } from "@/components/game/battle-canvas";
import { BattleUI } from "@/components/game/battle-ui";
import { BattleEnd } from "@/components/game/battle-end";
import { useGameStore } from "@/lib/game/store";
import { COLLECTION_CARDS, ALL_CARDS } from "@/lib/game/cards";
import {
  initBattle,
  updateBattle,
  playCardFromHand,
  RIVER_ROW_END,
  type BattleState,
} from "@/lib/game/battle-engine";
import { TROPHY_WIN, TROPHY_LOSS } from "@/lib/game/store-config";

// Canvas size (logical pixels, will be scaled by CSS)
const CANVAS_W = 360;
const CANVAS_H = 640;

export default function BattlePage() {
  const { deckIds, cardAiLevels, trophies, addTrophies, addGold } =
    useGameStore();
  const stateRef = useRef<BattleState | null>(null);
  const [uiState, setUIState] = useState({
    elixir: 5,
    timeRemaining: 180,
    playerCrowns: 0,
    botCrowns: 0,
    gameOver: false,
    winner: null as "player" | "bot" | "tie" | null,
    hand: [] as { cardDef: (typeof COLLECTION_CARDS)[0]; aiLevel: number }[],
    selectedIndex: null as number | null,
  });
  const gameLoopRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const rewardsAppliedRef = useRef(false);

  // Initialize battle
  useEffect(() => {
    const playerCards = deckIds.map((id) => {
      const cardDef = COLLECTION_CARDS.find((c) => c.id === id)!;
      return { cardDef, aiLevel: cardAiLevels[id] || 1 };
    });

    // Bot uses default cards with AI levels based on trophies
    const botAiLevel = Math.min(10, 1 + Math.floor(trophies / 100));
    const botCards = ALL_CARDS.slice(0, 6).map((cardDef) => ({
      cardDef,
      aiLevel: botAiLevel,
    }));

    const state = initBattle(playerCards, botCards, trophies);
    state.lastElixirRegenPlayer = Date.now();
    state.lastElixirRegenBot = Date.now();
    stateRef.current = state;

    // Set initial UI
    setUIState((prev) => ({
      ...prev,
      hand: [...state.playerHand],
      elixir: state.playerElixir,
    }));

    lastTickRef.current = performance.now();
    rewardsAppliedRef.current = false;

    // Game loop
    function tick() {
      const now = performance.now();
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.05);
      lastTickRef.current = now;

      const state = stateRef.current;
      if (!state) {
        gameLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      updateBattle(state, dt);

      // Update UI state at throttled rate (~10 fps for React)
      setUIState({
        elixir: state.playerElixir,
        timeRemaining: state.timeRemaining,
        playerCrowns: state.playerCrowns,
        botCrowns: state.botCrowns,
        gameOver: state.gameOver,
        winner: state.winner,
        hand: [...state.playerHand],
        selectedIndex: state.selectedHandIndex,
      });

      if (!state.gameOver) {
        gameLoopRef.current = requestAnimationFrame(tick);
      }
    }

    gameLoopRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(gameLoopRef.current);
    };
  }, [deckIds, cardAiLevels, trophies]);

  // Apply rewards when game ends
  useEffect(() => {
    if (uiState.gameOver && uiState.winner && !rewardsAppliedRef.current) {
      rewardsAppliedRef.current = true;
      if (uiState.winner === "player") {
        addTrophies(TROPHY_WIN);
        addGold(50);
      } else if (uiState.winner === "bot") {
        addTrophies(TROPHY_LOSS);
        addGold(5);
      } else {
        addGold(15);
      }
    }
  }, [uiState.gameOver, uiState.winner, addTrophies, addGold]);

  const handleSelectCard = useCallback((index: number) => {
    const state = stateRef.current;
    if (!state) return;

    if (state.selectedHandIndex === index) {
      state.selectedHandIndex = null;
    } else {
      state.selectedHandIndex = index;
    }
  }, []);

  const handleCanvasTap = useCallback((gridX: number, gridY: number) => {
    const state = stateRef.current;
    if (!state || state.gameOver) return;

    if (state.selectedHandIndex !== null) {
      // Validate player half (below river)
      if (gridY > RIVER_ROW_END) {
        const success = playCardFromHand(
          state,
          state.selectedHandIndex,
          { x: gridX, y: gridY },
          "player"
        );
        if (success) {
          // Haptic feedback
          if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(30);
          }
        }
      }
      state.selectedHandIndex = null;
    }
  }, []);

  return (
    <div className="relative w-full h-dvh bg-charcoal overflow-hidden flex items-center justify-center">
      {/* Canvas container */}
      <div
        className="relative"
        style={{
          width: "100%",
          maxWidth: `${CANVAS_W}px`,
          aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
          maxHeight: "100dvh",
        }}
      >
        <BattleCanvas
          stateRef={stateRef}
          onCanvasTap={handleCanvasTap}
          canvasWidth={CANVAS_W}
          canvasHeight={CANVAS_H}
        />

        {/* UI overlay */}
        <BattleUI
          hand={uiState.hand}
          elixir={uiState.elixir}
          timeRemaining={uiState.timeRemaining}
          selectedIndex={uiState.selectedIndex}
          playerCrowns={uiState.playerCrowns}
          botCrowns={uiState.botCrowns}
          onSelectCard={handleSelectCard}
        />

        {/* End screen */}
        {uiState.gameOver && uiState.winner && (
          <BattleEnd
            winner={uiState.winner}
            playerCrowns={uiState.playerCrowns}
            botCrowns={uiState.botCrowns}
          />
        )}
      </div>
    </div>
  );
}
