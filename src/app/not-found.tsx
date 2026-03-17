import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 px-4 dark:bg-slate-900">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Page not found</h1>
      <p className="text-slate-600 dark:text-slate-400">
        The page you’re looking for doesn’t exist or was moved.
      </p>
      <Link
        href="/"
        className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
      >
        Back to sign in
      </Link>
    </div>
  );
}
