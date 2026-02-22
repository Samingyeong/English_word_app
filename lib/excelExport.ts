import { Word } from "./types";

/**
 * 단어 목록을 엑셀 파일로 다운로드 (업로드 형식과 동일: 1열 영어, 2열 한글)
 */
export async function exportWordsToExcel(words: Word[], filename: string) {
  if (typeof window === "undefined") return;

  const XLSX = await import("xlsx");

  const rows = words.map((w) => [w.english, w.korean]);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "단어장");

  const fileName = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
