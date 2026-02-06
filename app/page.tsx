"use client";

import { useState, useEffect } from "react";
import { WordSet, Word, WrongAnswer, StudyMode, FlashcardDirection } from "@/lib/types";
import {
  loadWordSets,
  saveWordSets,
  loadWrongAnswers,
  removeWordSet,
} from "@/lib/storage";
import { parseExcelFile } from "@/lib/excelParser";
import { DayCard } from "@/components/DayCard";
import { FlashcardMode } from "@/components/FlashcardMode";
import { TypingMode } from "@/components/TypingMode";
import { WrongAnswersList } from "@/components/WrongAnswersList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, ArrowLeft, BookOpen } from "lucide-react";

export default function Home() {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [selectedWordSet, setSelectedWordSet] = useState<WordSet | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null);
  const [flashcardDirection, setFlashcardDirection] = useState<FlashcardDirection>("en-to-ko");
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setWordSets(loadWordSets());
    setWrongAnswers(loadWrongAnswers());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const words = await parseExcelFile(file);
      const existingSets = loadWordSets();
      const nextDay = existingSets.length > 0 
        ? Math.max(...existingSets.map(s => s.day)) + 1 
        : 1;

      const newWordSet: WordSet = {
        id: `wordset-${Date.now()}`,
        day: nextDay,
        name: `Day ${nextDay} 단어장`,
        words,
        createdAt: new Date().toISOString(),
      };

      const updatedSets = [...existingSets, newWordSet];
      saveWordSets(updatedSets);
      setWordSets(updatedSets);
      alert(`Day ${nextDay} 단어장이 추가되었습니다! (${words.length}개 단어)`);
    } catch (error) {
      alert(`오류: ${error instanceof Error ? error.message : "알 수 없는 오류"}`);
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // 배열을 랜덤으로 섞는 함수
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleDayClick = (wordSet: WordSet) => {
    setSelectedWordSet(wordSet);
    setStudyMode(null);
  };

  const handleStudyComplete = (correctCount: number, totalCount: number) => {
    setSelectedWordSet(null);
    setStudyMode(null);
    setWrongAnswers(loadWrongAnswers());
    alert(`학습 완료! 정답률: ${Math.round((correctCount / totalCount) * 100)}%`);
  };

  const handleWrongAnswerStudy = (wrongAnswers: WrongAnswer[]) => {
    const words: Word[] = wrongAnswers.map((wa) => ({
      id: wa.wordId,
      english: wa.english,
      korean: wa.korean,
    }));

    const tempWordSet: WordSet = {
      id: "wrong-answers",
      day: 0,
      name: "오답 단어장",
      words: shuffleArray(words),
      createdAt: new Date().toISOString(),
    };

    setSelectedWordSet(tempWordSet);
    setStudyMode(null);
  };

  const handleRemoveWrongAnswer = (wordId: string) => {
    const updated = wrongAnswers.filter((wa) => wa.wordId !== wordId);
    setWrongAnswers(updated);
    // storage도 업데이트
    if (typeof window !== "undefined") {
      localStorage.setItem("wrong-answers", JSON.stringify(updated));
    }
  };

  const handleDeleteWordSet = (wordSetId: string) => {
    removeWordSet(wordSetId);
    const updatedSets = loadWordSets();
    setWordSets(updatedSets);
    // 해당 단어장의 오답도 함께 삭제
    const updatedWrongAnswers = wrongAnswers.filter(
      (wa) => !updatedSets.some((ws) => ws.id === wordSetId && ws.day === wa.day)
    );
    setWrongAnswers(updatedWrongAnswers);
    if (typeof window !== "undefined") {
      localStorage.setItem("wrong-answers", JSON.stringify(updatedWrongAnswers));
    }
  };

  // 학습 모드 선택 화면
  if (selectedWordSet && !studyMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedWordSet(null)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {selectedWordSet.name}
          </h1>
          <p className="text-lg font-semibold text-gray-700">
            {selectedWordSet.words.length}개 단어
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Card
            className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            onClick={() => setStudyMode("flashcard")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">플래시카드 모드</h3>
                  <p className="text-sm text-gray-500">
                    카드를 뒤집어가며 단어를 외워요
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학습 방향 선택
                </label>
                <select
                  value={flashcardDirection}
                  onChange={(e) => setFlashcardDirection(e.target.value as FlashcardDirection)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="en-to-ko">영어 → 한글</option>
                  <option value="ko-to-en">한글 → 영어</option>
                  <option value="random">랜덤</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            onClick={() => setStudyMode("typing")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                  <span className="text-2xl">⌨️</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">직접 입력 모드</h3>
                  <p className="text-sm text-gray-500">
                    단어를 보고 뜻을 입력해요
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200" onClick={(e) => e.stopPropagation()}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학습 방향 선택
                </label>
                <select
                  value={flashcardDirection}
                  onChange={(e) => setFlashcardDirection(e.target.value as FlashcardDirection)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-base font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="en-to-ko">영어 → 한글</option>
                  <option value="ko-to-en">한글 → 영어</option>
                  <option value="random">랜덤</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 학습 중 화면
  if (selectedWordSet && studyMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setStudyMode(null)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>

        {studyMode === "flashcard" && (
          <FlashcardMode
            words={shuffleArray(selectedWordSet.words)}
            day={selectedWordSet.day}
            direction={flashcardDirection}
            onComplete={handleStudyComplete}
          />
        )}

        {studyMode === "typing" && (
          <TypingMode
            words={shuffleArray(selectedWordSet.words)}
            day={selectedWordSet.day}
            direction={flashcardDirection}
            onComplete={handleStudyComplete}
          />
        )}
      </div>
    );
  }

  // 메인 화면
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-3">
          영단어 암기 앱 📚
        </h1>
        <p className="text-lg font-medium text-gray-700">엑셀 파일로 단어를 업로드하고 공부해보세요!</p>
      </div>

      {/* 파일 업로드 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-400">
            <Upload className="mb-4 h-12 w-12 text-gray-400" />
            <span className="mb-2 text-xl font-bold text-gray-900">
              엑셀 파일 업로드
            </span>
            <span className="text-base font-medium text-gray-700">
              엑셀 파일 형식: 첫 번째 열(영어), 두 번째 열(한글)
            </span>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="hidden"
            />
            {isUploading && (
              <p className="mt-2 text-sm text-blue-600">업로드 중...</p>
            )}
          </label>
        </CardContent>
      </Card>

      {/* Day별 단어장 목록 */}
      {wordSets.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-3xl font-bold text-gray-900">단어장 목록</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wordSets.map((wordSet) => (
              <DayCard
                key={wordSet.id}
                wordSet={wordSet}
                onClick={() => handleDayClick(wordSet)}
                onDelete={handleDeleteWordSet}
              />
            ))}
          </div>
        </div>
      )}

      {/* 오답 목록 */}
      <div className="mb-8">
        <h2 className="mb-4 text-3xl font-bold text-gray-900">오답 관리</h2>
        <WrongAnswersList
          wrongAnswers={wrongAnswers}
          onRemove={handleRemoveWrongAnswer}
          onStudy={handleWrongAnswerStudy}
        />
      </div>
    </div>
  );
}
