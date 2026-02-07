"use client";

import { useRef, useEffect } from "react";
import type { CardDef } from "@/lib/game/cards";
import { ALL_CARDS } from "@/lib/game/cards";
import {
  initBattle,
  updateBattle,
  playCardFromHand,
  type BattleState,
} from "@/lib/game/battle-engine";
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
  UNIT_SPRITE_CONFIG,
  getWalkFramePath,
  getAttackFramePath,
  getIdleFramePath,
} from "@/lib/game/unit-sprites";

const ARCHER_ID = "arciere";
const CELL = 18;
const W = GRID_W * CELL;
// Only show top portion of arena (bot side + river + bit of player side)
const VISIBLE_GRID_ROWS = 22;
const H = VISIBLE_GRID_ROWS * CELL;
const RESET_AFTER_MS = 12000;
const PREVIEW_DISPLAY_SCALE = 0.88;

const OPPONENT_NAME = "Rival";

export function MiniBattlePreview({
  card,
  playerName = "You",
}: {
  card: CardDef;
  playerName?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<BattleState | null>(null);
  const lastTickRef = useRef<number>(0);
  const spritesRef = useRef<Record<
    string,
    { walk: HTMLImageElement[]; attack: HTMLImageElement[]; idle?: HTMLImageElement[] }
  >>({});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const cellW = CELL;
    const cellH = CELL;

    for (const [cardId, config] of Object.entries(UNIT_SPRITE_CONFIG)) {
      const walkImgs: HTMLImageElement[] = [];
      const attackImgs: HTMLImageElement[] = [];
      const idleImgs: HTMLImageElement[] = [];
      const idleFrames = config.idleFrames ?? 0;
      let walkLoaded = 0;
      let attackLoaded = 0;
      let idleLoaded = 0;
      const maybeSet = () => {
        if (
          walkLoaded === config.walkFrames &&
          attackLoaded === config.attackFrames &&
          (idleFrames === 0 || idleLoaded === idleFrames)
        ) {
          spritesRef.current[cardId] = {
            walk: walkImgs,
            attack: attackImgs,
            ...(idleFrames > 0 ? { idle: idleImgs } : {}),
          };
        }
      };
      for (let i = 1; i <= config.walkFrames; i++) {
        const img = new Image();
        img.src = getWalkFramePath(cardId, i);
        walkImgs[i - 1] = img;
        img.onload = () => {
          walkLoaded++;
          maybeSet();
        };
      }
      for (let i = 1; i <= config.attackFrames; i++) {
        const img = new Image();
        img.src = getAttackFramePath(cardId, i);
        attackImgs[i - 1] = img;
        img.onload = () => {
          attackLoaded++;
          maybeSet();
        };
      }
      if (idleFrames > 0) {
        for (let i = 1; i <= idleFrames; i++) {
          const img = new Image();
          img.src = getIdleFramePath(cardId, i);
          idleImgs[i - 1] = img;
          img.onload = () => {
            idleLoaded++;
            maybeSet();
          };
        }
      }
    }

    function init(): BattleState {
      const archer = ALL_CARDS.find((c) => c.id === ARCHER_ID);
      if (!archer) throw new Error("Archer card not found");

      const playerCards = Array.from({ length: 6 }, () => ({
        cardDef: card,
        aiLevel: 1,
      }));
      const botCards = Array.from({ length: 6 }, () => ({
        cardDef: archer,
        aiLevel: 1,
      }));

      const state = initBattle(playerCards, botCards, 0);
      state.playerElixir = 10;
      state.botElixir = 10;
      state.lastElixirRegenPlayer = Date.now();
      state.lastElixirRegenBot = Date.now();

      const now = Date.now();
      state.startTime = now;

      // Spawn in visible top portion: player just below river (y=20), bots above
      const playerSpots = [{ x: 8.5, y: 20 }, { x: 5, y: 20 }, { x: 12, y: 20 }];
      const botSpots = [{ x: 6, y: 8 }, { x: 11, y: 8 }];
      let ok = playCardFromHand(state, 0, playerSpots[0], "player");
      if (!ok) ok = playCardFromHand(state, 0, playerSpots[1], "player");
      if (!ok) playCardFromHand(state, 0, playerSpots[2], "player");
      playCardFromHand(state, 0, botSpots[0], "bot");
      playCardFromHand(state, 1, botSpots[1], "bot");

      return state;
    }

    stateRef.current = init();
    lastTickRef.current = performance.now();
    let animId = 0;
    let resetAt = Date.now() + RESET_AFTER_MS;

    function drawArena(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#1a3a2a";
      ctx.fillRect(0, 0, W, H);
      const clipY = Math.min(H, (RIVER_ROW_END + 1) * cellH);
      if (clipY < H) {
        ctx.fillStyle = "#1e4432";
        ctx.fillRect(0, clipY, W, H - clipY);
      }
      ctx.fillStyle = "#1a3a2a";
      ctx.fillRect(0, 0, W, Math.min(H, RIVER_ROW_START * cellH));
      ctx.fillStyle = "#1a5f8a";
      const riverTop = RIVER_ROW_START * cellH;
      const riverH = (RIVER_ROW_END - RIVER_ROW_START + 1) * cellH;
      ctx.fillRect(0, riverTop, W, Math.min(riverH, H - riverTop));
      ctx.strokeStyle = "#2080b0";
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        const y = (RIVER_ROW_START + 0.3 + i * 0.5) * cellH;
        ctx.beginPath();
        for (let x = 0; x < W; x += 4) {
          ctx.lineTo(x, y + Math.sin(x * 0.05 + Date.now() * 0.003 + i) * 2);
        }
        ctx.stroke();
      }
      function drawBridge(colStart: number, colEnd: number) {
        ctx.fillStyle = "#5c4a32";
        ctx.fillRect(
          colStart * cellW,
          RIVER_ROW_START * cellH,
          (colEnd - colStart + 1) * cellW,
          (RIVER_ROW_END - RIVER_ROW_START + 1) * cellH
        );
        ctx.strokeStyle = "#7a6544";
        ctx.lineWidth = 1;
        for (let i = colStart; i <= colEnd; i++) {
          ctx.beginPath();
          ctx.moveTo((i + 0.5) * cellW, RIVER_ROW_START * cellH);
          ctx.lineTo((i + 0.5) * cellW, (RIVER_ROW_END + 1) * cellH);
          ctx.stroke();
        }
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
      drawBridge(BRIDGE_LEFT_COL_START, BRIDGE_LEFT_COL_END);
      drawBridge(BRIDGE_RIGHT_COL_START, BRIDGE_RIGHT_COL_END);
    }

    function drawTowers(ctx: CanvasRenderingContext2D, state: BattleState) {
      for (const tower of state.towers) {
        if (tower.pos.y >= VISIBLE_GRID_ROWS) continue;
        if (tower.destroyed) {
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
        const radius = tower.size * cellW * 0.65;
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
        ctx.strokeStyle = isPlayer ? "#3a9e6e" : "#9e3a3a";
        ctx.lineWidth = 2;
        ctx.stroke();
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
        ctx.fillStyle = isKing ? (tower.awake ? "#ffd700" : "#666") : "#ffd700";
        ctx.font = `bold ${Math.round(radius * (isKing ? 0.8 : 0.6))}px sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          isKing ? (tower.awake ? "\u2654" : "Z") : "\u265C",
          tower.pos.x * cellW,
          tower.pos.y * cellH
        );
        const hpRatio = tower.hp / tower.maxHp;
        const barW = radius * 2;
        const barH = 4;
        const barX = tower.pos.x * cellW - barW / 2;
        const barY = tower.pos.y * cellH - radius - 8;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle =
          hpRatio > 0.5 ? "#4ade80" : hpRatio > 0.25 ? "#fbbf24" : "#ef4444";
        ctx.fillRect(barX, barY, barW * hpRatio, barH);
      }
    }

    function drawUnits(ctx: CanvasRenderingContext2D, state: BattleState) {
      const now = Date.now();
      for (const unit of state.units) {
        if (!unit.alive) continue;
        if (unit.pos.y >= VISIBLE_GRID_ROWS) continue;
        const x = unit.pos.x * cellW;
        const y = unit.pos.y * cellH;
        const isPlayer = unit.team === "player";
        const radius = unit.cardDef.count > 1 ? cellW * 0.3 : cellW * 0.45;
        const cardId = unit.cardDef.id;
        const sprites = spritesRef.current[cardId];
        const config = UNIT_SPRITE_CONFIG[cardId];

        if (sprites && config) {
          const attackDurationMs = config.attackDurationMs ?? 400;
          const inAttack = now - unit.lastAttackTime < attackDurationMs;
          const isMoving =
            unit.path.length > 0 && unit.pathIndex < unit.path.length;
          const bodyScale = config.scale ?? 1;
          const attackScale = config.attackScale ?? bodyScale;
          const idleFrames = config.idleFrames ?? 0;
          const hasIdle = idleFrames > 0 && sprites.idle?.length === idleFrames;

          if (inAttack && sprites.attack.length) {
            const frameTime = attackDurationMs / config.attackFrames;
            const attackFrameIndex = Math.max(
              0,
              Math.min(
                config.attackFrames - 1,
                Math.floor((now - unit.lastAttackTime) / frameTime)
              )
            );
            const bodyImg = hasIdle ? sprites.idle![0] : sprites.walk[0];
            const attackImg = sprites.attack[attackFrameIndex];
            const bodyOk = bodyImg?.complete && bodyImg.naturalWidth;
            const attackOk = attackImg?.complete && attackImg.naturalWidth;
            if (bodyOk) {
              const bw = radius * 2 * bodyScale;
              const bh = radius * 2 * bodyScale;
              ctx.save();
              ctx.translate(x, y);
              if (!isPlayer) ctx.scale(-1, 1);
              ctx.drawImage(bodyImg, -bw / 2, -bh / 2, bw, bh);
              if (attackOk) {
                const aw = radius * 2 * attackScale;
                const ah = radius * 2 * attackScale;
                ctx.drawImage(attackImg, -aw / 2, -ah / 2, aw, ah);
              }
              ctx.restore();
            } else if (attackOk) {
              const aw = radius * 2 * attackScale;
              const ah = radius * 2 * attackScale;
              ctx.save();
              ctx.translate(x, y);
              if (!isPlayer) ctx.scale(-1, 1);
              ctx.drawImage(attackImg, -aw / 2, -ah / 2, aw, ah);
              ctx.restore();
            } else {
              drawUnitCircle(ctx, unit, x, y, radius, isPlayer);
            }
          } else {
            let img: HTMLImageElement;
            if (hasIdle && !isMoving) {
              const idleFps = config.idleFps ?? 8;
              const frameIndex =
                Math.floor((now / 1000) * idleFps) % idleFrames;
              img = sprites.idle![frameIndex];
            } else {
              const walkFps = config.walkFps ?? 10;
              const frameIndex =
                Math.floor((now / 1000) * walkFps) % config.walkFrames;
              img = sprites.walk[frameIndex];
            }
            if (img?.complete && img.naturalWidth) {
              const w = radius * 2 * bodyScale;
              const h = radius * 2 * bodyScale;
              ctx.save();
              ctx.translate(x, y);
              if (!isPlayer) ctx.scale(-1, 1);
              ctx.drawImage(img, -w / 2, -h / 2, w, h);
              ctx.restore();
            } else {
              drawUnitCircle(ctx, unit, x, y, radius, isPlayer);
            }
          }
        } else {
          drawUnitCircle(ctx, unit, x, y, radius, isPlayer);
        }

        const hpRatio = unit.hp / unit.maxHp;
        if (hpRatio < 1) {
          const drawScale = (sprites && config)
            ? Math.max(config.scale ?? 1, config.attackScale ?? config.scale ?? 0)
            : 1;
          const barW = radius * 2 * drawScale;
          const barH = 3;
          const barX = x - barW / 2;
          const barY = y - radius * drawScale - 6;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(barX, barY, barW, barH);
          ctx.fillStyle =
            hpRatio > 0.5 ? "#4ade80" : hpRatio > 0.25 ? "#fbbf24" : "#ef4444";
          ctx.fillRect(barX, barY, barW * hpRatio, barH);
        }

        if (unit.frozenUntil > now) {
          const r = radius * 1.4;
          ctx.save();
          ctx.translate(x, y);
          ctx.fillStyle = "rgba(100, 200, 255, 0.25)";
          ctx.strokeStyle = "rgba(80, 180, 255, 0.9)";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -r);
          ctx.lineTo(r * 0.7, r * 0.5);
          ctx.lineTo(0, r * 0.3);
          ctx.lineTo(-r * 0.7, r * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }

    function drawUnitCircle(
      ctx: CanvasRenderingContext2D,
      unit: BattleState["units"][0],
      x: number,
      y: number,
      radius: number,
      isPlayer: boolean
    ) {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(x, y + radius * 0.3, radius * 0.9, radius * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = unit.cardDef.color;
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isPlayer ? "#4ade80" : "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.beginPath();
      ctx.arc(x - radius * 0.2, y - radius * 0.2, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawProjectiles(ctx: CanvasRenderingContext2D, state: BattleState) {
      for (const proj of state.projectiles) {
        if (!proj.alive) continue;
        if (proj.current.y >= VISIBLE_GRID_ROWS) continue;
        const x = proj.current.x * cellW;
        const y = proj.current.y * cellH;
        ctx.fillStyle = "rgba(255,200,50,0.3)";
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffcc33";
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
        const tx = proj.from.x * cellW;
        const ty = proj.from.y * cellH;
        const gradient = ctx.createLinearGradient(tx, ty, x, y);
        gradient.addColorStop(0, "rgba(255,200,50,0)");
        gradient.addColorStop(1, "rgba(255,200,50,0.3)");
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x - (x - tx) * 0.3, y - (y - ty) * 0.3);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
    }

    function render() {
      const state = stateRef.current;
      if (!state) {
        animId = requestAnimationFrame(render);
        return;
      }

      const now = performance.now();
      const dt = Math.min((now - lastTickRef.current) / 1000, 0.05);
      lastTickRef.current = now;

      updateBattle(state, dt);

      if (state.gameOver || Date.now() > resetAt) {
        stateRef.current = init();
        lastTickRef.current = performance.now();
        resetAt = Date.now() + RESET_AFTER_MS;
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, W, H);
      drawArena(ctx);
      drawTowers(ctx, state);
      drawUnits(ctx, state);
      drawProjectiles(ctx, state);

      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "rgba(239,68,68,0.9)";
      ctx.fillText(OPPONENT_NAME, 4, 10);
      ctx.fillStyle = "rgba(74,222,128,0.9)";
      ctx.fillText(playerName, 4, H - 10);

      animId = requestAnimationFrame(render);
    }

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [card.id, card.color, playerName]);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      className="rounded-lg border border-border bg-charcoal block mx-auto"
      style={{
        width: W * PREVIEW_DISPLAY_SCALE,
        height: H * PREVIEW_DISPLAY_SCALE,
        maxWidth: "100%",
      }}
    />
  );
}
