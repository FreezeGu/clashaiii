"use client";

import { useState } from "react";
import { TopBar } from "@/components/game/top-bar";
import { BottomNav } from "@/components/game/bottom-nav";
import { CardThumbnail } from "@/components/game/card-thumbnail";
import { useGameStore } from "@/lib/game/store";
import { COLLECTION_CARDS, getUpgradeCost } from "@/lib/game/cards";
import type { CardDef } from "@/lib/game/cards";
import { ArrowRightLeft, Zap, X, Coins } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DeckPage() {
  const {
    deckIds,
    ownedCardIds,
    cardAiLevels,
    gold,
    swapDeckCard,
    upgradeCardAI,
  } = useGameStore();
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);
  const [swapMode, setSwapMode] = useState(false);

  const deckCards = deckIds
    .map((id) => COLLECTION_CARDS.find((c) => c.id === id))
    .filter(Boolean) as CardDef[];

  const ownedCards = COLLECTION_CARDS.filter((c) =>
    ownedCardIds.includes(c.id)
  );

  const handleSwap = (deckIndex: number) => {
    if (!selectedCard) return;
    // Don't swap if card is already in deck at another position
    if (
      deckIds.includes(selectedCard.id) &&
      deckIds[deckIndex] !== selectedCard.id
    ) {
      // Swap positions
      const existingIndex = deckIds.indexOf(selectedCard.id);
      const removedCard = deckIds[deckIndex];
      swapDeckCard(deckIndex, selectedCard.id);
      swapDeckCard(existingIndex, removedCard);
    } else if (!deckIds.includes(selectedCard.id)) {
      swapDeckCard(deckIndex, selectedCard.id);
    }
    setSelectedCard(null);
    setSwapMode(false);
  };

  const handleUpgrade = () => {
    if (!selectedCard) return;
    upgradeCardAI(selectedCard.id);
  };

  const currentAiLevel = selectedCard
    ? cardAiLevels[selectedCard.id] || 1
    : 1;
  const upgradeCost = selectedCard ? getUpgradeCost(currentAiLevel) : 0;

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <TopBar />

      <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
        {/* Page title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Mazzo</h1>
          <p className="text-xs text-muted-foreground">
            Your battle deck - 6 cards
          </p>
        </div>

        {/* Deck slots */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {deckCards.map((card, i) => (
            <div key={`${card.id}-${i}`} className="relative">
              <CardThumbnail
                card={card}
                aiLevel={cardAiLevels[card.id] || 1}
                size="sm"
                selected={swapMode && selectedCard !== null}
                onClick={() => {
                  if (swapMode && selectedCard) {
                    handleSwap(i);
                  }
                }}
              />
              {swapMode && selectedCard && (
                <div className="absolute inset-0 bg-primary/10 rounded-lg border-2 border-dashed border-primary flex items-center justify-center">
                  <ArrowRightLeft className="h-4 w-4 text-primary" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Collection */}
        <div className="mb-4">
          <h2 className="text-sm font-semibold text-foreground mb-1">
            Collezione
          </h2>
          <p className="text-[10px] text-muted-foreground mb-3">
            Tap a card to manage it
          </p>
          <div className="grid grid-cols-4 gap-2">
            {ownedCards.map((card) => (
              <CardThumbnail
                key={card.id}
                card={card}
                aiLevel={cardAiLevels[card.id] || 1}
                size="sm"
                selected={selectedCard?.id === card.id}
                onClick={() => {
                  setSelectedCard(
                    selectedCard?.id === card.id ? null : card
                  );
                  setSwapMode(false);
                }}
              />
            ))}
          </div>
        </div>
      </main>

      {/* Card detail modal */}
      {selectedCard && !swapMode && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-charcoal/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-charcoal-light border-t border-border rounded-t-2xl p-5 safe-bottom animate-in slide-in-from-bottom duration-200">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">
                  {selectedCard.name}
                </h3>
                <p className="text-xs text-muted-foreground italic">
                  {selectedCard.italianName}
                </p>
              </div>
              <button
                onClick={() => setSelectedCard(null)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground"
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {selectedCard.description}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-secondary rounded-lg p-2">
                <div className="text-xs text-muted-foreground">Cost</div>
                <div className="text-sm font-bold text-primary">
                  {selectedCard.cost}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <div className="text-xs text-muted-foreground">HP</div>
                <div className="text-sm font-bold text-foreground">
                  {selectedCard.hp}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <div className="text-xs text-muted-foreground">DMG</div>
                <div className="text-sm font-bold text-foreground">
                  {selectedCard.damage}
                </div>
              </div>
              <div className="bg-secondary rounded-lg p-2">
                <div className="text-xs text-muted-foreground">AI Lv</div>
                <div className="text-sm font-bold text-primary">
                  {currentAiLevel}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setSwapMode(true)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 min-h-[48px] rounded-lg font-semibold text-sm transition-colors",
                  "bg-secondary text-foreground hover:bg-secondary/80"
                )}
                type="button"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Swap into Deck
              </button>
              <button
                onClick={handleUpgrade}
                disabled={currentAiLevel >= 10 || gold < upgradeCost}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 min-h-[48px] rounded-lg font-semibold text-sm transition-colors",
                  currentAiLevel >= 10 || gold < upgradeCost
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:brightness-110"
                )}
                type="button"
              >
                <Zap className="h-4 w-4" />
                <span>Upgrade AI</span>
                <span className="flex items-center gap-0.5 text-[11px]">
                  <Coins className="h-3 w-3" />
                  {upgradeCost}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Swap mode overlay */}
      {swapMode && (
        <div className="fixed bottom-16 left-0 right-0 z-40 flex items-center justify-center p-3">
          <div className="bg-charcoal-light border border-primary rounded-xl px-4 py-3 flex items-center gap-3 shadow-lg">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            <span className="text-sm text-foreground">
              Tap a deck slot to swap
            </span>
            <button
              onClick={() => {
                setSwapMode(false);
                setSelectedCard(null);
              }}
              className="text-xs text-muted-foreground underline min-h-[44px] flex items-center"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
