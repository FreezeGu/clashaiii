"use client";

import React, { useState, useEffect } from "react";
import { TopBar } from "@/components/game/top-bar";
import { BottomNav } from "@/components/game/bottom-nav";
import { useGameStore } from "@/lib/game/store";
import { COLLECTION_CARDS } from "@/lib/game/cards";
import { Coins, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StorePage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
}) {
  if (params) React.use(params);
  if (searchParams) React.use(searchParams);

  const {
    gold,
    ownedCardIds,
    dailyDealCardId,
    purchaseCardCrate,
    refreshDailyDeal,
    unlockCard,
    addGold,
    claimDailyGold,
    lastDailyGoldClaimAt,
  } = useGameStore();
  const [message, setMessage] = useState<string | null>(null);

  const now = Date.now();
  const canClaimDaily =
    lastDailyGoldClaimAt === 0 || now - lastDailyGoldClaimAt >= 24 * 60 * 60 * 1000;
  const nextClaimInMs =
    lastDailyGoldClaimAt > 0
      ? Math.max(0, lastDailyGoldClaimAt + 24 * 60 * 60 * 1000 - now)
      : 0;
  const nextClaimHours = Math.floor(nextClaimInMs / (60 * 60 * 1000));
  const nextClaimMins = Math.floor((nextClaimInMs % (60 * 60 * 1000)) / (60 * 1000));

  useEffect(() => {
    refreshDailyDeal();
  }, [refreshDailyDeal]);

  const dailyCard = COLLECTION_CARDS.find((c) => c.id === dailyDealCardId);
  const hasDailyCard = ownedCardIds.includes(dailyDealCardId);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background">
      <TopBar />

      <main className="flex-1 px-4 pt-4 pb-24 overflow-y-auto">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">Store</h1>
          <p className="text-xs text-muted-foreground">
            Spend your gold wisely
          </p>
        </div>

        {/* Notification toast */}
        {message && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold shadow-lg animate-in fade-in duration-200">
            {message}
          </div>
        )}

        {/* Daily reward: 100 gold every 24h */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
            <Coins className="h-4 w-4" />
            Daily reward
          </h2>
          <div className="bg-charcoal-light border border-primary/30 rounded-xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-primary/20">
              <Coins className="h-6 w-6 text-gold-light" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground">
                100 Gold
              </div>
              <div className="text-xs text-muted-foreground">
                {canClaimDaily
                  ? "Claim once every 24 hours"
                  : `Next claim in ${nextClaimHours}h ${nextClaimMins}m`}
              </div>
            </div>
            <button
              onClick={() => {
                if (claimDailyGold()) {
                  showMessage("+100 Gold!");
                }
              }}
              disabled={!canClaimDaily}
              className={cn(
                "min-h-[44px] px-4 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-colors shrink-0",
                canClaimDaily
                  ? "bg-primary text-primary-foreground hover:brightness-110"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              type="button"
            >
              <Coins className="h-3.5 w-3.5" />
              {canClaimDaily ? "Claim" : "Claimed"}
            </button>
          </div>
        </div>

        {/* Daily Deal */}
        {dailyCard && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Daily Deal
            </h2>
            <div className="bg-charcoal-light border border-primary/30 rounded-xl p-4 flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                style={{ backgroundColor: dailyCard.color + "22" }}
              >
                <Gift className="h-6 w-6" style={{ color: dailyCard.color }} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">
                  {dailyCard.name}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {dailyCard.description}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {hasDailyCard ? "Already owned - Get 50 gold" : "Unlock this card"}
                </div>
              </div>
              <button
                onClick={() => {
                  if (hasDailyCard) {
                    addGold(50);
                    showMessage("+50 Gold (duplicate)");
                  } else {
                    if (gold >= 100) {
                      addGold(-100);
                      unlockCard(dailyDealCardId);
                      showMessage(`Unlocked ${dailyCard.name}!`);
                    } else {
                      showMessage("Not enough gold!");
                    }
                  }
                }}
                className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground font-semibold text-sm flex items-center gap-1.5 hover:brightness-110 transition-colors"
                type="button"
              >
                <Coins className="h-3.5 w-3.5" />
                {hasDailyCard ? "50" : "100"}
              </button>
            </div>
          </div>
        )}

        {/* Shop items */}
        <div className="flex flex-col gap-3">
          {/* Card Crate */}
          <ShopItemCard
            icon={<Gift className="h-6 w-6 text-primary" />}
            iconBg="hsl(43 74% 49% / 0.1)"
            title="Card Crate"
            description="Unlock a random missing card"
            price={`${150}`}
            priceIcon
            disabled={gold < 150}
            onPurchase={() => {
              const result = purchaseCardCrate();
              if (result) {
                const card = COLLECTION_CARDS.find((c) => c.id === result);
                showMessage(`Unlocked ${card?.name || "a card"}!`);
              } else {
                showMessage("No new cards - got 75 gold shards!");
              }
            }}
          />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function ShopItemCard({
  icon,
  iconBg,
  title,
  description,
  price,
  priceIcon,
  disabled,
  onPurchase,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  description: string;
  price: string;
  priceIcon?: boolean;
  disabled?: boolean;
  onPurchase: () => void;
}) {
  return (
    <div className="bg-charcoal-light border border-border rounded-xl p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          {description}
        </div>
      </div>
      <button
        onClick={onPurchase}
        disabled={disabled}
        className={cn(
          "min-h-[44px] px-4 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition-colors shrink-0",
          disabled
            ? "bg-muted text-muted-foreground cursor-not-allowed"
            : "bg-primary text-primary-foreground hover:brightness-110"
        )}
        type="button"
      >
        {priceIcon && <Coins className="h-3.5 w-3.5" />}
        {price}
      </button>
    </div>
  );
}
