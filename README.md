# Stage Counter

Vercel 배포를 목표로 한 실시간 무대 입퇴장 계수 웹앱입니다.

## 추천 스택

- 프론트엔드: Next.js App Router
- 배포: Vercel
- 데이터베이스: Supabase Postgres
- 실시간 동기화: Supabase Realtime

이 조합을 추천하는 이유는 다음과 같습니다.

- 여러 운영자가 동시에 눌러도 Postgres 함수로 안전하게 누적할 수 있습니다.
- 관리자 화면을 별도 웹소켓 서버 없이 실시간으로 갱신할 수 있습니다.
- Vercel과 연결이 쉽고, 무료 구간에서 빠르게 검증하기 좋습니다.

## 기능

- 메인 화면에서 1일차, 2일차, 3일차 선택
- 각 일자 화면에서 GATE A, GATE B, GATE C 입장/퇴장 계수
- 관리자 로그인 후 일자별 현재 인원 및 게이트별 실시간 현황 확인

## 로컬 실행

1. 의존성 설치

```bash
npm install
```

2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Supabase와 관리자 비밀번호를 넣습니다.

3. 개발 서버 실행

```bash
npm run dev
```

## Supabase 설정

1. Supabase 프로젝트 생성
2. SQL Editor에서 [supabase/schema.sql](./supabase/schema.sql) 실행
3. Project Settings -> API에서 다음 값 복사

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`SUPABASE_URL`은 보통 public URL과 동일합니다.

## Vercel 배포

1. Git 저장소 연결
2. Vercel 프로젝트 생성
3. Environment Variables에 `.env.example`의 값 등록
4. Deploy

## 추천 확장

- 운영자용 간단 PIN 로그인 추가
- 실수 클릭 대비 `-1` 또는 수정 이력 기능
- 시간대별 로그 저장 테이블 추가
- 게이트 수를 관리자에서 동적으로 변경하는 설정 페이지 추가
