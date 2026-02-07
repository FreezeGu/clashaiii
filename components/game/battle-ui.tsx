"use client";

import { useCallback } from "react";
import type { HandCard } from "@/lib/game/battle-engine";
import { MAX_ELIXIR } from "@/lib/game/store-config";
import { cn } from "@/lib/utils";
import { Sword, Zap, Shield, Target, Flame, Ghost } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  sword: Sword,
  blade: Zap,
  dots: Target,
  triangles: Zap,
  arrow: Target,
  crystal: Flame,
  shield: Shield,
  explosion: Flame,
  ghost: Ghost,
  boulder: Shield,
};

interface BattleUIProps {
  hand: HandCard[];
  elixir: number;
  timeRemaining: number;
  selectedIndex: number | null;
  playerCrowns: number;
  botCrowns: number;
  onSelectCard: (index: number) => void;
}

export function BattleUI({
  hand,
  elixir,
  timeRemaining,
  selectedIndex,
  playerCrowns,
  botCrowns,
  onSelectCard,
}: BattleUIProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);

  const formatTime = useCallback(() => {
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, [minutes, seconds]);

  return (
    <>
      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-charcoal/80 backdrop-blur-sm z-10">
        {/* Bot crowns */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={`bot-${i}`}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px]",
                i < botCrowns
                  ? "border-destructive bg-destructive/20 text-destructive"
                  : "border-border text-muted-foreground"
              )}
            >
              {i < botCrowns ? "\u2654" : ""}
            </div>
          ))}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground font-mono">
            {formatTime()}
          </span>
        </div>

        {/* Player crowns */}
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={`player-${i}`}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px]",
                i < playerCrowns
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted-foreground"
              )}
            >
              {i < playerCrowns ? "\u2654" : ""}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: Elixir + Hand */}
      <div className="absolute bottom-0 left-0 right-0 bg-charcoal/90 backdrop-blur-sm z-10 safe-bottom">
        {/* Elixir bar */}
        <div className="px-3 py-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-primary w-5 text-right">
              {Math.floor(elixir)}
            </span>
            <div className="flex-1 h-3 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{
                  width: `${(elixir / MAX_ELIXIR) * 100}%`,
                  background:
                    "linear-gradient(90deg, hsl(280, 70%, 50%), hsl(300, 80%, 60%))",
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">
              {MAX_ELIXIR}
            </span>
          </div>
        </div>

        {/* Card hand */}
        <div className="flex items-stretch justify-center gap-2 px-3 pb-3">
          {hand.map((card, i) => {
            const canAfford = elixir >= card.cardDef.cost;
            const isSelected = selectedIndex === i;
            const Icon = ICON_MAP[card.cardDef.icon] || Sword;

            return (
              <button
                key={`hand-${card.cardDef.id}-${i}`}
                onClick={() => onSelectCard(i)}
                disabled={!canAfford}
                type="button"
                className={cn(
                  "relative flex-1 max-w-[80px] rounded-lg border-2 flex flex-col items-center justify-between p-1.5 transition-all min-h-[80px]",
                  isSelected
                    ? "border-primary bg-primary/15 -translate-y-2 shadow-[0_0_16px_hsl(43,74%,49%,0.3)]"
                    : canAfford
                      ? "border-border bg-charcoal-light hover:border-muted-foreground active:scale-95"
                      : "border-border/50 bg-charcoal-light/50 opacity-50"
                )}
              >
                {/* Level - top left */}
                <div className="absolute -top-2 left-0 min-w-[22px] h-5 px-1 rounded flex items-center justify-center text-[9px] font-bold bg-foreground/90 text-background">
                  {card.aiLevel}
                </div>

                {/* Elixir - top right (purple) */}
                <div
                  className={cn(
                    "absolute -top-2 right-0 min-w-[22px] h-5 px-1 rounded flex items-center justify-center text-[9px] font-bold",
                    canAfford
                      ? "bg-purple-500/90 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {card.cardDef.cost}
                </div>

                {/* Icon */}
                <div className="flex-1 flex items-center justify-center">
                  <Icon
                    className="h-5 w-5"
                    style={{ color: card.cardDef.color }}
                  />
                </div>

                {/* Name */}
                <span className="text-[8px] font-semibold text-foreground text-center leading-tight">
                  {card.cardDef.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
