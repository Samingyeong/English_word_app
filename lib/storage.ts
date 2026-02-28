import { WordSet, WrongAnswer } from "./types";

const STORAGE_KEYS = {
  WORD_SETS: "word-sets",
  WRONG_ANSWERS: "wrong-answers",
  WORD_ASSETS_LOADED: "word-assets-loaded",
  DELETED_ASSET_KEYS: "deleted-asset-keys",
} as const;

export function hasLoadedWordAssets(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS.WORD_ASSETS_LOADED) === "true";
}

export function setWordAssetsLoaded(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.WORD_ASSETS_LOADED, "true");
}

export function clearWordAssetsLoaded(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.WORD_ASSETS_LOADED);
}

export function getDeletedAssetKeys(): string[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.DELETED_ASSET_KEYS);
  if (!data) return [];
  try {
    const parsed = JSON.parse(data) as unknown;
    return Array.isArray(parsed) ? parsed.filter((k): k is string => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export function addDeletedAssetKey(assetKey: string): void {
  if (typeof window === "undefined") return;
  const keys = getDeletedAssetKeys();
  if (keys.includes(assetKey)) return;
  keys.push(assetKey);
  localStorage.setItem(STORAGE_KEYS.DELETED_ASSET_KEYS, JSON.stringify(keys));
}

export function removeDeletedAssetKeys(keysToRemove: string[]): void {
  if (typeof window === "undefined") return;
  const keys = getDeletedAssetKeys().filter((k) => !keysToRemove.includes(k));
  localStorage.setItem(STORAGE_KEYS.DELETED_ASSET_KEYS, JSON.stringify(keys));
}

export function saveWordSets(wordSets: WordSet[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.WORD_SETS, JSON.stringify(wordSets));
}

export function loadWordSets(): WordSet[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.WORD_SETS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveWrongAnswers(wrongAnswers: WrongAnswer[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.WRONG_ANSWERS, JSON.stringify(wrongAnswers));
}

export function loadWrongAnswers(): WrongAnswer[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEYS.WRONG_ANSWERS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function addWrongAnswer(
  wordId: string,
  english: string,
  korean: string,
  day: number
): void {
  const wrongAnswers = loadWrongAnswers();
  const existingIndex = wrongAnswers.findIndex((wa) => wa.wordId === wordId);

  if (existingIndex >= 0) {
    wrongAnswers[existingIndex].wrongCount += 1;
    wrongAnswers[existingIndex].lastWrongAt = new Date().toISOString();
  } else {
    wrongAnswers.push({
      wordId,
      english,
      korean,
      day,
      wrongCount: 1,
      lastWrongAt: new Date().toISOString(),
    });
  }

  saveWrongAnswers(wrongAnswers);
}

export function removeWrongAnswer(wordId: string): void {
  const wrongAnswers = loadWrongAnswers();
  const filtered = wrongAnswers.filter((wa) => wa.wordId !== wordId);
  saveWrongAnswers(filtered);
}

export function removeWordSet(wordSetId: string): void {
  const wordSets = loadWordSets();
  const filtered = wordSets.filter((ws) => ws.id !== wordSetId);
  saveWordSets(filtered);
}

