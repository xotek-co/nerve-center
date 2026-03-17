import dynamic from "next/dynamic";
import type { Metadata } from "next";

const CeoCommandCenter = dynamic(
  () => import("@/components/ceo/CeoCommandCenter").then((m) => ({ default: m.CeoCommandCenter })),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Loading dashboard…</p>
      </div>
    ),
  }
);

export const metadata: Metadata = {
  title: "CEO Command Center | Nerve Center",
  description: "Live pulse, intelligence grid, and daily reports",
};

export default function CeoCommandCenterPage() {
  return <CeoCommandCenter />;
}
