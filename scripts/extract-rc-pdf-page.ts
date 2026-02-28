/**
 * YBM RC 단어장 PDF 1페이지만 추출해 텍스트 저장 (형식 확인용)
 * 실행: npx tsx scripts/extract-rc-pdf-page.ts
 */
import fs from "fs";
import path from "path";

const WORD_ASSETS = path.join(process.cwd(), "word_assets");
const RC_PDF = "YBM 실전토익 1000 RC 1 전면개정판_단어장.pdf";

async function main() {
  const pdfPath = path.join(WORD_ASSETS, RC_PDF);
  if (!fs.existsSync(pdfPath)) {
    console.error("파일 없음:", pdfPath);
    process.exit(1);
  }
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const doc = await (pdfjsLib as any).getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const content = await page.getTextContent();
  const text = (content.items as any[]).map((i: any) => i.str || "").join(" ");
  const outPath = path.join(WORD_ASSETS, "ybm_rc_p1.txt");
  fs.writeFileSync(outPath, text, "utf8");
  console.log("Written", text.length, "chars to", outPath);
  console.log("Preview:", text.slice(0, 600));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
