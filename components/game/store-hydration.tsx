"use client";

import { useEffect } from "react";
import { useGameStore } from "@/lib/game/store";

/** Rehydrate persisted store on client so we can use skipHydration for SSR. */
export function StoreHydration() {
  useEffect(() => {
    useGameStore.persist.rehydrate();
  }, []);
  return null;
}
