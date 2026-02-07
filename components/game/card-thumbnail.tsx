"use client";

import type { CardDef } from "@/lib/game/cards";
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
  const Icon = ICON_MAP[card.icon] || Sword;
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
        "relative rounded-lg border-2 flex flex-col items-center justify-between p-1.5 transition-all duration-200",
        "bg-charcoal-light hover:brightness-110",
        selected
          ? "border-primary shadow-[0_0_12px_hsl(43,74%,49%,0.3)]"
          : "border-border hover:border-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      {/* Cost badge */}
      <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary-foreground">
          {card.cost}
        </span>
      </div>

      {/* AI Level badge */}
      {aiLevel > 1 && (
        <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-secondary flex items-center justify-center border border-border">
          <span className="text-[9px] font-bold text-foreground">
            {aiLevel}
          </span>
        </div>
      )}

      {/* Card icon */}
      <div
        className="flex-1 flex items-center justify-center rounded"
        style={{ color: card.color }}
      >
        <Icon className={cn(size === "sm" ? "h-6 w-6" : "h-8 w-8")} />
      </div>

      {/* Card name */}
      <span
        className={cn(
          "font-semibold text-center leading-tight text-foreground",
          size === "sm" ? "text-[8px]" : "text-[10px]"
        )}
      >
        {card.italianName}
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
