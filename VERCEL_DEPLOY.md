# Vercel 배포 방법

## 1. GitHub에 코드 올리기

터미널에서 (프로젝트 폴더에서):

```bash
# 변경사항 커밋
git add .
git commit -m "Vercel 배포 준비"

# GitHub 저장소가 아직 없으면 먼저 GitHub에서 새 repo 생성 후:
git remote add origin https://github.com/본인아이디/저장소이름.git

# 푸시
git push -u origin main
```

(`main` 대신 `master` 브랜치를 쓰면 `git push -u origin master`)

---

## 2. Vercel에서 배포하기

### 방법 A: Vercel 웹사이트 (추천)

1. [vercel.com](https://vercel.com) 접속 후 **로그인** (GitHub 계정으로 가입/로그인 가능)
2. **Add New…** → **Project** 클릭
3. **Import Git Repository**에서 방금 푸시한 GitHub 저장소 선택 후 **Import**
4. 설정 확인:
   - **Framework Preset**: Next.js (자동 감지됨)
   - **Build Command**: `next build` (기본값)
   - **Output Directory**: (비워두기, Next.js 기본값)
   - **Install Command**: `npm install` 또는 `pnpm install` (사용 중인 패키지 매니저에 맞게)
5. **Deploy** 클릭

배포가 끝나면 `https://프로젝트이름.vercel.app` 주소로 접속할 수 있습니다.

### 방법 B: Vercel CLI

1. Vercel CLI 설치:
   ```bash
   npm i -g vercel
   ```
2. 프로젝트 폴더에서:
   ```bash
   vercel
   ```
3. 로그인/프로젝트 이름 등 질문에 답하면 배포됩니다.

---

## 3. 참고

- **word_assets_word_sets.json**: `public/` 안에 있으면 빌드 결과에 포함되므로 Vercel에서 그대로 제공됩니다. 이미 `public/`에 있다면 별도 설정 없이 사용 가능합니다.
- **환경 변수**: 나중에 `.env` 값을 쓸 경우, Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**에서 추가하면 됩니다.
- **빌드: 단어장 JSON**: `npm run build:word-sets`는 로컬에서만 실행해 두고, 만든 `public/word_assets_word_sets.json`을 Git에 커밋해 두면 Vercel 빌드 시 그 파일이 포함됩니다. (Vercel 빌드 단계에서 이 스크립트를 돌리지 않아도 됩니다.)
