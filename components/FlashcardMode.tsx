"use client";

import { useState, useEffect, useMemo } from "react";
import { Word, FlashcardDirection } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { RotateCw, Check, X } from "lucide-react";
import { addWrongAnswer } from "@/lib/storage";

interface FlashcardModeProps {
  words: Word[];
  day: number;
  direction: FlashcardDirection;
  onComplete: (correctCount: number, totalCount: number) => void;
}

export function FlashcardMode({
  words,
  day,
  direction,
  onComplete,
}: FlashcardModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  // 학습 방향에 따라 앞면/뒷면 결정
  // 랜덤 모드일 경우 각 카드마다 랜덤으로 결정 (useState로 저장)
  const [cardDirections, setCardDirections] = useState<boolean[]>(() => {
    // 초기값 설정: 모든 단어에 대해 방향 결정
    if (words.length > 0) {
      return words.map(() => {
        if (direction === "random") {
          return Math.random() > 0.5;
        }
        return direction === "en-to-ko";
      });
    }
    return [];
  });

  // 카드 방향 초기화 (단어가 변경될 때마다)
  useEffect(() => {
    if (cardDirections.length !== words.length && words.length > 0) {
      const directions = words.map(() => {
        if (direction === "random") {
          return Math.random() > 0.5;
        }
        return direction === "en-to-ko";
      });
      setCardDirections(directions);
    }
  }, [words.length, direction]);

  // 현재 카드의 방향을 메모이제이션하여 안정적으로 유지
  const showEnglishFirst = useMemo(() => {
    if (direction === "random") {
      if (cardDirections.length > currentIndex) {
        return cardDirections[currentIndex];
      }
      // 방향이 아직 초기화되지 않았으면 기본값 반환
      return true;
    }
    return direction === "en-to-ko";
  }, [direction, cardDirections, currentIndex]);

  if (isCompleted) {
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            학습 완료! 🎉
          </h2>
          <p className="text-xl font-semibold text-gray-700">
            정답률: {Math.round((correctCount / words.length) * 100)}% (
            {correctCount}/{words.length})
          </p>
        </div>
        <Button
          onClick={() => onComplete(correctCount, words.length)}
          size="lg"
        >
          확인
        </Button>
      </div>
    );
  }

  const handleCorrect = () => {
    setCorrectCount((prev) => prev + 1);
    nextCard();
  };

  const handleWrong = () => {
    if (currentWord) {
      addWrongAnswer(currentWord.id, currentWord.english, currentWord.korean, day);
    }
    nextCard();
  };

  const nextCard = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      // 랜덤 모드일 경우 다음 카드 방향도 랜덤으로 결정
      if (direction === "random") {
        // 이미 getCardSides에서 처리됨
      }
    } else {
      setIsCompleted(true);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-base font-semibold text-gray-700 whitespace-nowrap">
          {currentIndex + 1} / {words.length}
        </span>
        <div className="h-3 w-full max-w-xs rounded-full bg-gray-300">
          <div
            className="h-full rounded-full bg-blue-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="min-h-[400px] flex items-center justify-center">
        <div
          className="relative w-full max-w-2xl h-[400px]"
          style={{ perspective: "1000px" }}
        >
          <div
            className="relative w-full h-full transition-transform duration-500"
            style={{
              transformStyle: "preserve-3d",
              transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            }}
          >
            {/* 앞면 */}
            {showEnglishFirst ? (
              // 영어 → 한글: 앞면 영어 (파랑 배경 + 하양 글자)
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600 rounded-lg"
                style={{ 
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)",
                }}
              >
                <p className="text-base font-semibold text-white mb-6">영어</p>
                <h2 className="text-5xl font-bold text-white mb-8">
                  {currentWord?.english}
                </h2>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="mt-8 flex items-center gap-2 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 rounded-lg transition-colors border border-white"
                >
                  <RotateCw className="h-5 w-5" />
                  뒤집기
                </button>
              </div>
            ) : (
              // 한글 → 영어: 앞면 한글 (하양 배경 + 검정 글자)
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg"
                style={{ 
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)",
                }}
              >
                <p className="text-base font-semibold text-gray-600 mb-6">한글</p>
                <h2 className="text-5xl font-bold text-gray-900 mb-8">
                  {currentWord?.korean}
                </h2>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="mt-8 flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  <RotateCw className="h-5 w-5" />
                  뒤집기
                </button>
              </div>
            )}

            {/* 뒷면 */}
            {showEnglishFirst ? (
              // 영어 → 한글: 뒷면 한글 (하양 배경 + 검정 글자)
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-lg"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-base font-semibold text-gray-600 mb-6">한글</p>
                <h2 className="text-5xl font-bold text-gray-900 mb-8">
                  {currentWord?.korean}
                </h2>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="mt-8 flex items-center gap-2 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300"
                >
                  <RotateCw className="h-5 w-5" />
                  뒤집기
                </button>
              </div>
            ) : (
              // 한글 → 영어: 뒷면 영어 (파랑 배경 + 하양 글자)
              <div
                className="absolute inset-0 flex flex-col items-center justify-center bg-blue-600 rounded-lg"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <p className="text-base font-semibold text-white mb-6">영어</p>
                <h2 className="text-5xl font-bold text-white mb-8">
                  {currentWord?.english}
                </h2>
                <button
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="mt-8 flex items-center gap-2 px-4 py-2 text-base font-medium text-white hover:bg-blue-700 rounded-lg transition-colors border border-white"
                >
                  <RotateCw className="h-5 w-5" />
                  뒤집기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleWrong}
          size="lg"
        >
          <X className="mr-2 h-5 w-5" />
          틀렸어요
        </Button>
        <Button className="flex-1" onClick={handleCorrect} size="lg">
          <Check className="mr-2 h-5 w-5" />
          맞았어요
        </Button>
      </div>
    </div>
  );
}

