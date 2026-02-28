"use client";

import { useState, useEffect } from "react";
import { WordSet, Word, WrongAnswer, StudyMode, FlashcardDirection } from "@/lib/types";
import {
  loadWordSets,
  saveWordSets,
  loadWrongAnswers,
  removeWordSet,
  removeWrongAnswer,
  clearWordAssetsLoaded,
} from "@/lib/storage";
import { parseExcelFile } from "@/lib/excelParser";
import { parsePdfFile } from "@/lib/pdfParser";
import { parseCsvFile } from "@/lib/csvParser";
import { exportWordsToExcel } from "@/lib/excelExport";
import { DayCard } from "@/components/DayCard";
import { CrewmateIcon } from "@/components/CrewmateIcon";
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
  const [isWordAssetsSelectorOpen, setIsWordAssetsSelectorOpen] = useState(false);
  const [wordAssetsList, setWordAssetsList] = useState<WordSet[] | null>(null);
  const [selectedAssetKeysForLoad, setSelectedAssetKeysForLoad] = useState<Set<string>>(new Set());
  const [isMultiDeleteMode, setIsMultiDeleteMode] = useState(false);
  const [selectedWordSetIdsForDelete, setSelectedWordSetIdsForDelete] = useState<Set<string>>(new Set());

  useEffect(() => {
    setWordSets(loadWordSets());
    setWrongAnswers(loadWrongAnswers());
  }, []);

  // word_assets 선택 모달 열릴 때 JSON 불러오기
  useEffect(() => {
    if (!isWordAssetsSelectorOpen) return;
    let cancelled = false;
    setWordAssetsList(null);
    setSelectedAssetKeysForLoad(new Set());
    (async () => {
      try {
        const res = await fetch("/word_assets_word_sets.json");
        if (!res.ok || cancelled) return;
        const { wordSets: loaded } = (await res.json()) as { wordSets: WordSet[] };
        if (!cancelled && loaded?.length) setWordAssetsList(loaded);
      } catch {
        if (!cancelled) setWordAssetsList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isWordAssetsSelectorOpen]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const isPdf = name.endsWith(".pdf");
    const isCsv = name.endsWith(".csv");
    const isExcel = /\.(xlsx|xls)$/.test(name);
    if (!isPdf && !isCsv && !isExcel) {
      alert("엑셀(.xlsx, .xls), CSV(.csv) 파일만 업로드할 수 있습니다.");
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

  const handleOpenWordAssetsSelector = () => {
    setIsWordAssetsSelectorOpen(true);
  };

  const handleConfirmWordAssetsSelection = () => {
    if (!wordAssetsList?.length || selectedAssetKeysForLoad.size === 0) {
      alert("불러올 단어장을 하나 이상 선택해 주세요.");
      return;
    }
    const toAdd = wordAssetsList.filter((ws) => {
      const key = ws.assetKey ?? ws.id;
      return selectedAssetKeysForLoad.has(key);
    });
    if (toAdd.length === 0) {
      alert("선택한 단어장을 불러올 수 없습니다.");
      return;
    }
    const existing = loadWordSets();
    const maxDay = existing.length > 0 ? Math.max(...existing.map((s) => s.day)) : 0;
    const withNewDays = toAdd.map((ws, i) => ({
      ...ws,
      id: ws.id || `wordset-assets-${Date.now()}-${i}`,
      day: maxDay + i + 1,
      name: ws.name || `단어장 ${maxDay + i + 1}`,
      assetKey: ws.assetKey,
      words: ws.words.map((w, j) => ({
        ...w,
        id: w.id || `word-${maxDay + i + 1}-${j}-${Date.now()}`,
      })),
    }));
    const merged = [...existing, ...withNewDays];
    saveWordSets(merged);
    setWordSets(merged);
    setIsWordAssetsSelectorOpen(false);
    setWordAssetsList(null);
    setSelectedAssetKeysForLoad(new Set());
    alert(`${withNewDays.length}개 단어장을 불러왔습니다.`);
  };

  const toggleAssetKeySelection = (assetKey: string) => {
    setSelectedAssetKeysForLoad((prev) => {
      const next = new Set(prev);
      if (next.has(assetKey)) next.delete(assetKey);
      else next.add(assetKey);
      return next;
    });
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
    if (updatedSets.length === 0) {
      clearWordAssetsLoaded();
    }
    // 남은 단어장에 해당하는 오답만 유지
    const updatedWrongAnswers = wrongAnswers.filter((wa) =>
      updatedSets.some((ws) => ws.day === wa.day)
    );
    setWrongAnswers(updatedWrongAnswers);
    if (typeof window !== "undefined") {
      localStorage.setItem("wrong-answers", JSON.stringify(updatedWrongAnswers));
    }
  };

  const toggleWordSetForDelete = (wordSetId: string) => {
    setSelectedWordSetIdsForDelete((prev) => {
      const next = new Set(prev);
      if (next.has(wordSetId)) next.delete(wordSetId);
      else next.add(wordSetId);
      return next;
    });
  };

  const handleDeleteSelectedWordSets = () => {
    const count = selectedWordSetIdsForDelete.size;
    if (count === 0) return;
    if (!confirm(`선택한 ${count}개 단어장을 삭제하시겠습니까?`)) return;
    selectedWordSetIdsForDelete.forEach((id) => removeWordSet(id));
    const updatedSets = loadWordSets();
    setWordSets(updatedSets);
    if (updatedSets.length === 0) {
      clearWordAssetsLoaded();
    }
    const updatedWrongAnswers = wrongAnswers.filter((wa) =>
      updatedSets.some((ws) => ws.day === wa.day)
    );
    setWrongAnswers(updatedWrongAnswers);
    if (typeof window !== "undefined") {
      localStorage.setItem("wrong-answers", JSON.stringify(updatedWrongAnswers));
    }
    setSelectedWordSetIdsForDelete(new Set());
    setIsMultiDeleteMode(false);
    alert(`${count}개 단어장이 삭제되었습니다.`);
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
          <h1 className="text-4xl font-bold text-white mb-3">
            {selectedWordSet.name}
          </h1>
          <p className="text-lg font-semibold text-gray-300">
            {selectedWordSet.words.length}개 단어
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-md mx-auto">
          <Card
            className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[6px_6px_0_0_#000] border-2 border-crewmate-cyan"
            onClick={() => setStudyMode("flashcard")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center">
                  <CrewmateIcon color="cyan" size={48} />
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-base font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-crewmate-cyan focus:border-crewmate-cyan"
                >
                  <option value="en-to-ko">영어 → 한글</option>
                  <option value="ko-to-en">한글 → 영어</option>
                  <option value="random">랜덤</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[6px_6px_0_0_#000] border-2 border-crewmate-lime"
            onClick={() => setStudyMode("typing")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center">
                  <CrewmateIcon color="lime" size={48} />
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
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-xl text-base font-medium text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-crewmate-lime focus:border-crewmate-lime"
                >
                  <option value="en-to-ko">영어 → 한글</option>
                  <option value="ko-to-en">한글 → 영어</option>
                  <option value="random">랜덤</option>
                </select>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[6px_6px_0_0_#000] border-2 border-crewmate-orange"
            onClick={() => setStudyMode("matching")}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex h-12 w-12 items-center justify-center">
                  <CrewmateIcon color="orange" size={48} />
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

  // 메인 화면 (퀴즐렛 구성 + 어몽어스 분위기)
  return (
    <div className="min-h-screen bg-bg-space">
      {/* 상단 헤더 (어몽어스 톤) */}
      <header className="sticky top-0 z-10 bg-bg-space/95 border-b border-white/10 backdrop-blur">
        <div className="container mx-auto px-4 py-3 max-w-5xl flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-white">
            WORD IMPOSTER
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenWordAssetsSelector}
              className="border-crewmate-cyan/50 text-gray-200 hover:bg-crewmate-cyan/20 hover:border-crewmate-cyan"
            >
              word_assets 불러오기
            </Button>
            <Button
              onClick={() => setIsCreatingWordSet(true)}
              size="sm"
              className="bg-crewmate-red hover:opacity-90 text-white border-2 border-black shadow-[2px_2px_0_0_#000]"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              만들기
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* 단어장 추가 란: 한 카드 안에 업로드·만들기·불러오기 (어몽어스 컬러) */}
        <section className="mb-8">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            단어장 추가
          </h2>
          <div className="bg-bg-card rounded-xl border-2 border-black shadow-[4px_4px_0_0_#000] overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-300">
              <label className="flex flex-col items-center justify-center p-6 cursor-pointer hover:bg-crewmate-cyan/10 transition-colors">
                <Upload className="h-10 w-10 text-crewmate-cyan mb-2" />
                <span className="font-semibold text-gray-900">파일 업로드</span>
                <span className="text-xs text-gray-600 mt-0.5 text-center">엑셀·CSV·PDF</span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv,.pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                {isUploading && <span className="text-xs text-crewmate-cyan font-medium mt-1">업로드 중...</span>}
              </label>
              <button
                type="button"
                onClick={() => setIsCreatingWordSet(true)}
                className="flex flex-col items-center justify-center p-6 hover:bg-crewmate-lime/10 transition-colors"
              >
                <Plus className="h-10 w-10 text-crewmate-lime mb-2" />
                <span className="font-semibold text-gray-900">빈 단어장 만들기</span>
                <span className="text-xs text-gray-600 mt-0.5">직접 입력</span>
              </button>
              <button
                type="button"
                onClick={handleOpenWordAssetsSelector}
                className="flex flex-col items-center justify-center p-6 hover:bg-crewmate-yellow/10 transition-colors"
              >
                <BookOpen className="h-10 w-10 text-crewmate-yellow mb-2" />
                <span className="font-semibold text-gray-900">word_assets 불러오기</span>
                <span className="text-xs text-gray-600 mt-0.5">선택해서 불러오기</span>
              </button>
            </div>
          </div>
        </section>

        {/* 내 단어장 */}
        <section className="mb-8">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              내 단어장
            </h2>
            {wordSets.length > 0 &&
              (isMultiDeleteMode ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsMultiDeleteMode(false);
                      setSelectedWordSetIdsForDelete(new Set());
                    }}
                    className="border-gray-400 text-gray-700"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDeleteSelectedWordSets}
                    disabled={selectedWordSetIdsForDelete.size === 0}
                    className="bg-crewmate-red text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:opacity-90 disabled:opacity-50"
                  >
                    선택한 {selectedWordSetIdsForDelete.size}개 삭제
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsMultiDeleteMode(true)}
                  className="border-crewmate-red/50 text-gray-200 hover:bg-crewmate-red/20 hover:border-crewmate-red"
                >
                  여러 개 삭제
                </Button>
              ))}
          </div>
          {wordSets.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wordSets.map((wordSet, index) => (
                <DayCard
                  key={wordSet.id}
                  wordSet={wordSet}
                  index={index}
                  onClick={() => handleDayClick(wordSet)}
                  onDelete={handleDeleteWordSet}
                  onRename={handleRenameWordSet}
                  selectionMode={isMultiDeleteMode}
                  selected={selectedWordSetIdsForDelete.has(wordSet.id)}
                  onToggleSelect={() => toggleWordSetForDelete(wordSet.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-bg-card rounded-xl border-2 border-dashed border-crewmate-cyan/50 p-12 text-center">
              <CrewmateIcon color="yellow" size={64} className="mx-auto mb-4" />
              <p className="text-gray-600 mb-4">아직 단어장이 없어요. 크루를 모아볼까요?</p>
              <Button
                onClick={() => setIsCreatingWordSet(true)}
                className="bg-crewmate-red text-white border-2 border-black shadow-[2px_2px_0_0_#000]"
              >
                <Plus className="mr-2 h-4 w-4" />
                첫 단어장 만들기
              </Button>
            </div>
          )}
        </section>

        {/* 오답 관리 */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            오답 관리
          </h2>
          <WrongAnswersList
            wrongAnswers={wrongAnswers}
            onRemove={handleRemoveWrongAnswer}
            onStudy={handleWrongAnswerStudy}
          />
        </section>
      </main>

      {/* word_assets 단어장 선택 모달 */}
      {isWordAssetsSelectorOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setIsWordAssetsSelectorOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="word-assets-modal-title"
        >
          <Card
            className="w-full max-w-lg max-h-[85vh] flex flex-col border-2 border-black shadow-[6px_6px_0_0_#000] bg-bg-card"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="p-5 flex flex-col flex-1 min-h-0">
              <h2 id="word-assets-modal-title" className="text-lg font-bold text-gray-900 mb-4">
                word_assets 단어장 선택
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                불러올 단어장을 선택하세요. 이미 불러온 단어장은 선택할 수 없습니다.
              </p>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4 min-h-0">
                {wordAssetsList === null ? (
                  <p className="text-gray-500 py-4">불러오는 중…</p>
                ) : wordAssetsList.length === 0 ? (
                  <p className="text-gray-500 py-4">
                    단어장이 없습니다. npm run build:word-sets 를 실행하세요.
                  </p>
                ) : (
                  wordAssetsList.map((ws) => {
                    const key = ws.assetKey ?? ws.id;
                    const alreadyLoaded = Boolean(
                      key && wordSets.some((s) => s.assetKey === key)
                    );
                    return (
                      <label
                        key={key}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                          alreadyLoaded
                            ? "bg-gray-100 border-gray-300 cursor-not-allowed opacity-75"
                            : "bg-white border-gray-200 cursor-pointer hover:border-crewmate-cyan/50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedAssetKeysForLoad.has(key)}
                          disabled={alreadyLoaded}
                          onChange={() => toggleAssetKeySelection(key)}
                          className="rounded border-gray-400 text-crewmate-cyan focus:ring-crewmate-cyan"
                        />
                        <span className="font-medium text-gray-900 flex-1 truncate">
                          {ws.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {ws.words.length}개 단어
                        </span>
                        {alreadyLoaded && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">
                            이미 불러옴
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2 justify-end pt-2 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setIsWordAssetsSelectorOpen(false)}
                  className="border-gray-400"
                >
                  취소
                </Button>
                <Button
                  onClick={handleConfirmWordAssetsSelection}
                  disabled={
                    wordAssetsList === null ||
                    wordAssetsList.length === 0 ||
                    selectedAssetKeysForLoad.size === 0
                  }
                  className="bg-crewmate-cyan text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:opacity-90"
                >
                  선택한 단어장 불러오기
                  {selectedAssetKeysForLoad.size > 0 &&
                    ` (${selectedAssetKeysForLoad.size}개)`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
