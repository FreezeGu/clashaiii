"use client";

import Link from "next/link";
import { Trophy, Coins, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/game/battle-engine";
import { TROPHY_WIN, TROPHY_LOSS, TROPHY_TIE } from "@/lib/game/store-config";

interface BattleEndProps {
  winner: Team | "tie";
  playerCrowns: number;
  botCrowns: number;
}

export function BattleEnd({
  winner,
  playerCrowns,
  botCrowns,
}: BattleEndProps) {
  const isWin = winner === "player";
  const isTie = winner === "tie";

  const trophyChange = isWin ? TROPHY_WIN : isTie ? TROPHY_TIE : TROPHY_LOSS;
  const goldReward = isWin ? 50 : isTie ? 15 : 5;

  const title = isWin ? "Vittoria!" : isTie ? "Pareggio" : "Sconfitta";
  const subtitle = isWin
    ? "Your towers stand tall"
    : isTie
      ? "A hard-fought draw"
      : "Your towers have fallen";

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-charcoal/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-sm mx-4 bg-charcoal-light border border-border rounded-2xl p-6 flex flex-col items-center gap-4 shadow-2xl">
        {/* Title */}
        <h2
          className={cn(
            "text-3xl font-bold tracking-tight",
            isWin
              ? "text-primary"
              : isTie
                ? "text-foreground"
                : "text-destructive"
          )}
        >
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>

        {/* Crowns */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              You
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Crown
                  key={`pc-${i}`}
                  className={cn(
                    "h-6 w-6",
                    i < playerCrowns ? "text-primary" : "text-muted"
                  )}
                />
              ))}
            </div>
          </div>
          <span className="text-2xl font-bold text-muted-foreground">vs</span>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Bot
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <Crown
                  key={`bc-${i}`}
                  className={cn(
                    "h-6 w-6",
                    i < botCrowns ? "text-destructive" : "text-muted"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Rewards */}
        <div className="w-full grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
            <Trophy
              className={cn(
                "h-5 w-5",
                trophyChange >= 0 ? "text-primary" : "text-destructive"
              )}
            />
            <div>
              <div
                className={cn(
                  "text-sm font-bold",
                  trophyChange >= 0 ? "text-primary" : "text-destructive"
                )}
              >
                {trophyChange > 0 ? `+${trophyChange}` : trophyChange}
              </div>
              <div className="text-[10px] text-muted-foreground">Trofei</div>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-3">
            <Coins className="h-5 w-5 text-gold-light" />
            <div>
              <div className="text-sm font-bold text-gold-light">
                +{goldReward}
              </div>
              <div className="text-[10px] text-muted-foreground">Oro</div>
            </div>
          </div>
        </div>

        {/* Back button */}
        <Link
          href="/"
          className="w-full min-h-[48px] rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center hover:brightness-110 transition-colors active:scale-[0.98] mt-2"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
