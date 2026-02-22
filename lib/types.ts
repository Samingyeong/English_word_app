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

