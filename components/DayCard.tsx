"use client";

import { WordSet } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { CrewmateIcon, CREWMATE_COLOR_KEYS } from "./CrewmateIcon";
import { Trash2, Edit } from "lucide-react";

interface DayCardProps {
  wordSet: WordSet;
  index?: number;
  onClick: () => void;
  onDelete: (wordSetId: string) => void;
  onRename: (wordSetId: string, newName: string) => void;
}

export function DayCard({ wordSet, index = 0, onClick, onDelete, onRename }: DayCardProps) {
  const crewmateColor = CREWMATE_COLOR_KEYS[index % CREWMATE_COLOR_KEYS.length];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Day ${wordSet.day} 단어장을 삭제하시겠습니까?`)) {
      onDelete(wordSet.id);
    }
  };

  const handleRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newName = prompt("단어장 이름을 입력하세요:", wordSet.name);
    if (newName && newName.trim() && newName !== wordSet.name) {
      onRename(wordSet.id, newName.trim());
    }
  };

  return (
    <Card
      className="cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[6px_6px_0_0_#000] relative border-2 border-black"
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center">
            <CrewmateIcon color={crewmateColor} size={56} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-bold text-gray-900">
              Day {wordSet.day}
            </h3>
            <p className="text-sm font-medium text-gray-700 truncate">{wordSet.name}</p>
            <p className="mt-1 text-xs font-medium text-gray-600">
              {wordSet.words.length}개 단어
            </p>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={handleRename}
              className="p-2 text-gray-500 hover:text-crewmate-cyan hover:bg-crewmate-cyan/10 rounded-lg transition-colors border border-transparent hover:border-crewmate-cyan"
              title="단어장 이름 변경"
            >
              <Edit className="h-5 w-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-crewmate-red hover:bg-crewmate-red/10 rounded-lg transition-colors border border-transparent hover:border-crewmate-red"
              title="단어장 삭제"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

