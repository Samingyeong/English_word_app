/**
 * word_assets 폴더의 PDF와 CSV(정리)를 읽어 각각 단어장 JSON으로 만듭니다.
 * 실행: npm run build:word-sets
 */
import fs from "fs";
import path from "path";
import { parseWordsFromPdfText } from "../lib/pdfParser";
import { parseCsvFileSync } from "../lib/csvParser";
import type { WordSet, Word } from "../lib/types";

const WORD_ASSETS_DIR = path.join(process.cwd(), "word_assets");
const OUTPUT_PATH = path.join(process.cwd(), "public", "word_assets_word_sets.json");

async function extractTextFromPdf(filePath: string): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const dataBuffer = fs.readFileSync(filePath);
  const data = new Uint8Array(dataBuffer);
  const doc = await (pdfjsLib as any).getDocument({ data }).promise;
  let fullText = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as any[])
      .map((item: any) => item.str || "")
      .join(" ");
    fullText += pageText + "\n";
  }
  return fullText;
}

function createWordSet(name: string, words: Word[], day: number): WordSet {
  return {
    id: `wordset-${name.replace(/\s+/g, "-")}-${Date.now()}`,
    day,
    name: name.replace(/\.(pdf|csv)$/i, "").trim(),
    words: words.map((w, i) => ({
      ...w,
      id: `word-${day}-${i}-${Date.now()}`,
    })),
    createdAt: new Date().toISOString(),
  };
}

async function main() {
  if (!fs.existsSync(WORD_ASSETS_DIR)) {
    console.error("word_assets 폴더가 없습니다:", WORD_ASSETS_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(WORD_ASSETS_DIR);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
  const csvFiles = files.filter(
    (f) => f.toLowerCase().endsWith(".csv") && f.includes("정리")
  );
  if (pdfFiles.length === 0 && csvFiles.length === 0) {
    console.error("word_assets에 PDF 또는 CSV(정리) 파일이 없습니다.");
    process.exit(1);
  }

  const wordSets: WordSet[] = [];
  let day = 1;

  for (const file of csvFiles) {
    const filePath = path.join(WORD_ASSETS_DIR, file);
    const name = file.replace(/\.csv$/i, "").trim();
    console.log("처리 중 (CSV):", file);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const words = parseCsvFileSync(filePath, content);
      if (words.length === 0) {
        console.warn("  -> 단어를 찾지 못함, 건너뜀");
        continue;
      }
      wordSets.push(createWordSet(name, words, day));
      console.log("  ->", words.length, "개 단어");
      day += 1;
    } catch (err) {
      console.error("  -> 오류:", err);
    }
  }

  for (const file of pdfFiles) {
    const filePath = path.join(WORD_ASSETS_DIR, file);
    const name = file.replace(/\.pdf$/i, "");
    console.log("처리 중:", file);
    try {
      const text = await extractTextFromPdf(filePath);
      const words = parseWordsFromPdfText(text);
      if (words.length === 0) {
        console.warn("  -> 단어를 찾지 못함, 건너뜀");
        continue;
      }
      wordSets.push(createWordSet(name, words, day));
      console.log("  ->", words.length, "개 단어");
      day += 1;
    } catch (err) {
      console.error("  -> 오류:", err);
    }
  }

  const publicDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ wordSets }, null, 2),
    "utf-8"
  );
  console.log("\n저장 완료:", OUTPUT_PATH);
  console.log("총", wordSets.length, "개 단어장");
}

main();
