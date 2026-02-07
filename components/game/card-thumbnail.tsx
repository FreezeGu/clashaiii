"use client";

import { useState, useEffect } from "react";
import type { CardDef } from "@/lib/game/cards";
import { cn } from "@/lib/utils";
import { Sword, Zap, Shield, Target, Flame, Ghost } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const LANCEGUARD_IDLE_FRAMES = 7;
const LANCEGUARD_IDLE_FPS = 8;
const FROST_MAGE_IDLE_FRAMES = 8;
const FROST_MAGE_IDLE_FPS = 8;

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

interface CardThumbnailProps {
  card: CardDef;
  aiLevel?: number;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CardThumbnail({
  card,
  aiLevel = 1,
  size = "md",
  selected = false,
  onClick,
  className,
}: CardThumbnailProps) {
  const [idleFrame, setIdleFrame] = useState(0);
  const Icon = ICON_MAP[card.icon] || Sword;
  const isLanceguard = card.id === "lancia";
  const isFrostMage = card.id === "maga";

  useEffect(() => {
    if (isLanceguard) {
      const interval = 1000 / LANCEGUARD_IDLE_FPS;
      const id = setInterval(() => {
        setIdleFrame((f) => (f + 1) % LANCEGUARD_IDLE_FRAMES);
      }, interval);
      return () => clearInterval(id);
    }
    if (isFrostMage) {
      const interval = 1000 / FROST_MAGE_IDLE_FPS;
      const id = setInterval(() => {
        setIdleFrame((f) => (f + 1) % FROST_MAGE_IDLE_FRAMES);
      }, interval);
      return () => clearInterval(id);
    }
  }, [isLanceguard, isFrostMage]);

  const sizeClasses = {
    sm: "w-16 h-20",
    md: "w-20 h-28",
    lg: "w-24 h-32",
  };

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "relative rounded-lg border-2 flex flex-col items-center justify-between p-1.5 transition-all duration-200 ease-out",
        "bg-charcoal-light hover:brightness-110",
        "hover:scale-105 focus:scale-105",
        selected
          ? "border-primary shadow-[0_0_12px_hsl(43,74%,49%,0.3)]"
          : "border-border hover:border-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      {/* Level badge - left, yellow */}
      <div className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
        <span className="text-[8px] font-bold text-primary-foreground leading-none">
          {aiLevel}
        </span>
      </div>

      {/* Elixir cost badge - right, purple */}
      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
        <span className="text-[8px] font-bold text-white leading-none">
          {card.cost}
        </span>
      </div>

      {/* Card icon / unit idle animation (Lanceguard, Frost Mage) */}
      <div className="flex-1 flex items-center justify-center rounded min-h-0 overflow-hidden">
        {isLanceguard ? (
          <img
            src={`/units/lanceguard/idle/${idleFrame + 1}.png`}
            alt="Lanceguard"
            className={cn("object-contain", size === "sm" ? "h-10 w-10" : "h-12 w-12")}
          />
        ) : isFrostMage ? (
          <img
            src={`/units/frostmage/idle/${idleFrame + 1}.png`}
            alt="Frost Mage"
            className={cn("object-contain", size === "sm" ? "h-10 w-10" : "h-12 w-12")}
          />
        ) : (
          <Icon
            className={cn(size === "sm" ? "h-6 w-6" : "h-8 w-8")}
            style={{ color: card.color }}
          />
        )}
      </div>

      {/* Card name */}
      <span
        className={cn(
          "font-semibold text-center leading-tight text-foreground",
          size === "sm" ? "text-[8px]" : "text-[10px]"
        )}
      >
        {card.name}
      </span>

      {/* Stats row */}
      <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
        <span>{card.hp} HP</span>
        <span className="text-primary">|</span>
        <span>{card.damage} DMG</span>
      </div>
    </button>
  );
}
