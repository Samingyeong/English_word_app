"use client";

import { WordSet } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { BookOpen, Trash2 } from "lucide-react";

interface DayCardProps {
  wordSet: WordSet;
  onClick: () => void;
  onDelete: (wordSetId: string) => void;
}

export function DayCard({ wordSet, onClick, onDelete }: DayCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // 카드 클릭 이벤트 전파 방지
    if (confirm(`Day ${wordSet.day} 단어장을 삭제하시겠습니까?`)) {
      onDelete(wordSet.id);
    }
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg relative"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-md">
            <BookOpen className="h-8 w-8" />
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900">
              Day {wordSet.day}
            </h3>
            <p className="text-sm font-medium text-gray-700">{wordSet.name}</p>
            <p className="mt-1 text-xs font-medium text-gray-600">
              {wordSet.words.length}개 단어
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="단어장 삭제"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}

