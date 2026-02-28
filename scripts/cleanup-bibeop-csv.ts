/**
 * 비법어휘 CSV: 형용사/부사/V./N. 등 품사·광고 제거, 영어에 맞는 한글 뜻만 남김
 * 1회 실행: npx tsx scripts/cleanup-bibeop-csv.ts
 */
import fs from "fs";
import path from "path";
import { parseCsvLine } from "../lib/csvParser";

const CSV_PATH = path.join(process.cwd(), "word_assets", "비법어휘_1000파일_2_정리.csv");

function escapeCsvCell(s: string): string {
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** 광고/브랜드 문구 제거 */
function removeAdText(text: string): string {
  return text
    .replace(/\s*신토익\s*단기간\s*고득점\s*청주\s*&\s*대전\s*홍쌤토익\s*/g, " ")
    .replace(/\s*홍쌤토익[^"]*/g, " ")
    .replace(/\s*신토익[^"]*?(?=[\s,]|$)/g, " ")
    .replace(/\s*홍쌤\s*/g, " ")
    .replace(/\s*단기간\s*고득점[^"]*?(?=[\s,]|$)/g, " ")
    .trim();
}

/** 품사·문법 표기 제거 (V., N., 형., 부., 가산, 불가산, 전., cf. 등) */
function removePosAndGrammar(text: string): string {
  let s = text
    .replace(/\bV\.\s*/g, " ")
    .replace(/\bN\.\s*/g, " ")
    .replace(/\b형\.\s*/g, " ")
    .replace(/\b부\.\s*/g, " ")
    .replace(/\b형\s*\./g, " ")
    .replace(/\b부\s*\./g, " ")
    .replace(/\b가산\s*/g, " ")
    .replace(/\b불가산\s*/g, " ")
    .replace(/\b전\.\s*/g, " ")
    .replace(/\bcf\.\s*/g, " ")
    .replace(/\b자\s*$/g, " ")
    .replace(/\b타\s*$/g, " ")
    .replace(/\s*\.\s*$/g, " ");
  // 괄호 안 영문/문법만 제거
  s = s.replace(/\s*\((\s*(?:for|about|to|of|with|in|into|from|at)\s*[^)]*)\)/g, " ");
  s = s.replace(/\s*\((?:pl\.|종종\s*pl\.)\)/g, " ");
  s = s.replace(/\s*\(\s*[\w\s/]+절\s*\)/g, " ");
  s = s.replace(/\s*\(\s*\+\s*to\s+부정사\s*\)/g, " ");
  s = s.replace(/\s*\(\s*-ing\s*\)/g, " ");
  s = s.replace(/\s*\(\s*보통\s*수동형으로\s*\)/g, " ");
  s = s.replace(/\s*\(\s*타동사\s*\)/g, " ");
  return s.replace(/\s+/g, " ").trim();
}

/** 최종 뜻에서 품사·광고 잔여 제거 */
function stripRemainingJunk(text: string): string {
  return text
    .replace(/\bV\.\s*/g, " ")
    .replace(/\bN\.\s*/g, " ")
    .replace(/\b형\.\s*/g, " ")
    .replace(/\b부\.\s*/g, " ")
    .replace(/형\s*\.\s*/g, " ")
    .replace(/부\s*\.\s*/g, " ")
    .replace(/전\s*\.\s*/g, " ")
    .replace(/\b형\s*/g, " ")
    .replace(/\b부\s*/g, " ")
    .replace(/\b가산\s*/g, " ")
    .replace(/\b불가산\s*/g, " ")
    .replace(/\b전\.\s*/g, " ")
    .replace(/\bcf\.\s*/g, " ")
    .replace(/\s*신토익[^가-힣]*/g, " ")
    .replace(/\s*단기간\s*고득점[^가-힣]*/g, " ")
    .replace(/\s*홍쌤[^가-힣]*/g, " ")
    .replace(/\s*청주\s*&\s*대전\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 첫 번째 의미 있는 한글 뜻 블록 추출 (품사만 있는 세그먼트는 스킵) */
function extractMainMeaning(text: string): string {
  const noAd = removeAdText(text);
  const noPos = removePosAndGrammar(noAd);
  const segments = noPos.split(/[\n\/]/).map((t) => t.trim()).filter(Boolean);
  const onlyPos = /^(\s*(?:V\.|N\.|형\.?|부\.?|가산|불가산|전\.|cf\.)\s*)*$/;
  const koreanBlock = /[가-힣]{2,}/;
  for (const seg of segments) {
    if (onlyPos.test(seg)) continue;
    const m = seg.match(koreanBlock);
    if (m) {
      let meaning = seg
        .replace(/\s*\([^)]*\)\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (meaning.length > 1 && /[가-힣]/.test(meaning)) {
        meaning = stripRemainingJunk(meaning);
        if (meaning.length > 120) meaning = meaning.slice(0, 117) + "...";
        return meaning;
      }
    }
  }
  const fallback = stripRemainingJunk(noPos.replace(/\s{2,}/g, " ").trim()).slice(0, 120);
  return fallback;
}

function main() {
  const content = fs.readFileSync(CSV_PATH, "utf-8");
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const out: string[] = [];

  for (const line of lines) {
    const cols = parseCsvLine(line);
    const english = (cols[0] ?? "").trim();
    const rawKorean = (cols[1] ?? "").trim();
    if (!english) continue;
    if (/^신토익|^홍쌤|^단기간\s*고득점/.test(rawKorean) && !/[가-힣]{2,}/.test(rawKorean)) continue;
    const korean = extractMainMeaning(rawKorean);
    const cleaned = stripRemainingJunk(korean);
    if (!cleaned || !/[가-힣]/.test(cleaned)) continue;
    const onlyLabel = /^(가산|불가산|전|cf\.?|V\.?|N\.?)$|^형\.?\s*$|^부\.?\s*$/;
    if (onlyLabel.test(cleaned.replace(/\s/g, ""))) continue;
    out.push(`${escapeCsvCell(english)},${escapeCsvCell(cleaned)}`);
  }

  fs.writeFileSync(CSV_PATH, out.join("\n"), "utf-8");
  console.log("정리 완료:", CSV_PATH, "총", out.length, "행");
}

main();
