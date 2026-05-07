import Link from "next/link";
import { AdminDashboard } from "@/components/admin-dashboard";
import { adminLogin, adminLogout, isAdminAuthenticated } from "@/app/admin/actions";
import { listAllCounters } from "@/lib/counter";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const auth = await isAdminAuthenticated();
  const params = await searchParams;

  if (!auth) {
    return (
      <main className="shell">
        <section className="hero">
          <span className="eyebrow">ADMIN ACCESS</span>
          <h1 className="title">관리자 대시보드 로그인</h1>
          <p className="subtitle">
            관리자 비밀번호를 입력하면 일자별 총 현재 인원과 게이트별 실시간 집계를 확인할 수 있습니다.
          </p>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <form action={adminLogin} className="auth-form">
            <input
              className="input"
              type="password"
              name="password"
              placeholder="관리자 비밀번호"
              autoComplete="current-password"
              required
            />
            <button type="submit" className="button button-enter">
              로그인
            </button>
            {params.error ? (
              <p className="status" style={{ color: "var(--danger)" }}>
                비밀번호가 맞지 않거나 `ADMIN_PASSWORD` 환경변수가 설정되지 않았습니다.
              </p>
            ) : null}
            <Link href="/" className="pill">
              메인으로
            </Link>
          </form>
        </section>
      </main>
    );
  }

  const rows = await listAllCounters();

  return (
    <main className="shell">
      <div className="topbar">
        <div>
          <h1>관리자 대시보드</h1>
          <p className="hint">일자/게이트별 입퇴장 현황과 현재 인원을 실시간으로 확인합니다.</p>
        </div>
        <div className="stack">
          <Link href="/" className="pill">
            메인으로
          </Link>
          <form action={adminLogout}>
            <button type="submit" className="pill" style={{ cursor: "pointer" }}>
              로그아웃
            </button>
          </form>
        </div>
      </div>

      <AdminDashboard initialRows={rows} />
    </main>
  );
}
