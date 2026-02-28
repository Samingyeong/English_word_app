"use client";

import { WordSet } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { CrewmateIcon, CREWMATE_COLOR_KEYS, CREWMATE_COLORS } from "./CrewmateIcon";
import { Trash2, Edit, ChevronRight } from "lucide-react";

interface DayCardProps {
  wordSet: WordSet;
  index?: number;
  onClick: () => void;
  onDelete: (wordSetId: string) => void;
  onRename: (wordSetId: string, newName: string) => void;
  /** 여러 개 삭제 모드일 때 체크박스 표시 및 선택 여부 */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export function DayCard({
  wordSet,
  index = 0,
  onClick,
  onDelete,
  onRename,
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: DayCardProps) {
  const crewmateColor = CREWMATE_COLOR_KEYS[index % CREWMATE_COLOR_KEYS.length];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`"${wordSet.name}" 단어장을 삭제하시겠습니까?`)) {
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

  const handleCardClick = () => {
    if (selectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onClick();
    }
  };

  return (
    <Card
      className={`bg-bg-card border-2 rounded-xl shadow-[4px_4px_0_0_#000] transition-all relative overflow-hidden group ${
        selectionMode
          ? `cursor-pointer border-black hover:shadow-[6px_6px_0_0_#000] ${selected ? "ring-2 ring-crewmate-cyan ring-offset-2" : ""}`
          : "cursor-pointer border-black hover:shadow-[6px_6px_0_0_#000] hover:scale-[1.02]"
      }`}
      onClick={handleCardClick}
    >
      <span
        className="absolute left-0 top-0 bottom-0 w-1.5 opacity-90"
        style={{ background: CREWMATE_COLORS[crewmateColor] ?? CREWMATE_COLORS.red }}
        aria-hidden
      />
      <CardContent className="p-5 pl-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {selectionMode ? (
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(e) => {
                    e.stopPropagation();
                    onToggleSelect?.();
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-5 h-5 rounded border-gray-400 text-crewmate-cyan focus:ring-crewmate-cyan"
                />
              </div>
            ) : (
              <div className="flex-shrink-0">
                <CrewmateIcon color={crewmateColor} size={40} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-crewmate-cyan transition-colors">
                {wordSet.name}
              </h3>
              <p className="text-sm text-gray-600 mt-0.5">
                {wordSet.words.length}개 단어
              </p>
            </div>
          </div>
          {!selectionMode && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={handleRename}
                className="p-1.5 text-gray-500 hover:text-crewmate-cyan hover:bg-crewmate-cyan/10 rounded-lg transition-colors"
                title="이름 변경"
              >
                <Edit className="h-4 w-4" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-500 hover:text-crewmate-red hover:bg-crewmate-red/10 rounded-lg transition-colors"
                title="삭제"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-crewmate-cyan transition-colors" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
