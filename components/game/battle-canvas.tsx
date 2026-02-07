"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
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
import {
  canPlaceTroopDeploy,
  isInDeployTerritory,
  isInPocket,
} from "@/lib/game/arena";

interface BattleCanvasProps {
  stateRef: React.MutableRefObject<BattleState | null>;
  onCanvasTap: (gridX: number, gridY: number) => void;
  canvasWidth: number;
  canvasHeight: number;
  /** When set, show placement validity at hover cell (green/red). */
  selectedHandIndex: number | null;
  /** Show grid and walkable overlay for debugging. */
  showDebugOverlay?: boolean;
}

export function BattleCanvas({
  stateRef,
  onCanvasTap,
  canvasWidth,
  canvasHeight,
  selectedHandIndex,
  showDebugOverlay = false,
}: BattleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);

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
      const tileX = Math.max(0, Math.min(GRID_W - 1, Math.floor(gridX)));
      const tileY = Math.max(0, Math.min(GRID_H - 1, Math.floor(gridY)));
      onCanvasTap(tileX + 0.5, tileY + 0.5);
    },
    [canvasWidth, canvasHeight, cellW, cellH, onCanvasTap]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
      const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;
      const gx = Math.floor(x / cellW);
      const gy = Math.floor(y / cellH);
      setHoverCell({ x: gx, y: gy });
    },
    [canvasWidth, canvasHeight, cellW, cellH]
  );

  const handleMouseLeave = useCallback(() => {
    setHoverCell(null);
  }, []);

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

      // Layers: base terrain → lane ground → river → bridges → towers → units → projectiles → overlays
      drawArena(ctx, state);
      drawTowers(ctx, state);
      drawUnits(ctx, state);
      drawProjectiles(ctx, state);
      if (selectedHandIndex !== null) {
        drawDeployZoneHighlight(ctx, state);
        if (hoverCell) drawPlacementOverlay(ctx, state, hoverCell);
      }
      if (showDebugOverlay) {
        drawDebugOverlay(ctx, state);
      }

      animFrameRef.current = requestAnimationFrame(render);
    }

    // Deterministic brightness noise ~2–4% per cell (seed from cell)
    function cellNoise(gx: number, gy: number): number {
      const s = (gx * 31 + gy) * 0.01;
      return (Math.sin(s) * 0.5 + 0.5) * 0.04 - 0.02;
    }

    function drawArena(ctx: CanvasRenderingContext2D, state: BattleState) {
      // Layer 1: Checkerboard (two shades, warmer on player half, colder on enemy)
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const isRiver = gy >= RIVER_ROW_START && gy <= RIVER_ROW_END;
          const onBridge =
            isRiver &&
            ((gx >= BRIDGE_LEFT_COL_START && gx <= BRIDGE_LEFT_COL_END) ||
              (gx >= BRIDGE_RIGHT_COL_START && gx <= BRIDGE_RIGHT_COL_END));
          if (isRiver && !onBridge) continue; // river drawn below
          const parity = (gx + gy) % 2;
          const noise = cellNoise(gx, gy);
          const isPlayerHalf = gy > RIVER_ROW_END;
          const baseA = isPlayerHalf ? "#1b3d2e" : "#1a3638";
          const baseB = isPlayerHalf ? "#1e4635" : "#1c3a3c";
          const hex = parity === 0 ? baseA : baseB;
          const r = parseInt(hex.slice(1, 3), 16);
          const g = parseInt(hex.slice(3, 5), 16);
          const b = parseInt(hex.slice(5, 7), 16);
          const n = 1 + noise;
          ctx.fillStyle = `rgb(${Math.round(r * n)},${Math.round(g * n)},${Math.round(b * n)})`;
          ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
      // River cells (checkerboard under water)
      for (let gy = RIVER_ROW_START; gy <= RIVER_ROW_END; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const onBridge =
            (gx >= BRIDGE_LEFT_COL_START && gx <= BRIDGE_LEFT_COL_END) ||
            (gx >= BRIDGE_RIGHT_COL_START && gx <= BRIDGE_RIGHT_COL_END);
          if (onBridge) continue;
          const parity = (gx + gy) % 2;
          ctx.fillStyle = parity === 0 ? "#153a52" : "#184a62";
          ctx.fillRect(gx * cellW, gy * cellH, cellW + 0.5, cellH + 0.5);
        }
      }
      // Thin grid lines (10–20% alpha)
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
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
      // Layer 2: River water (over river cells, animated)
      ctx.fillStyle = "rgba(26, 95, 138, 0.85)";
      ctx.fillRect(
        0,
        RIVER_ROW_START * cellH,
        canvasWidth,
        (RIVER_ROW_END - RIVER_ROW_START + 1) * cellH
      );
      ctx.strokeStyle = "rgba(32, 128, 176, 0.6)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const y = (RIVER_ROW_START + 0.3 + i * 0.5) * cellH;
        ctx.beginPath();
        for (let x = 0; x < canvasWidth; x += 4) {
          ctx.lineTo(x, y + Math.sin(x * 0.05 + Date.now() * 0.003 + i) * 2);
        }
        ctx.stroke();
      }
      // Layer 3: Bridges (over water)
      drawBridge(ctx, BRIDGE_LEFT_COL_START, BRIDGE_LEFT_COL_END);
      drawBridge(ctx, BRIDGE_RIGHT_COL_START, BRIDGE_RIGHT_COL_END);
      // Layer 4: Ruins decal (on cells with grid === 4)
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          if (state.grid[gy][gx] !== 4) continue;
          ctx.fillStyle = "rgba(120,110,100,0.5)";
          ctx.fillRect(gx * cellW + 1, gy * cellH + 1, cellW - 2, cellH - 2);
          ctx.strokeStyle = "rgba(80,70,60,0.5)";
          ctx.lineWidth = 1;
          ctx.strokeRect(gx * cellW + 1, gy * cellH + 1, cellW - 2, cellH - 2);
        }
      }
    }

    function drawDeployZoneHighlight(ctx: CanvasRenderingContext2D, state: BattleState) {
      const territory = {
        pocketLeft: state.playerPocketLeft,
        pocketRight: state.playerPocketRight,
      };
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          if (!canPlaceTroopDeploy(state.grid, gx, gy, "player", territory)) continue;
          const inPocket = isInPocket("player", territory, gx, gy);
          ctx.fillStyle = inPocket ? "rgba(74, 222, 128, 0.18)" : "rgba(74, 222, 128, 0.1)";
          ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
        }
      }
    }

    function drawPlacementOverlay(
      ctx: CanvasRenderingContext2D,
      state: BattleState,
      cell: { x: number; y: number }
    ) {
      const territory = {
        pocketLeft: state.playerPocketLeft,
        pocketRight: state.playerPocketRight,
      };
      const valid = canPlaceTroopDeploy(
        state.grid,
        cell.x,
        cell.y,
        "player",
        territory
      );
      ctx.fillStyle = valid ? "rgba(74, 222, 128, 0.35)" : "rgba(239, 68, 68, 0.35)";
      ctx.fillRect(cell.x * cellW, cell.y * cellH, cellW, cellH);
      ctx.strokeStyle = valid ? "rgba(74, 222, 128, 0.8)" : "rgba(239, 68, 68, 0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(cell.x * cellW, cell.y * cellH, cellW, cellH);
    }

    function drawDebugOverlay(ctx: CanvasRenderingContext2D, state: BattleState) {
      const playerTerritory = {
        pocketLeft: state.playerPocketLeft,
        pocketRight: state.playerPocketRight,
      };
      // Deploy territory (player): base half + pocket
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          if (isInDeployTerritory("player", playerTerritory, gx, gy)) {
            const inPocket = isInPocket("player", playerTerritory, gx, gy);
            ctx.fillStyle = inPocket ? "rgba(59, 130, 246, 0.2)" : "rgba(34, 197, 94, 0.12)";
            ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
          }
        }
      }
      // Blocked / water / bridge
      for (let gy = 0; gy < GRID_H; gy++) {
        for (let gx = 0; gx < GRID_W; gx++) {
          const v = state.grid[gy][gx];
          if (v === 1) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.25)";
            ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
          } else if (v === 2) {
            ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
            ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
          } else if (v === 3) {
            ctx.fillStyle = "rgba(234, 179, 8, 0.15)";
            ctx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
          }
        }
      }
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
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
          // Ruins: placeable area, visual = light rubble (not “blocked”)
          ctx.fillStyle = "rgba(140,130,120,0.35)";
          ctx.beginPath();
          ctx.arc(
            tower.pos.x * cellW,
            tower.pos.y * cellH,
            tower.size * cellW * 0.6,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.strokeStyle = "rgba(100,90,80,0.4)";
          ctx.lineWidth = 1;
          ctx.stroke();
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
  }, [
    stateRef,
    canvasWidth,
    canvasHeight,
    cellW,
    cellH,
    selectedHandIndex,
    hoverCell,
    showDebugOverlay,
  ]);

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className="block w-full h-full"
      onClick={handleClick}
      onTouchStart={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ touchAction: "none" }}
    />
  );
}
