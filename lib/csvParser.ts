import { Word } from "./types";

/**
 * CSV 한 줄을 파싱 (쉼표 구분, 큰따옴표 안의 쉼표는 무시)
 */
export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * CSV 파일에서 단어 목록 추출 (1열: 영어, 2열: 한글)
 */
export function parseCsvFile(file: File): Promise<Word[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || typeof text !== "string") {
          reject(new Error("파일을 읽을 수 없습니다."));
          return;
        }

        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        const words: Word[] = [];

        for (let i = 0; i < lines.length; i++) {
          const cols = parseCsvLine(lines[i]);
          const english = cols[0]?.trim() ?? "";
          const korean = cols[1]?.trim() ?? "";
          if (english && korean) {
            words.push({
              id: `word-${Date.now()}-${i}`,
              english,
              korean,
            });
          }
        }

        if (words.length === 0) {
          reject(new Error("단어를 찾을 수 없습니다. CSV 형식: 1열 영어, 2열 한글"));
          return;
        }

        resolve(words);
      } catch (error) {
        reject(new Error(`CSV 파싱 중 오류: ${error instanceof Error ? error.message : String(error)}`));
      }
    };

    reader.onerror = () => reject(new Error("파일 읽기 중 오류가 발생했습니다."));
    reader.readAsText(file, "UTF-8");
  });
}

/**
 * Node에서 CSV 파일 경로로 단어 목록 추출 (1열: 영어, 2열: 한글)
 */
export function parseCsvFileSync(filePath: string, content: string): Word[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const words: Word[] = [];
  for (let i = 0; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const english = cols[0]?.trim() ?? "";
    const korean = cols[1]?.trim() ?? "";
    if (english && korean && !english.startsWith("#")) {
      words.push({
        id: `word-${Date.now()}-${i}`,
        english,
        korean,
      });
    }
  }
  return words;
}
