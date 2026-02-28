export interface Word {
  id: string;
  english: string;
  korean: string;
  isCorrect?: boolean;
}

export interface WordSet {
  id: string;
  day: number;
  name: string;
  words: Word[];
  createdAt: string;
  /** word_assets에서 온 단어장일 때만 있음. 같은 단어장을 다시 불러올 때 사용 */
  assetKey?: string;
}

export interface WrongAnswer {
  wordId: string;
  english: string;
  korean: string;
  day: number;
  wrongCount: number;
  lastWrongAt: string;
}

export type StudyMode = "flashcard" | "typing" | "matching";
export type FlashcardDirection = "en-to-ko" | "ko-to-en" | "random";

