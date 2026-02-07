"use client";

import React from "react"

import { useRef, useEffect, useCallback } from "react";
import type { BattleState } from "@/lib/game/battle-engine";
import {
  GRID_W,
  GRID_H,
  RIVER_ROW_START,
  RIVER_ROW_END,
  BRIDGE_LEFT_COL_START,
  BRIDGE_LEFT_COL_END,
  BRIDGE_RIGHT_COL_START,
  BRIDGE_RIGHT_COL_END,
} from "@/lib/game/battle-engine";

interface BattleCanvasProps {
  stateRef: React.MutableRefObject<BattleState | null>;
  onCanvasTap: (gridX: number, gridY: number) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export function BattleCanvas({
  stateRef,
  onCanvasTap,
  canvasWidth,
  canvasHeight,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  const cellW = canvasWidth / GRID_W;
  const cellH = canvasHeight / GRID_H;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const x = ((clientX - rect.left) / rect.width) * canvasWidth;
      const y = ((clientY - rect.top) / rect.height) * canvasHeight;

      const gridX = x / cellW;
      const gridY = y / cellH;

      onCanvasTap(gridX, gridY);
    },
    [canvasWidth, canvasHeight, cellW, cellH, onCanvasTap]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    function render() {
      if (!ctx) return;
      const state = stateRef.current;
      if (!state) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Clear
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw arena background
      drawArena(ctx, state);

      // Draw towers
      drawTowers(ctx, state);

      // Draw units
      drawUnits(ctx, state);

      // Draw projectiles
      drawProjectiles(ctx, state);

      animFrameRef.current = requestAnimationFrame(render);
    }

    function drawArena(ctx: CanvasRenderingContext2D, state: BattleState) {
      // Background
      ctx.fillStyle = "#1a3a2a";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Player half (slightly lighter green)
      ctx.fillStyle = "#1e4432";
      ctx.fillRect(
        0,
        (RIVER_ROW_END + 1) * cellH,
        canvasWidth,
        (GRID_H - RIVER_ROW_END - 1) * cellH
      );

      // Bot half
      ctx.fillStyle = "#1a3a2a";
      ctx.fillRect(0, 0, canvasWidth, RIVER_ROW_START * cellH);

      // River
      ctx.fillStyle = "#1a5f8a";
      ctx.fillRect(
        0,
        RIVER_ROW_START * cellH,
        canvasWidth,
        (RIVER_ROW_END - RIVER_ROW_START + 1) * cellH
      );

      // River wave lines
      ctx.strokeStyle = "#2080b0";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const y =
          (RIVER_ROW_START + 0.3 + i * 0.5) * cellH;
        ctx.beginPath();
        for (let x = 0; x < canvasWidth; x += 4) {
          ctx.lineTo(
            x,
            y + Math.sin(x * 0.05 + Date.now() * 0.003 + i) * 2
          );
        }
        ctx.stroke();
      }

      // Bridges
      drawBridge(ctx, BRIDGE_LEFT_COL_START, BRIDGE_LEFT_COL_END);
      drawBridge(ctx, BRIDGE_RIGHT_COL_START, BRIDGE_RIGHT_COL_END);

      // Grid lines (subtle)
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= GRID_W; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, canvasHeight);
        ctx.stroke();
      }
      for (let y = 0; y <= GRID_H; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(canvasWidth, y * cellH);
        ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = "rgba(255,215,0,0.15)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, ((RIVER_ROW_START + RIVER_ROW_END) / 2 + 0.5) * cellH);
      ctx.lineTo(
        canvasWidth,
        ((RIVER_ROW_START + RIVER_ROW_END) / 2 + 0.5) * cellH
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }

    function drawBridge(
      ctx: CanvasRenderingContext2D,
      colStart: number,
      colEnd: number
    ) {
      ctx.fillStyle = "#5c4a32";
      ctx.fillRect(
        colStart * cellW,
        RIVER_ROW_START * cellH,
        (colEnd - colStart + 1) * cellW,
        (RIVER_ROW_END - RIVER_ROW_START + 1) * cellH
      );

      // Bridge planks
      ctx.strokeStyle = "#7a6544";
      ctx.lineWidth = 1;
      for (let i = colStart; i <= colEnd; i++) {
        ctx.beginPath();
        ctx.moveTo(
          (i + 0.5) * cellW,
          RIVER_ROW_START * cellH
        );
        ctx.lineTo(
          (i + 0.5) * cellW,
          (RIVER_ROW_END + 1) * cellH
        );
        ctx.stroke();
      }

      // Bridge rails
      ctx.strokeStyle = "#8b7450";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(colStart * cellW, RIVER_ROW_START * cellH);
      ctx.lineTo(colStart * cellW, (RIVER_ROW_END + 1) * cellH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo((colEnd + 1) * cellW, RIVER_ROW_START * cellH);
      ctx.lineTo((colEnd + 1) * cellW, (RIVER_ROW_END + 1) * cellH);
      ctx.stroke();
    }

    function drawTowers(ctx: CanvasRenderingContext2D, state: BattleState) {
      for (const tower of state.towers) {
        if (tower.destroyed) {
          // Draw rubble
          ctx.fillStyle = "rgba(100,100,100,0.3)";
          ctx.beginPath();
          ctx.arc(
            tower.pos.x * cellW,
            tower.pos.y * cellH,
            tower.size * cellW * 0.6,
            0,
            Math.PI * 2
          );
          ctx.fill();
          continue;
        }

        const isPlayer = tower.team === "player";
        const isKing = tower.type === "king";

        // Tower body
        const radius = tower.size * cellW * 0.65;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.3)";
        ctx.beginPath();
        ctx.ellipse(
          tower.pos.x * cellW,
          tower.pos.y * cellH + radius * 0.2,
          radius * 1.1,
          radius * 0.4,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Base
        ctx.fillStyle = isPlayer ? "#2a6e4e" : "#6e2a2a";
        ctx.beginPath();
        ctx.arc(
          tower.pos.x * cellW,
          tower.pos.y * cellH,
          radius,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Border
        ctx.strokeStyle = isPlayer ? "#3a9e6e" : "#9e3a3a";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner detail
        ctx.fillStyle = isPlayer ? "#3a8e5e" : "#8e3a3a";
        ctx.beginPath();
        ctx.arc(
          tower.pos.x * cellW,
          tower.pos.y * cellH,
          radius * 0.6,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Crown/King indicator
        if (isKing) {
          ctx.fillStyle = tower.awake ? "#ffd700" : "#666";
          ctx.font = `bold ${Math.round(radius * 0.8)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            tower.awake ? "\u2654" : "Z",
            tower.pos.x * cellW,
            tower.pos.y * cellH
          );
        } else {
          ctx.fillStyle = "#ffd700";
          ctx.font = `bold ${Math.round(radius * 0.6)}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(
            "\u265C",
            tower.pos.x * cellW,
            tower.pos.y * cellH
          );
        }

        // HP bar
        const hpRatio = tower.hp / tower.maxHp;
        const barW = radius * 2;
        const barH = 4;
        const barX = tower.pos.x * cellW - barW / 2;
        const barY = tower.pos.y * cellH - radius - 8;

        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle =
          hpRatio > 0.5
            ? "#4ade80"
            : hpRatio > 0.25
              ? "#fbbf24"
              : "#ef4444";
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
      }
    }

    function drawUnits(ctx: CanvasRenderingContext2D, state: BattleState) {
      for (const unit of state.units) {
        if (!unit.alive) continue;

        const x = unit.pos.x * cellW;
        const y = unit.pos.y * cellH;
        const isPlayer = unit.team === "player";
        const radius = unit.cardDef.count > 1 ? cellW * 0.3 : cellW * 0.45;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.3, radius * 0.9, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Unit body
        ctx.fillStyle = unit.cardDef.color;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Team ring
        ctx.strokeStyle = isPlayer ? "#4ade80" : "#ef4444";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner highlight
        ctx.fillStyle = "rgba(255,255,255,0.15)";
        ctx.beginPath();
        ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // HP bar
        const hpRatio = unit.hp / unit.maxHp;
        if (hpRatio < 1) {
          const barW = radius * 2;
          const barH = 3;
          const barX = x - barW / 2;
          const barY = y - radius - 6;

          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle =
            hpRatio > 0.5
              ? "#4ade80"
              : hpRatio > 0.25
                ? "#fbbf24"
                : "#ef4444";
          ctx.fillRect(barX, barY, barW * hpRatio, barH);
        }
      }
    }

    function drawProjectiles(
      ctx: CanvasRenderingContext2D,
      state: BattleState
    ) {
      for (const proj of state.projectiles) {
        if (!proj.alive) continue;

        const x = proj.current.x * cellW;
        const y = proj.current.y * cellH;

        // Glow
        ctx.fillStyle = "rgba(255,200,50,0.3)";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = "#ffcc33";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();

        // Trail
        const tx = proj.from.x * cellW;
        const ty = proj.from.y * cellH;
        const gradient = ctx.createLinearGradient(tx, ty, x, y);
        gradient.addColorStop(0, "rgba(255,200,50,0)");
        gradient.addColorStop(1, "rgba(255,200,50,0.3)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(
          x - (x - tx) * 0.3,
          y - (y - ty) * 0.3
        );
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [stateRef, canvasWidth, canvasHeight, cellW, cellH]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="block w-full h-full"
      onClick={handleClick}
      onTouchStart={handleClick}
      style={{ touchAction: "none" }}
    />
  );
}
