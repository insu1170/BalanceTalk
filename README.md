# ⚖️ BalanceTalk — 밸런스 토론 플랫폼

> “나는 이거다!” 두 선택지 중 하나를 골라 제한 시간 안에 설득하는 **실시간 밸런스형 도파민 토론 플랫폼**

---

## 📘 프로젝트 개요

BalanceTalk은 즉흥성과 경쟁심을 기반으로 한 **실시간 밸런스 토론 웹앱**입니다. 사용자는 주제를 생성하거나 참여해 A/B 두 진영으로 나뉘어 제한된 시간 동안 서로 설득하며 토론합니다. 토론이 종료되면 투표를 통해 승리 진영이 결정되고, 방은 자동 삭제되어 기록이 남지 않습니다.

---

## ⚙️ 기술 스택

| 구분                   | 기술                                                         |
| -------------------- | ---------------------------------------------------------- |
| **Frontend**         | Next.js (TypeScript, Tailwind CSS, Zustand, react-virtual) |
| **Backend**          | Express + Socket.IO (TypeScript)                           |
<!-- | **Database / Cache** | Redis (방 TTL, 참가자 및 투표 관리)                                 |
| **Infra / 배포**       | Vercel (Web), Render / Railway (Server)                    |
| **Dev Tools**        | ESLint, Prettier, tsx, dotenv                              | -->

---

## 🧩 프로젝트 구조

```
BalanceTalk/
├─ web/                         # Next.js (Frontend)
│  ├─ app/
│  │  ├─ page.tsx              # 랜딩 / 빠른참여 화면
│  │  ├─ create/page.tsx       # 방 생성 페이지
│  │  └─ room/[roomId]/page.tsx# 토론 및 투표 화면
│  ├─ components/
│  │  ├─ RoomHeader.tsx
│  │  ├─ DualChat.tsx
│  │  ├─ VotePanel.tsx
│  │  ├─ Timer.tsx
│  │  └─ NicknameBadge.tsx
│  ├─ lib/socket.ts             # Socket.IO 클라이언트
│  ├─ store/room.ts             # Zustand 전역 상태 (팀/닉네임/타이머)
│  └─ styles/globals.css
│
└─ server/                      # Express + Socket.IO (Backend)
   ├─ src/
   │  ├─ index.ts               # 서버 엔트리 포인트
   │  ├─ socket.ts              # 이벤트 핸들러 관리
   │  ├─ rooms.ts               # 방 생성 / 종료 / TTL 관리 로직
   │  ├─ redis.ts               # Redis 클라이언트 및 유틸
   │  └─ types.ts               # 공용 타입 정의
   ├─ package.json
   └─ tsconfig.json
```

---

## 🚀 실행 방법

### 1️⃣ 환경 변수 설정

**web/.env.local**

```
NEXT_PUBLIC_SOCKET_URL=http://localhost:8080
NEXT_PUBLIC_DEFAULT_DURATION=300
NEXT_PUBLIC_NICK_PREFIX=BT
```

**server/.env**

```
PORT=8080
CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
ROOM_TTL_SEC=420
```

### 2️⃣ 실행

**서버 실행**

```bash
cd server
pnpm i
pnpm dev
```

**클라이언트 실행**

```bash
cd web
pnpm i
pnpm dev
```

> 기본 포트: **8080 (서버)** / **3000 (웹)**

---

## 🧠 주요 기능

* 🗣️ **실시간 도파민 토론** — 제한 시간 내 설득 대결
* 🧢 **익명 닉네임 시스템** — 부담 없는 참여 경험
* ⚡ **양측 실시간 채팅** — A팀/B팀 대화 동시 표시
* ⏱️ **타이머 & 투표 기능** — 시간 종료 후 투표로 승패 결정
* 💨 **휘발성 구조** — TTL 만료 시 방 자동 삭제

---

## 🪶 Commit Convention

| 타입         | 설명            |
| ---------- | ------------- |
| `feat`     | 새로운 기능 추가     |
| `fix`      | 버그 수정         |
| `chore`    | 환경 설정, 패키지 관리 |
| `docs`     | 문서 수정         |
| `refactor` | 코드 구조 개선      |

**예시**

```
feat(web): 방 생성 폼 및 검증 로직 추가
fix(server): 투표 중복 제출 방지 로직 수정
refactor(socket): 이벤트 네임스페이스 구조 개선
```
