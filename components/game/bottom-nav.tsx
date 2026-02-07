"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Layers, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", italianLabel: "Casa", icon: Home },
  { href: "/deck", label: "Deck", italianLabel: "Mazzo", icon: Layers },
  {
    href: "/store",
    label: "Store",
    italianLabel: "Negozio",
    icon: ShoppingBag,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
      <div className="flex items-center justify-around bg-charcoal-light/95 backdrop-blur-sm border-t border-border py-2 px-4">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 min-w-[64px] min-h-[44px] justify-center rounded-lg px-3 py-1 transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium tracking-wide uppercase">
                {item.italianLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
