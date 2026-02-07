"use client";

import React from "react"

import { useState, useEffect } from "react";
import { TopBar } from "@/components/game/top-bar";
import { BottomNav } from "@/components/game/bottom-nav";
import { useGameStore } from "@/lib/game/store";
import { COLLECTION_CARDS } from "@/lib/game/cards";
import { Coins, Package, BookOpen, Gift, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function StorePage() {
  const {
    gold,
    ownedCardIds,
    dailyDealCardId,
    purchaseGoldPack,
    purchaseCardCrate,
    refreshDailyDeal,
    unlockCard,
    addGold,
  } = useGameStore();
  const [message, setMessage] = useState<string | null>(null);

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
          <h1 className="text-xl font-bold text-foreground">Negozio</h1>
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

        {/* Daily Deal */}
        {dailyCard && (
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              Offerta del Giorno
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
                <div className="text-[10px] text-muted-foreground italic">
                  {dailyCard.italianName}
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
          {/* Gold Pack Small */}
          <ShopItemCard
            icon={<Coins className="h-6 w-6 text-gold-light" />}
            iconBg="hsl(43 74% 49% / 0.15)"
            title="Gold Pouch"
            italianTitle="Sacchetto d'Oro"
            description="+200 Gold"
            price="Free"
            onPurchase={() => {
              purchaseGoldPack(200);
              showMessage("+200 Gold!");
            }}
          />

          {/* Gold Pack Large */}
          <ShopItemCard
            icon={<Package className="h-6 w-6 text-gold-light" />}
            iconBg="hsl(43 74% 49% / 0.15)"
            title="Gold Chest"
            italianTitle="Forziere d'Oro"
            description="+500 Gold"
            price="Free"
            onPurchase={() => {
              purchaseGoldPack(500);
              showMessage("+500 Gold!");
            }}
          />

          {/* AI Manual */}
          <ShopItemCard
            icon={<BookOpen className="h-6 w-6 text-primary" />}
            iconBg="hsl(43 74% 49% / 0.1)"
            title="AI Manual"
            italianTitle="Manuale IA"
            description="Get 100 gold to use for AI upgrades"
            price="Free"
            onPurchase={() => {
              addGold(100);
              showMessage("+100 Gold for AI upgrades!");
            }}
          />

          {/* Card Crate */}
          <ShopItemCard
            icon={<Gift className="h-6 w-6 text-primary" />}
            iconBg="hsl(43 74% 49% / 0.1)"
            title="Card Crate"
            italianTitle="Cassa di Carte"
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
  italianTitle,
  description,
  price,
  priceIcon,
  disabled,
  onPurchase,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  italianTitle: string;
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
        <div className="text-[10px] text-muted-foreground italic">
          {italianTitle}
        </div>
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
