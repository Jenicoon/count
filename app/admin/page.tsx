import Link from "next/link";
import { AdminDashboard } from "@/components/admin-dashboard";
import { adminLogin, adminLogout } from "@/app/admin/actions";
import { getAdminRole } from "@/lib/admin-auth";
import { listAllCounters } from "@/lib/counter";

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminPage({ searchParams }: Props) {
  const role = await getAdminRole();
  const params = await searchParams;

  if (!role) {
    return (
      <main className="shell">
        <section className="hero">
          <span className="eyebrow">ADMIN ACCESS</span>
          <h1 className="title">관리자 대시보드 로그인</h1>
          <p className="subtitle">
            관리자 비밀번호로 로그인하면 일자별, 게이트별 집계를 확인할 수 있고 슈퍼 관리자만 수정할 수 있습니다.
          </p>
        </section>

        <section className="card" style={{ marginTop: 24 }}>
          <form action={adminLogin} className="auth-form">
            <input
              className="input"
              type="password"
              name="password"
              placeholder="관리자 또는 슈퍼 관리자 비밀번호"
              autoComplete="current-password"
              required
            />
            <button type="submit" className="button button-enter">
              로그인
            </button>
            {params.error ? (
              <p className="status" style={{ color: "var(--danger)" }}>
                비밀번호가 맞지 않거나 환경 변수 설정이 완료되지 않았습니다.
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
          <h1>{role === "super" ? "슈퍼 관리자 대시보드" : "관리자 대시보드"}</h1>
          <p className="hint">
            {role === "super"
              ? "일자별/게이트별 현황을 확인하고 필요한 경우 수치를 수정할 수 있습니다."
              : "일자별/게이트별 현황만 조회할 수 있습니다."}
          </p>
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

      <AdminDashboard initialRows={rows} role={role} />
    </main>
  );
}
