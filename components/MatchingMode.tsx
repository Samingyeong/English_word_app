"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Word } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { addWrongAnswer } from "@/lib/storage";
import { CheckCircle2, XCircle } from "lucide-react";

interface MatchingModeProps {
  words: Word[];
  day: number;
  onComplete: (correctCount: number, totalCount: number) => void;
  onWordCorrect?: (wordId: string) => void;
}

interface CardItem {
  id: string;
  text: string;
  wordId: string;
  type: "korean" | "english";
}

export function MatchingMode({
  words,
  day,
  onComplete,
  onWordCorrect,
}: MatchingModeProps) {
  const [displayWords, setDisplayWords] = useState<Word[]>([]);
  const [selectedKorean, setSelectedKorean] = useState<string | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState<"correct" | "wrong" | null>(null);
  const queueRef = useRef<Word[]>([]);
  const wrongWordIdsRef = useRef<Set<string>>(new Set());

  // 초기화
  useEffect(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const initial = shuffled.slice(0, 4);
    queueRef.current = shuffled.slice(4);
    setDisplayWords(initial);
    setSelectedKorean(null);
    setSelectedEnglish(null);
    setCorrectCount(0);
    setWrongCount(0);
    setIsCompleted(false);
    wrongWordIdsRef.current = new Set();
  }, [words]);

  // 현재 4쌍 - 항상 같은 displayWords에서, 순서만 섞음
  const currentCards = useMemo(() => {
    const koreanCards: CardItem[] = displayWords
      .map((w) => ({
        id: `ko-${w.id}`,
        text: w.korean,
        wordId: w.id,
        type: "korean" as const,
      }))
      .sort(() => Math.random() - 0.5);
    const englishCards: CardItem[] = displayWords
      .map((w) => ({
        id: `en-${w.id}`,
        text: w.english,
        wordId: w.id,
        type: "english" as const,
      }))
      .sort(() => Math.random() - 0.5);
    return { koreanCards, englishCards };
  }, [displayWords]);

  const allCardsMap = useMemo(() => {
    const map = new Map<string, CardItem>();
    displayWords.forEach((word) => {
      map.set(`ko-${word.id}`, {
        id: `ko-${word.id}`,
        text: word.korean,
        wordId: word.id,
        type: "korean",
      });
      map.set(`en-${word.id}`, {
        id: `en-${word.id}`,
        text: word.english,
        wordId: word.id,
        type: "english",
      });
    });
    return map;
  }, [displayWords]);

  // 매칭 확인
  useEffect(() => {
    if (!selectedKorean || !selectedEnglish) return;
    const koreanCard = allCardsMap.get(selectedKorean);
    const englishCard = allCardsMap.get(selectedEnglish);
    if (!koreanCard || !englishCard) return;

    if (koreanCard.wordId === englishCard.wordId) {
      setShowResult("correct");
      setCorrectCount((prev) => prev + 1);
      onWordCorrect?.(koreanCard.wordId);

      // 짧은 피드백(0.5초) 후 듀오링고처럼: 맞춘 쌍 자리에 큐에서 새 단어로 교체
      setTimeout(() => {
        setShowResult(null);
        setSelectedKorean(null);
        setSelectedEnglish(null);

        const next = queueRef.current.shift();
        setDisplayWords((prev) => {
          const nextList = prev
            .filter((w) => w.id !== koreanCard.wordId)
            .concat(next ? [next] : []);
          if (nextList.length === 0) {
            setTimeout(() => setIsCompleted(true), 0);
          }
          return nextList;
        });
      }, 500);
    } else {
      setShowResult("wrong");
      if (!wrongWordIdsRef.current.has(koreanCard.wordId)) {
        wrongWordIdsRef.current.add(koreanCard.wordId);
        setWrongCount((prev) => prev + 1);
        const word = words.find((w) => w.id === koreanCard.wordId);
        if (word) addWrongAnswer(word.id, word.english, word.korean, day);
      }
      setTimeout(() => {
        setSelectedKorean(null);
        setSelectedEnglish(null);
        setShowResult(null);
      }, 800);
    }
  }, [selectedKorean, selectedEnglish, allCardsMap, words, day]);

  const handleCardClick = (card: CardItem) => {
    if (showResult) return;
    if (card.type === "korean") {
      setSelectedKorean((prev) => (prev === card.id ? null : card.id));
    } else {
      setSelectedEnglish((prev) => (prev === card.id ? null : card.id));
    }
  };

  if (isCompleted) {
    const totalCount = words.length;
    // 정답 = 전체 - 오답(한 번이라도 틀린 단어 수), 정답률과 오답 개수 일치하도록 재계산
    const displayCorrect = Math.max(0, totalCount - wrongCount);
    const accuracy =
      totalCount > 0 ? Math.round((displayCorrect / totalCount) * 100) : 0;
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">학습 완료! 🎉</h2>
          <p className="text-xl font-semibold text-gray-300 mb-2">
            정답률: {accuracy}% ({displayCorrect}/{totalCount})
          </p>
          {wrongCount > 0 && (
            <p className="text-lg text-red-600">오답: {wrongCount}개</p>
          )}
        </div>
        <Button onClick={() => onComplete(displayCorrect, totalCount)} size="lg">
          확인
        </Button>
      </div>
    );
  }

  const progress =
    words.length > 0 ? (correctCount / words.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-gray-300 whitespace-nowrap">
          {correctCount} / {words.length}
        </span>
        <div className="h-3 w-full max-w-xs rounded-full bg-gray-300">
          <div
            className="h-full rounded-full bg-green-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 min-h-[500px]">
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-center text-white mb-4">
            한국어
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {currentCards.koreanCards.map((card) => {
              const isSelected = selectedKorean === card.id;
              const isCorrectMatch =
                isSelected &&
                selectedEnglish &&
                allCardsMap.get(selectedEnglish)?.wordId === card.wordId;
              return (
                <Card
                  key={card.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected || isCorrectMatch
                      ? "ring-4 ring-blue-500 scale-[1.02]"
                      : "hover:scale-[1.02] hover:shadow-lg"
                  } ${
                    showResult === "correct" && isCorrectMatch
                      ? "bg-green-100 border-green-500"
                      : showResult === "wrong" && isSelected
                      ? "bg-red-100 border-red-500"
                      : ""
                  }`}
                  onClick={() => handleCardClick(card)}
                >
                  <CardContent className="p-6">
                    <p className="text-2xl font-bold text-gray-900">
                      {card.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-center text-white mb-4">
            영어
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {currentCards.englishCards.map((card) => {
              const isSelected = selectedEnglish === card.id;
              const isCorrectMatch =
                isSelected &&
                selectedKorean &&
                allCardsMap.get(selectedKorean)?.wordId === card.wordId;
              return (
                <Card
                  key={card.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    isSelected || isCorrectMatch
                      ? "ring-4 ring-blue-500 scale-[1.02]"
                      : "hover:scale-[1.02] hover:shadow-lg"
                  } ${
                    showResult === "correct" && isCorrectMatch
                      ? "bg-green-100 border-green-500"
                      : showResult === "wrong" && isSelected
                      ? "bg-red-100 border-red-500"
                      : ""
                  }`}
                  onClick={() => handleCardClick(card)}
                >
                  <CardContent className="p-6">
                    <p className="text-2xl font-bold text-gray-900">
                      {card.text}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {showResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center shadow-xl">
            {showResult === "correct" ? (
              <>
                <CheckCircle2 className="h-5 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-green-600">정답!</p>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-16 text-red-600 mx-auto mb-4" />
                <p className="text-2xl font-bold text-red-600">오답</p>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-center gap-2 text-lg font-semibold">
        <span className="text-green-600">정답: {correctCount}</span>
        <span className="text-red-600">오답: {wrongCount}</span>
      </div>
    </div>
  );
}
