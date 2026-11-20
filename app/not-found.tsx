import Link from "next/link";
import { IconCompass } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <main className="min-h-dvh flex items-center justify-center p-6 bg-base-200">
      <section className="material-regular max-w-md w-full rounded-[28px] p-7 sm:p-9 text-center space-y-6 shadow-lg">
        <div
          aria-hidden="true"
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] surface-pastel-blush text-accent-primary"
        >
          <IconCompass className="w-8 h-8" />
        </div>

        <div className="space-y-2.5">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide surface-pastel-lilac text-accent-secondary">
            404 Not Found
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight text-base-content">
            지표 또는 페이지를 찾을 수 없습니다
          </h1>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: "var(--label-secondary)" }}
          >
            요청하신 반도체 공급망 엔티티 또는 경로가 존재하지 않습니다.
            아래 버튼을 눌러 fabnow 통합 수급 현황으로 돌아가십시오.
          </p>
        </div>

        <div className="pt-1">
          <Link
            href="/"
            className="btn btn-primary w-full rounded-[18px] pst-press font-bold shadow-sm"
          >
            fabnow 통합 수급 현황으로 돌아가기
          </Link>
        </div>
      </section>
    </main>
  );
}
