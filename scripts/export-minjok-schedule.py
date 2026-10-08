"""Export the schedule app as a portable, standalone Vite source project."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
app = root / "artifacts/minjok-schedule"
output = app / "public/downloads/minjok-schedule-webapp-source.zip"
output.parent.mkdir(parents=True, exist_ok=True)
prefix = "minjok-schedule-webapp/"

package = {
    "name": "minjok-schedule-webapp",
    "version": "1.0.0",
    "private": True,
    "type": "module",
    "engines": {"node": ">=22.12.0"},
    "scripts": {
        "dev": "vite --host 0.0.0.0",
        "build": "tsc --noEmit && vite build",
        "preview": "vite preview --host 0.0.0.0",
        "typecheck": "tsc --noEmit",
    },
    "dependencies": {
        "react": "19.1.0",
        "react-dom": "19.1.0",
        "lucide-react": "0.545.0",
        "tw-animate-css": "1.4.0",
    },
    "devDependencies": {
        "@types/react": "19.2.0",
        "@types/react-dom": "19.2.0",
        "@vitejs/plugin-react": "5.0.4",
        "@tailwindcss/vite": "4.1.14",
        "tailwindcss": "4.1.14",
        "typescript": "5.9.3",
        "vite": "7.3.6",
    },
}
tsconfig = {
    "compilerOptions": {
        "target": "ES2022", "lib": ["ES2022", "DOM", "DOM.Iterable"],
        "module": "ESNext", "moduleResolution": "Bundler",
        "jsx": "react-jsx", "strict": True, "noEmit": True,
        "skipLibCheck": True, "types": ["vite/client"],
    },
    "include": ["src"],
}
vite_config = """import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0' },
});
"""
main = """import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
"""
readme = """# 민사고 김태완 · 일정 허브

현재 선택한 모바일 시안을 바탕으로 만든 React + TypeScript + Vite 웹앱 소스입니다.
Replit의 다른 프로젝트나 서버에 의존하지 않고 독립적으로 실행할 수 있습니다.

## 실행 방법

1. Node.js 22.12 이상(또는 Node.js 24)을 설치합니다.
2. 이 ZIP을 풀고 `minjok-schedule-webapp` 폴더에서 터미널을 엽니다.
3. 아래 명령을 실행합니다.

```sh
npm install
npm run dev
```

터미널에 표시되는 주소(일반적으로 http://localhost:5173)를 브라우저에서 엽니다.
HTML 파일을 더블클릭하는 방식이 아니라 개발 서버로 실행해야 합니다.

## 배포용 파일 만들기

```sh
npm run build
npm run preview
```

빌드 결과는 `dist/`에 생성됩니다. 정적 웹 호스팅에 이 폴더의 내용을 올릴 수 있습니다.

## 포함된 파일

- `src/App.tsx`: 일정 화면과 필터, 할 일, 메모 동작
- `src/index.css`: 모바일 디자인 및 반응형 스타일
- `src/main.tsx`: React 실행 진입점
- `public/images/`: 민사고 교표 및 캠퍼스 사진
- `index.html`: 페이지 제목과 메타 정보
- `package.json`, `vite.config.ts`, `tsconfig.json`: 설치·실행·빌드 설정

## 현재 기능과 연결 상태

- 학교/개인 할 일 추가와 완료 처리, 개인 메모 저장을 사용할 수 있습니다.
- 할 일과 메모는 현재 브라우저의 localStorage에 저장됩니다.
  다른 브라우저나 기기와 자동 동기화되지 않으며, 브라우저 데이터를 지우면 삭제됩니다.
- 날짜, 학교 캘린더, 날씨와 시간표는 디자인 확인용 샘플 데이터입니다.
- Google Calendar와 기존 수업 시간표 웹앱은 아직 실제 연결되지 않았습니다.
- 로그인, 서버, 데이터베이스, API 키는 이 묶음에 포함되지 않습니다.
- Google Fonts는 인터넷 연결 시 불러오며, 연결되지 않으면 시스템 글꼴을 사용합니다.

## 이미지 출처

교표는 민족사관고등학교 공식 홈페이지의 교표 자료이며,
캠퍼스 사진은 현재 승인된 시안에 사용한 학교 홍보 영상 장면입니다.
학교 공식 서비스임을 주장하는 자료는 아닙니다. 공개 배포 전 학교 자산의 사용 권한을 확인하세요.
"""

source = (app / "src/App.tsx").read_text()
for image in ("kmla-emblem.png", "integrated-schedule-promo.jpg"):
    source = source.replace(
        f'src="/images/{image}"',
        'src={`${import.meta.env.BASE_URL}images/' + image + '`}',
    )
html = (app / "index.html").read_text().replace(
    'href="/favicon.svg"', 'href="./images/kmla-emblem.png"'
).replace('type="image/svg+xml"', 'type="image/png"')

with ZipFile(output, "w", ZIP_DEFLATED) as archive:
    text_files = {
        "package.json": json.dumps(package, indent=2) + "\n",
        "tsconfig.json": json.dumps(tsconfig, indent=2) + "\n",
        "vite.config.ts": vite_config,
        "index.html": html,
        "README.md": readme,
        ".gitignore": "node_modules/\ndist/\n.env*\n",
        "src/main.tsx": main,
        "src/App.tsx": source,
        "src/index.css": (app / "src/index.css").read_text(),
    }
    for name, content in text_files.items():
        archive.writestr(prefix + name, content)
    for image in ("kmla-emblem.png", "integrated-schedule-promo.jpg"):
        archive.write(app / "public/images" / image, prefix + "public/images/" + image)

print(f"Created {output.relative_to(root)} ({output.stat().st_size:,} bytes)")
