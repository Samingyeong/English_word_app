"use client";

import { useState, useEffect } from "react";
import { WordSet, Word, WrongAnswer, StudyMode, FlashcardDirection } from "@/lib/types";
import {
  loadWordSets,
  saveWordSets,
  loadWrongAnswers,
  removeWordSet,
  removeWrongAnswer,
  hasLoadedWordAssets,
  setWordAssetsLoaded,
} from "@/lib/storage";
import { parseExcelFile } from "@/lib/excelParser";
import { parsePdfFile } from "@/lib/pdfParser";
import { parseCsvFile } from "@/lib/csvParser";
import { exportWordsToExcel } from "@/lib/excelExport";
import { DayCard } from "@/components/DayCard";
import { FlashcardMode } from "@/components/FlashcardMode";
import { TypingMode } from "@/components/TypingMode";
import { MatchingMode } from "@/components/MatchingMode";
import { WrongAnswersList } from "@/components/WrongAnswersList";
import { WordEditor } from "@/components/WordEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, ArrowLeft, BookOpen, Plus, Edit, Download } from "lucide-react";

export default function Home() {
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [selectedWordSet, setSelectedWordSet] = useState<WordSet | null>(null);
  const [studyMode, setStudyMode] = useState<StudyMode | null>(null);
  const [flashcardDirection, setFlashcardDirection] = useState<FlashcardDirection>("en-to-ko");
  const [isUploading, setIsUploading] = useState(false);
  const [isCreatingWordSet, setIsCreatingWordSet] = useState(false);
  const [isEditingWordSet, setIsEditingWordSet] = useState(false);
  const [isLoadingWordAssets, setIsLoadingWordAssets] = useState(false);
  const [hasLoadedWordAssetsOnce, setHasLoadedWordAssetsOnce] = useState(false);

  useEffect(() => {
    setWordSets(loadWordSets());
    setWrongAnswers(loadWrongAnswers());
    setHasLoadedWordAssetsOnce(hasLoadedWordAssets());
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isCsv = name.endsWith(".csv");
    const isExcel = /\.(xlsx|xls)$/.test(name);
    if (!isPdf && !isCsv && !isExcel) {
      alert("엑셀(.xlsx, .xls), CSV(.csv) 또는 PDF(.pdf) 파일만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const words = isPdf
        ? await parsePdfFile(file)
        : isCsv
        ? await parseCsvFile(file)
        : await parseExcelFile(file);
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
      alert(`Day ${nextDay} 단어장이 추가되었습니다! (${words.length}개 단어)${isPdf ? " [PDF]" : isCsv ? " [CSV]" : ""}`);
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

  const handleLoadWordAssets = async () => {
    setIsLoadingWordAssets(true);
    try {
      const res = await fetch("/word_assets_word_sets.json");
      if (!res.ok) {
        alert("word_assets 단어장 파일을 찾을 수 없습니다. 먼저 npm run build:word-sets 를 실행하세요.");
        return;
      }
      const { wordSets: loaded } = (await res.json()) as { wordSets: WordSet[] };
      if (!loaded?.length) {
        alert("불러올 단어장이 없습니다.");
        return;
      }
      const existing = loadWordSets();
      const maxDay = existing.length > 0 ? Math.max(...existing.map((s) => s.day)) : 0;
      const withNewDays = loaded.map((ws, i) => ({
        ...ws,
        id: ws.id || `wordset-assets-${Date.now()}-${i}`,
        day: maxDay + i + 1,
        name: ws.name || `단어장 ${maxDay + i + 1}`,
        words: ws.words.map((w, j) => ({
          ...w,
          id: w.id || `word-${maxDay + i + 1}-${j}-${Date.now()}`,
        })),
      }));
      const merged = [...existing, ...withNewDays];
      saveWordSets(merged);
      setWordSets(merged);
      setWordAssetsLoaded();
      setHasLoadedWordAssetsOnce(true);
      alert(`${withNewDays.length}개 단어장을 불러왔습니다.`);
    } catch (e) {
      alert("불러오기 실패: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setIsLoadingWordAssets(false);
    }
  };

  const handleDayClick = (wordSet: WordSet) => {
    setSelectedWordSet(wordSet);
    setStudyMode(null);
  };

  const handleWordCorrect = (wordId: string) => {
    removeWrongAnswer(wordId);
    setWrongAnswers(loadWrongAnswers());
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

  const handleRenameWordSet = (wordSetId: string, newName: string) => {
    const existingSets = loadWordSets();
    const updatedSets = existingSets.map((ws) =>
      ws.id === wordSetId ? { ...ws, name: newName } : ws
    );
    saveWordSets(updatedSets);
    setWordSets(updatedSets);
    // 선택된 단어장이 변경된 경우 업데이트
    if (selectedWordSet && selectedWordSet.id === wordSetId) {
      setSelectedWordSet({ ...selectedWordSet, name: newName });
    }
    alert("단어장 이름이 변경되었습니다!");
  };

  const handleCreateWordSet = (words: Word[], name?: string) => {
    const existingSets = loadWordSets();
    const nextDay = existingSets.length > 0 
      ? Math.max(...existingSets.map(s => s.day)) + 1 
      : 1;

    const newWordSet: WordSet = {
      id: `wordset-${Date.now()}`,
      day: nextDay,
      name: name || `Day ${nextDay} 단어장`,
      words,
      createdAt: new Date().toISOString(),
    };

    const updatedSets = [...existingSets, newWordSet];
    saveWordSets(updatedSets);
    setWordSets(updatedSets);
    setIsCreatingWordSet(false);
    alert(`${newWordSet.name}이(가) 생성되었습니다! (${words.length}개 단어)`);
  };

  const handleEditWordSet = (words: Word[]) => {
    if (!selectedWordSet) return;

    const updatedWordSet: WordSet = {
      ...selectedWordSet,
      words,
    };

    const existingSets = loadWordSets();
    const updatedSets = existingSets.map((ws) =>
      ws.id === selectedWordSet.id ? updatedWordSet : ws
    );

    saveWordSets(updatedSets);
    setWordSets(updatedSets);
    setSelectedWordSet(updatedWordSet);
    setIsEditingWordSet(false);
    alert(`단어장이 수정되었습니다! (${words.length}개 단어)`);
  };

  // 단어장 편집 화면
  if (isEditingWordSet && selectedWordSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => {
            setIsEditingWordSet(false);
            setSelectedWordSet(null);
          }}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
        <WordEditor
          words={selectedWordSet.words}
          onSave={handleEditWordSet}
          onCancel={() => {
            setIsEditingWordSet(false);
            setSelectedWordSet(null);
          }}
        />
      </div>
    );
  }

  // 새 단어장 생성 화면
  if (isCreatingWordSet) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => setIsCreatingWordSet(false)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          뒤로가기
        </Button>
        <WordEditor
          words={[]}
          onSave={handleCreateWordSet}
          onCancel={() => setIsCreatingWordSet(false)}
          isNew={true}
        />
      </div>
    );
  }

  // 학습 모드 선택 화면
  if (selectedWordSet && !studyMode) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedWordSet(null)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            뒤로가기
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                if (selectedWordSet) {
                  await exportWordsToExcel(selectedWordSet.words, `${selectedWordSet.name}.xlsx`);
                }
              }}
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              엑셀 다운로드
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditingWordSet(true)}
              size="sm"
            >
              <Edit className="mr-2 h-4 w-4" />
              편집
            </Button>
          </div>
        </div>

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

          <Card
            className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg"
            onClick={() => setStudyMode("matching")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">매칭 모드</h3>
                  <p className="text-sm text-gray-500">
                    한국어와 영어를 매칭해서 없애요
                  </p>
                </div>
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
            onWordCorrect={selectedWordSet.id === "wrong-answers" ? handleWordCorrect : undefined}
          />
        )}

        {studyMode === "typing" && (
          <TypingMode
            words={shuffleArray(selectedWordSet.words)}
            day={selectedWordSet.day}
            direction={flashcardDirection}
            onComplete={handleStudyComplete}
            onWordCorrect={selectedWordSet.id === "wrong-answers" ? handleWordCorrect : undefined}
          />
        )}

        {studyMode === "matching" && (
          <MatchingMode
            words={shuffleArray(selectedWordSet.words)}
            day={selectedWordSet.day}
            onComplete={handleStudyComplete}
            onWordCorrect={selectedWordSet.id === "wrong-answers" ? handleWordCorrect : undefined}
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
        <p className="text-lg font-medium text-gray-700">엑셀 또는 PDF 단어장을 업로드하고 공부해보세요!</p>
      </div>

      {/* 파일 업로드 */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 transition-colors hover:border-blue-400">
            <Upload className="mb-4 h-12 w-12 text-gray-400" />
            <span className="mb-2 text-xl font-bold text-gray-900">
              엑셀 / CSV / PDF 업로드
            </span>
            <span className="text-base font-medium text-gray-700">
              엑셀·CSV: 1열 영어, 2열 한글 · PDF: 번호. 영단어 한글뜻 형식
            </span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.pdf"
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 className="text-3xl font-bold text-gray-900">단어장 목록</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadWordAssets}
              disabled={isLoadingWordAssets || hasLoadedWordAssetsOnce}
            >
              {isLoadingWordAssets
                ? "불러오는 중…"
                : hasLoadedWordAssetsOnce
                  ? "이미 불러옴"
                  : "word_assets 단어장 불러오기"}
            </Button>
            <Button
              onClick={() => setIsCreatingWordSet(true)}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              새 단어장 만들기
            </Button>
          </div>
        </div>
        {wordSets.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {wordSets.map((wordSet) => (
              <DayCard
                key={wordSet.id}
                wordSet={wordSet}
                onClick={() => handleDayClick(wordSet)}
                onDelete={handleDeleteWordSet}
                onRename={handleRenameWordSet}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">아직 단어장이 없습니다.</p>
              <Button onClick={() => setIsCreatingWordSet(true)}>
                <Plus className="mr-2 h-4 w-4" />
                첫 번째 단어장 만들기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

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
