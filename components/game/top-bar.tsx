"use client";

import { useState } from "react";
import { Trophy, Coins, Pencil } from "lucide-react";
import { useGameStore } from "@/lib/game/store";

export function TopBar() {
  const { playerName, trophies, gold, setPlayerName } = useGameStore();
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(playerName);

  return (
    <header className="sticky top-0 z-40 safe-top">
      <div className="flex items-center justify-between px-4 py-3 bg-charcoal-light/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2">
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (tempName.trim()) {
                  setPlayerName(tempName.trim());
                }
                setEditing(false);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-secondary text-foreground px-2 py-1 rounded text-sm w-32 outline-none focus:ring-1 focus:ring-primary"
                maxLength={16}
                autoFocus
                onBlur={() => {
                  if (tempName.trim()) setPlayerName(tempName.trim());
                  setEditing(false);
                }}
              />
            </form>
          ) : (
            <button
              onClick={() => {
                setTempName(playerName);
                setEditing(true);
              }}
              className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors min-h-[44px]"
              type="button"
            >
              <span className="text-sm font-semibold">{playerName}</span>
              <Pencil className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="text-sm font-bold text-primary">{trophies}</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Trofei
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-gold-light" />
            <span className="text-sm font-bold text-gold-light">{gold}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
