import type { PlayerProfile } from './PlayerProfile';
import { createDefaultProfile } from './PlayerProfile';

const STORAGE_KEY = 'crown_rivals_profile';

export function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProfile();
    const parsed = JSON.parse(raw) as Partial<PlayerProfile>;
    const defaultProfile = createDefaultProfile();
    return {
      playerName: parsed.playerName ?? defaultProfile.playerName,
      trophies: Math.max(0, parsed.trophies ?? 0),
      gold: Math.max(0, parsed.gold ?? 0),
      ownedCardIds: Array.isArray(parsed.ownedCardIds) ? parsed.ownedCardIds : defaultProfile.ownedCardIds,
      cardAILevel: typeof parsed.cardAILevel === 'object' && parsed.cardAILevel
        ? { ...defaultProfile.cardAILevel, ...parsed.cardAILevel }
        : defaultProfile.cardAILevel,
      deckCardIds: Array.isArray(parsed.deckCardIds) && parsed.deckCardIds.length >= 6
        ? parsed.deckCardIds.slice(0, 8)
        : defaultProfile.deckCardIds,
    };
  } catch {
    return createDefaultProfile();
  }
}

export function saveProfile(profile: PlayerProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function resetProgress(): PlayerProfile {
  const defaultProfile = createDefaultProfile();
  saveProfile(defaultProfile);
  return defaultProfile;
}
