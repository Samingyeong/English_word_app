"use client";

import { WrongAnswer } from "@/lib/types";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { X, BookOpen } from "lucide-react";
import { removeWrongAnswer } from "@/lib/storage";

interface WrongAnswersListProps {
  wrongAnswers: WrongAnswer[];
  onRemove: (wordId: string) => void;
  onStudy: (wrongAnswers: WrongAnswer[]) => void;
}

export function WrongAnswersList({
  wrongAnswers,
  onRemove,
  onStudy,
}: WrongAnswersListProps) {
  if (wrongAnswers.length === 0) {
    return (
      <Card className="bg-bg-card border-2 border-black">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-600 font-medium">오답이 없습니다. 모두 정답이에요! 🎉</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          오답 단어 ({wrongAnswers.length}개)
        </h3>
        <Button
          onClick={() => onStudy(wrongAnswers)}
          size="sm"
          className="bg-crewmate-red text-white border-2 border-black shadow-[2px_2px_0_0_#000] hover:opacity-90"
        >
          오답 공부하기
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {wrongAnswers.map((wrong) => (
          <Card key={wrong.wordId} className="bg-bg-card border-2 border-black shadow-[4px_4px_0_0_#000]">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-900">
                    {wrong.english}
                  </p>
                  <p className="text-base font-medium text-gray-700 mt-2">{wrong.korean}</p>
                  <div className="mt-3 flex items-center gap-2 text-sm font-medium text-gray-600">
                    <span>Day {wrong.day}</span>
                    <span>•</span>
                    <span>틀린 횟수: {wrong.wrongCount}회</span>
                  </div>
                </div>
                <button
                  onClick={() => onRemove(wrong.wordId)}
                  className="ml-2 text-gray-400 hover:text-red-500"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

