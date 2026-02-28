"use client";

import { useState, useEffect, useMemo } from "react";
import { Word, FlashcardDirection } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Check, X } from "lucide-react";
import { addWrongAnswer } from "@/lib/storage";

interface TypingModeProps {
  words: Word[];
  day: number;
  direction: FlashcardDirection;
  onComplete: (correctCount: number, totalCount: number) => void;
  onWordCorrect?: (wordId: string) => void;
}

export function TypingMode({ words, day, direction, onComplete, onWordCorrect }: TypingModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [correctCount, setCorrectCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

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

  // 카드 방향 초기화
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
  }, [words.length, words, direction, cardDirections.length]);

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

  useEffect(() => {
    setInput("");
    setShowResult(false);
  }, [currentIndex]);

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

  const handleSubmit = () => {
    if (!currentWord) return;

    let userAnswer: string;
    let correctAnswers: string[];
    let isAnswerCorrect: boolean;

    if (showEnglishFirst) {
      // 영어 → 한글: 영어 단어를 보고 한글 뜻 입력
      userAnswer = input.trim();
      // 쉼표로 구분된 여러 뜻을 배열로 변환
      correctAnswers = currentWord.korean
        .split(",")
        .map((meaning) => meaning.trim())
        .filter((meaning) => meaning.length > 0);
      // 여러 뜻 중 하나라도 일치하면 정답
      isAnswerCorrect = correctAnswers.some(
        (answer) => answer === userAnswer
      );
    } else {
      // 한글 → 영어: 한글 뜻을 보고 영어 단어 입력
      userAnswer = input.trim().toLowerCase();
      const correctAnswer = currentWord.english.trim().toLowerCase();
      isAnswerCorrect = userAnswer === correctAnswer;
    }

    setIsCorrect(isAnswerCorrect);
    setShowResult(true);

    if (isAnswerCorrect) {
      setCorrectCount((prev) => prev + 1);
      onWordCorrect?.(currentWord.id);
    } else {
      addWrongAnswer(
        currentWord.id,
        currentWord.english,
        currentWord.korean,
        day
      );
    }
  };

  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (showResult) {
        handleNext();
      } else {
        handleSubmit();
      }
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

      <Card className="min-h-[300px]">
        <CardContent className="flex h-full min-h-[300px] flex-col items-center justify-center p-8 space-y-6">
          <div className="text-center">
            {showEnglishFirst ? (
              <>
                <p className="text-base font-medium text-gray-700 mb-6">영어 단어를 보고 한글 뜻을 입력하세요</p>
                <h2 className="text-6xl font-bold text-gray-900 mb-8">
                  {currentWord?.english}
                </h2>
              </>
            ) : (
              <>
                <p className="text-base font-medium text-gray-700 mb-6">한글 뜻을 보고 영어 단어를 입력하세요</p>
                <h2 className="text-6xl font-bold text-gray-900 mb-8">
                  {currentWord?.korean}
                </h2>
              </>
            )}
          </div>

          <div className="w-full max-w-md space-y-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={showResult}
              placeholder={showEnglishFirst ? "한글 뜻을 입력하세요" : "영어 단어를 입력하세요"}
              className="w-full rounded-lg border-3 border-gray-400 bg-white px-6 py-4 text-center text-2xl font-semibold text-gray-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500 shadow-sm"
              autoFocus
            />

            {showResult && (
              <div
                className={`rounded-lg p-5 text-center border-2 ${
                  isCorrect
                    ? "bg-green-100 text-green-900 border-green-400"
                    : "bg-red-100 text-red-900 border-red-400"
                }`}
              >
                {isCorrect ? (
                  <div className="flex items-center justify-center gap-2">
                    <Check className="h-6 w-6" />
                    <span className="text-lg font-bold">정답입니다!</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <X className="h-6 w-6" />
                      <span className="text-lg font-bold">틀렸습니다</span>
                    </div>
                    <p className="text-base">
                      정답: <span className="font-bold text-xl">
                        {showEnglishFirst 
                          ? currentWord?.korean 
                          : currentWord?.english}
                      </span>
                      {showEnglishFirst && currentWord?.korean.includes(",") && (
                        <span className="block text-sm text-gray-600 mt-1">
                          (여러 뜻 중 하나만 입력해도 정답입니다)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        {showResult ? (
          <Button className="flex-1" onClick={handleNext} size="lg">
            다음 문제
          </Button>
        ) : (
          <Button className="flex-1" onClick={handleSubmit} size="lg">
            확인
          </Button>
        )}
      </div>
    </div>
  );
}

