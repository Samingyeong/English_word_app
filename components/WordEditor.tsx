"use client";

import { useState } from "react";
import { Word } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Plus, X, Save } from "lucide-react";

interface WordEditorProps {
  words: Word[];
  onSave: (words: Word[], name?: string) => void;
  onCancel: () => void;
  isNew?: boolean;
  initialName?: string;
}

export function WordEditor({ words: initialWords, onSave, onCancel, isNew = false, initialName = "" }: WordEditorProps) {
  const [words, setWords] = useState<Word[]>(initialWords.length > 0 ? initialWords : [{ id: `word-${Date.now()}-0`, english: "", korean: "" }]);
  const [wordSetName, setWordSetName] = useState(initialName);

  const addWord = () => {
    setWords([...words, { id: `word-${Date.now()}-${words.length}`, english: "", korean: "" }]);
  };

  const removeWord = (id: string) => {
    setWords(words.filter((w) => w.id !== id));
  };

  const updateWord = (id: string, field: "english" | "korean", value: string) => {
    setWords(words.map((w) => (w.id === id ? { ...w, [field]: value } : w)));
  };

  const handleSave = () => {
    const validWords = words.filter((w) => w.english.trim() && w.korean.trim());
    if (validWords.length === 0) {
      alert("최소 1개 이상의 단어를 입력해주세요.");
      return;
    }
    if (isNew && !wordSetName.trim()) {
      alert("단어장 이름을 입력해주세요.");
      return;
    }
    onSave(validWords, isNew ? wordSetName.trim() : undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">단어 편집</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} size="sm">
            취소
          </Button>
          <Button onClick={handleSave} size="sm">
            <Save className="mr-2 h-4 w-4" />
            저장
          </Button>
        </div>
      </div>

      {isNew && (
        <Card>
          <CardContent className="p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              단어장 이름
            </label>
            <input
              type="text"
              value={wordSetName}
              onChange={(e) => setWordSetName(e.target.value)}
              placeholder="예: Day 1 단어장, 토익 단어장 등"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            {words.map((word, index) => (
              <div key={word.id} className="flex gap-2 items-center">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={word.english}
                    onChange={(e) => updateWord(word.id, "english", e.target.value)}
                    placeholder="영어 단어"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                  <input
                    type="text"
                    value={word.korean}
                    onChange={(e) => updateWord(word.id, "korean", e.target.value)}
                    placeholder="한글 뜻"
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  />
                </div>
                <button
                  onClick={() => removeWord(word.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="단어 삭제"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>

          <Button
            onClick={addWord}
            variant="outline"
            className="mt-4 w-full"
            size="sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            단어 추가
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

