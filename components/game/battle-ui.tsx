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

/** Top HUD: timer, crowns. Renders in its own layout zone (no overlay). */
export interface BattleTopHUDProps {
  timeRemaining: number;
  playerCrowns: number;
  botCrowns: number;
}

export function BattleTopHUD({
  timeRemaining,
  playerCrowns,
  botCrowns,
}: BattleTopHUDProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const formatTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <header
      className="flex shrink-0 items-center justify-between px-3 py-2 bg-[hsl(var(--charcoal))] border-b border-border min-h-[56px] max-h-[88px] pt-[max(0.5rem,env(safe-area-inset-top))]"
      style={{ minHeight: "clamp(56px, 10vh, 88px)" }}
    >
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
      <span className="text-sm font-bold text-foreground font-mono">
        {formatTime}
      </span>
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
    </header>
  );
}

/** Bottom HUD: elixir bar + 4 cards. Fixed height, max-width 520px centered, no stretch (CR-style). */
const BOTTOM_HUD_HEIGHT = "clamp(140px, 22vh, 200px)";
const BOTTOM_HUD_MAX_W_PX = 520;
const CARD_SIZE_PX = 72;
const CARD_GAP_PX = 8;

export interface BattleBottomHUDProps {
  hand: HandCard[];
  elixir: number;
  selectedIndex: number | null;
  onSelectCard: (index: number) => void;
}

export function BattleBottomHUD({
  hand,
  elixir,
  selectedIndex,
  onSelectCard,
}: BattleBottomHUDProps) {
  return (
    <footer
      className="flex shrink-0 flex-col bg-[hsl(var(--charcoal))] border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.3)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{
        height: BOTTOM_HUD_HEIGHT,
        maxWidth: BOTTOM_HUD_MAX_W_PX,
        width: "100%",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <div className="px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-primary w-5 text-right">
            {Math.floor(elixir)}
          </span>
          <div className="flex-1 min-w-0 h-3 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-200"
              style={{
                width: `${(elixir / MAX_ELIXIR) * 100}%`,
                background:
                  "linear-gradient(90deg, hsl(280, 70%, 50%), hsl(300, 80%, 60%))",
              }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground shrink-0">{MAX_ELIXIR}</span>
        </div>
      </div>
      <div
        className="flex items-center justify-center gap-2 px-3 pb-2 shrink-0"
        style={{ gap: CARD_GAP_PX }}
      >
        {hand.map((card, i) => {
          const canAfford = elixir >= card.cardDef.cost;
          const isSelected = selectedIndex === i;
          const Icon = ICON_MAP[card.cardDef.icon] || Sword;

          return (
            <button
              key={`hand-${card.cardDef.id}-${i}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelectCard(i);
              }}
              disabled={!canAfford}
              type="button"
              className={cn(
                "relative rounded-lg border-2 flex flex-col items-center justify-between p-1.5 transition-all shrink-0",
                isSelected
                  ? "border-primary bg-primary/15 -translate-y-2 shadow-[0_0_16px_hsl(43,74%,49%,0.3)]"
                  : canAfford
                    ? "border-border bg-[hsl(var(--charcoal-light))] hover:border-muted-foreground active:scale-95"
                    : "border-border/50 bg-[hsl(var(--charcoal-light))]/50 opacity-50"
              )}
              style={{
                width: CARD_SIZE_PX,
                minWidth: CARD_SIZE_PX,
                height: CARD_SIZE_PX + 20,
              }}
            >
              <div
                className={cn(
                  "absolute -top-2 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold",
                  canAfford
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {card.cardDef.cost}
              </div>
              <div className="flex-1 flex items-center justify-center min-h-0">
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={{ color: card.cardDef.color }}
                />
              </div>
              <span className="text-[8px] font-semibold text-foreground text-center leading-tight truncate w-full">
                {card.cardDef.name}
              </span>
            </button>
          );
        })}
      </div>
    </footer>
  );
}

export interface BattleUIProps {
  hand: HandCard[];
  elixir: number;
  timeRemaining: number;
  selectedIndex: number | null;
  playerCrowns: number;
  botCrowns: number;
  onSelectCard: (index: number) => void;
}

/** Legacy: single component (e.g. for overlay mode). Prefer Top + Bottom in layout. */
export function BattleUI({
  hand,
  elixir,
  timeRemaining,
  selectedIndex,
  playerCrowns,
  botCrowns,
  onSelectCard,
}: BattleUIProps) {
  return (
    <>
      <BattleTopHUD
        timeRemaining={timeRemaining}
        playerCrowns={playerCrowns}
        botCrowns={botCrowns}
      />
      <BattleBottomHUD
        hand={hand}
        elixir={elixir}
        selectedIndex={selectedIndex}
        onSelectCard={onSelectCard}
      />
    </>
  );
}
