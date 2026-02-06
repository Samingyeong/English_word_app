import { Word } from "./types";

export function parseExcelFile(file: File): Promise<Word[]> {
  return new Promise(async (resolve, reject) => {
    // 동적 import로 xlsx 로드 (클라이언트 사이드에서만)
    const XLSX = await import("xlsx");
    
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error("파일을 읽을 수 없습니다."));
          return;
        }

        const workbook = (XLSX as any).read(data, { type: "binary" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // 엑셀 데이터를 JSON으로 변환
        const jsonData = (XLSX as any).utils.sheet_to_json(worksheet, {
          header: ["english", "korean"],
          defval: "",
        }) as Array<{ english: string; korean: string }>;

        // Word 배열로 변환
        const words: Word[] = jsonData
          .filter((row) => row.english && row.korean)
          .map((row, index) => ({
            id: `word-${Date.now()}-${index}`,
            english: String(row.english).trim(),
            korean: String(row.korean).trim(),
          }));

        if (words.length === 0) {
          reject(new Error("단어를 찾을 수 없습니다. 엑셀 파일 형식을 확인해주세요."));
          return;
        }

        resolve(words);
      } catch (error) {
        reject(new Error(`파일 파싱 중 오류가 발생했습니다: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("파일 읽기 중 오류가 발생했습니다."));
    };

    reader.readAsBinaryString(file);
  });
}

