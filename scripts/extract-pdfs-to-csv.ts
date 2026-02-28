/**
 * word_assets 내 PDF에서 영단어/뜻 추출 후 CSV로 저장 (1회 실행용)
 * 실행: npx tsx scripts/extract-pdfs-to-csv.ts
 */
import fs from "fs";
import path from "path";
import { parseWordsFromPdfText } from "../lib/pdfParser";
import type { Word } from "../lib/types";

const WORD_ASSETS_DIR = path.join(process.cwd(), "word_assets");

function escapeCsvCell(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

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

function pdfBaseToCsvName(pdfName: string): string {
  const base = pdfName.replace(/\.pdf$/i, "").trim();
  const safe = base
    .replace(/\s+/g, "_")
    .replace(/[()]/g, "")
    .replace(/_+/g, "_")
    .trim();
  return `${safe}_정리.csv`;
}

async function main() {
  if (!fs.existsSync(WORD_ASSETS_DIR)) {
    console.error("word_assets 폴더가 없습니다:", WORD_ASSETS_DIR);
    process.exit(1);
  }
  const files = fs.readdirSync(WORD_ASSETS_DIR);
  const pdfFiles = files.filter((f) => f.toLowerCase().endsWith(".pdf"));
  if (pdfFiles.length === 0) {
    console.error("word_assets에 PDF 파일이 없습니다.");
    process.exit(1);
  }

  for (const file of pdfFiles) {
    const filePath = path.join(WORD_ASSETS_DIR, file);
    console.log("추출 중:", file);
    try {
      const text = await extractTextFromPdf(filePath);
      const words: Word[] = parseWordsFromPdfText(text);
      if (words.length === 0) {
        console.warn("  -> 단어를 찾지 못함, 건너뜀");
        continue;
      }
      const csvName = pdfBaseToCsvName(file);
      const csvPath = path.join(WORD_ASSETS_DIR, csvName);
      const csvLines = words.map((w) => `${escapeCsvCell(w.english)},${escapeCsvCell(w.korean)}`);
      fs.writeFileSync(csvPath, csvLines.join("\n"), "utf-8");
      console.log("  ->", words.length, "개 단어 →", csvName);
    } catch (err) {
      console.error("  -> 오류:", err);
    }
  }
  console.log("\nCSV 저장 완료.");
}

main();
