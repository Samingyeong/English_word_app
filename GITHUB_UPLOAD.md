# GitHub에 프로젝트 올리기 가이드

## 1단계: Git 초기화 및 설정

PowerShell에서 프로젝트 폴더로 이동한 후 다음 명령어를 실행하세요:

```powershell
cd "C:\Users\samg2\Downloads\word-app"
```

### Git 초기화
```powershell
git init
```

### Git 사용자 정보 설정 (처음 한 번만)
```powershell
git config --global user.name "당신의 이름"
git config --global user.email "당신의이메일@example.com"
```

## 2단계: 파일 추가 및 커밋

### 모든 파일 추가
```powershell
git add .
```

### 첫 번째 커밋
```powershell
git commit -m "Initial commit: 영단어 암기 앱"
```

## 3단계: GitHub 저장소 생성

1. **GitHub 웹사이트 접속**: https://github.com
2. **로그인** (계정이 없으면 회원가입)
3. **우측 상단의 + 버튼 클릭** → "New repository" 선택
4. **저장소 정보 입력**:
   - Repository name: `word-memorization-app` (또는 원하는 이름)
   - Description: "엑셀 파일로 영단어를 외우는 플래시카드 앱"
   - Public 또는 Private 선택
   - **"Initialize this repository with a README" 체크 해제** (이미 README가 있으므로)
5. **"Create repository" 클릭**

## 4단계: 원격 저장소 연결 및 푸시

GitHub에서 저장소를 생성하면 나오는 명령어를 사용하거나, 아래 명령어를 실행하세요:

### 원격 저장소 연결
```powershell
git remote add origin https://github.com/당신의사용자명/저장소이름.git
```

예시:
```powershell
git remote add origin https://github.com/samg2/word-memorization-app.git
```

### 메인 브랜치 설정 (필요한 경우)
```powershell
git branch -M main
```

### GitHub에 푸시
```powershell
git push -u origin main
```

## 완료! 🎉

이제 GitHub에서 프로젝트를 확인할 수 있습니다!

---

## 추가 팁

### 이후 변경사항 업로드하기
```powershell
git add .
git commit -m "변경사항 설명"
git push
```

### 원격 저장소 URL 확인
```powershell
git remote -v
```

### 원격 저장소 URL 변경
```powershell
git remote set-url origin https://github.com/새로운사용자명/새로운저장소이름.git
```

