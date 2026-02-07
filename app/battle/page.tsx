"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { BattleCanvas } from "@/components/game/battle-canvas";
import { BattleTopHUD, BattleBottomHUD } from "@/components/game/battle-ui";
import { BattleEnd } from "@/components/game/battle-end";
import { useGameStore } from "@/lib/game/store";
import { COLLECTION_CARDS, ALL_CARDS } from "@/lib/game/cards";
import {
  initBattle,
  updateBattle,
  playCardFromHand,
  type BattleState,
} from "@/lib/game/battle-engine";
import { TROPHY_WIN, TROPHY_LOSS } from "@/lib/game/store-config";
import {
  CANVAS_LOGICAL_W,
  CANVAS_LOGICAL_H,
  ARENA_MIN_H_PX,
} from "@/lib/game/battle-layout";

export default function BattlePage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  if (params) React.use(params);
  const resolvedSearchParams = searchParams ? React.use(searchParams) : undefined;
  const showDebugOverlay =
    resolvedSearchParams?.debug === "1" || resolvedSearchParams?.debug === "true";

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
      // Deploy territory (base + pocket) and placeable check done inside playCardFromHand
      const success = playCardFromHand(
        state,
        state.selectedHandIndex,
        { x: gridX, y: gridY },
        "player"
      );
      if (success) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate(30);
        }
      }
      state.selectedHandIndex = null;
    }
  }, []);

  return (
    <div className="flex flex-col w-full h-dvh bg-[hsl(var(--charcoal))] overflow-hidden">
      {/* 1. Top HUD — fixed zone, never overlaps arena */}
      <BattleTopHUD
        timeRemaining={uiState.timeRemaining}
        playerCrowns={uiState.playerCrowns}
        botCrowns={uiState.botCrowns}
      />

      {/* 2. Arena — only zone with canvas; flex-1, min height, centered. Canvas never under Bottom HUD. */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden px-2 py-2"
        style={{ minHeight: ARENA_MIN_H_PX }}
      >
        <div
          className="max-h-full max-w-full rounded-xl border-2 border-border shadow-lg overflow-hidden bg-[hsl(var(--charcoal-light))]"
          style={{ aspectRatio: `${CANVAS_LOGICAL_W}/${CANVAS_LOGICAL_H}` }}
        >
          <BattleCanvas
              stateRef={stateRef}
              onCanvasTap={handleCanvasTap}
              canvasWidth={CANVAS_LOGICAL_W}
              canvasHeight={CANVAS_LOGICAL_H}
              selectedHandIndex={uiState.selectedIndex}
              showDebugOverlay={showDebugOverlay}
            />
        </div>
      </div>

      {/* 3. Bottom HUD — card bar + elixir; never overlaps canvas */}
      <BattleBottomHUD
        hand={uiState.hand}
        elixir={uiState.elixir}
        selectedIndex={uiState.selectedIndex}
        onSelectCard={handleSelectCard}
      />

      {/* End screen overlay (above everything) */}
      {uiState.gameOver && uiState.winner && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60">
          <BattleEnd
            winner={uiState.winner}
            playerCrowns={uiState.playerCrowns}
            botCrowns={uiState.botCrowns}
          />
        </div>
      )}
    </div>
  );
}
