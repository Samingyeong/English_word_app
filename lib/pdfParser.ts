import { Word } from "./types";

const KOREAN_REGEX = /[\uAC00-\uD7A3]/;
const ENTRY_REGEX = /\d+\.\s*([a-zA-Z-]+)\s*([\s\S]*?)(?=\d+\.\s+[a-zA-Z-]+|$)/g;

function hasKorean(s: string): boolean {
  return KOREAN_REGEX.test(s);
}

function trimMeaning(s: string): string {
  return s
    .replace(/^(N\.|V\.|형\.|부\.|가산N\.|불가산N\.)\s*/i, "")
    .replace(/\s+[NV]\.\s+.*$/i, "")
    .trim();
}

function extractFirstKoreanBlock(text: string): string {
  const parts = text.split(/\t/).map((p) => p.trim());
  for (const part of parts) {
    if (hasKorean(part)) return trimMeaning(part);
  }
  const koreanMatch = text.match(/([가-힣\s\/(),]+)/);
  return koreanMatch ? koreanMatch[1].trim() : "";
}

/**
 * PDF에서 추출한 전체 텍스트를 단어장 형식(영어/한글 쌍)으로 파싱합니다.
 * 비법어휘, 해커스 토익 등 "번호. 영단어 ... 한글뜻" 형식을 인식합니다.
 */
export function parseWordsFromPdfText(fullText: string): Word[] {
  const words: Word[] = [];
  const seen = new Set<string>();
  let m: RegExpExecArray | null;

  ENTRY_REGEX.lastIndex = 0;
  while ((m = ENTRY_REGEX.exec(fullText)) !== null) {
    const english = m[1].trim().toLowerCase();
    if (!english || seen.has(english)) continue;

    const korean = extractFirstKoreanBlock(m[2]);
    if (!korean || korean.length < 2) continue;

    const meaning = korean.length > 200 ? korean.slice(0, 200) : korean;
    seen.add(english);
    words.push({
      id: `word-${Date.now()}-${words.length}`,
      english,
      korean: meaning,
    });
  }

  return words;
}

/**
 * PDF 파일에서 텍스트를 추출한 뒤 단어 목록으로 파싱합니다.
 * 브라우저에서만 동작합니다.
 */
export async function parsePdfFile(file: File): Promise<Word[]> {
  if (typeof window === "undefined") {
    throw new Error("PDF 파싱은 브라우저에서만 가능합니다.");
  }

  const pdfjsLib = await import("pdfjs-dist");
  const version = (pdfjsLib as any).version || "5.3.93";
  (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({
    data: arrayBuffer,
    useSystemFonts: true,
    disableFontFace: true,
  }).promise;
  const numPages = doc.numPages;
  let fullText = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item: any) => ("str" in item ? item.str : ""))
      .join(" ");
    fullText += pageText + "\n";
  }

  const words = parseWordsFromPdfText(fullText);
  if (words.length === 0) {
    throw new Error(
      "PDF에서 단어를 찾지 못했습니다. 형식: 번호. 영단어 탭 한글뜻"
    );
  }
  return words;
}
