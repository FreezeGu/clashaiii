"use client";

import Link from "next/link";
import { TopBar } from "@/components/game/top-bar";
import { BottomNav } from "@/components/game/bottom-nav";
import { useGameStore } from "@/lib/game/store";
import { Swords, Trophy, Coins, Target } from "lucide-react";

export default function HomePage() {
  const { trophies, gold } = useGameStore();

  // Trophy tier name
  const tierName =
    trophies < 100
      ? "Bronze"
      : trophies < 300
        ? "Silver"
        : trophies < 600
          ? "Gold"
          : trophies < 1000
            ? "Platinum"
            : "Diamond";

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <TopBar />

      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-24">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground text-balance">
            Torre di Battaglia
          </h1>
          <p className="text-sm text-muted-foreground mt-1 tracking-wide">
            Tower Battle Card Game
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-10">
          <div className="flex items-center gap-3 bg-charcoal-light rounded-lg p-3 border border-border">
            <Trophy className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {trophies}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Trofei
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-charcoal-light rounded-lg p-3 border border-border">
            <Coins className="h-5 w-5 text-gold-light shrink-0" />
            <div>
              <div className="text-lg font-bold text-foreground">{gold}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Oro
              </div>
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-3 bg-charcoal-light rounded-lg p-3 border border-border">
            <Target className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="text-sm font-bold text-foreground">
                Arena: {tierName}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Livello Arena
              </div>
            </div>
          </div>
        </div>

        {/* Battle button */}
        <Link
          href="/battle"
          className="group relative flex items-center justify-center gap-3 w-full max-w-xs min-h-[56px] rounded-xl bg-primary text-primary-foreground font-bold text-lg tracking-wide uppercase shadow-lg hover:brightness-110 transition-all active:scale-[0.98]"
        >
          <Swords className="h-6 w-6 transition-transform group-hover:rotate-12" />
          <span>Battaglia</span>
          <div className="absolute inset-0 rounded-xl border border-gold-light/20" />
        </Link>

        <p className="text-[11px] text-muted-foreground mt-3 tracking-wide">
          Tap to enter the arena
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
