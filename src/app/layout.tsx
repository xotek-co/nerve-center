import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nerve Center",
  description: "Multi-tenant healthcare operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-900 dark:text-slate-100">
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="system"
          toastOptions={{
            classNames: {
              toast:
                "border border-slate-200/80 bg-white/95 text-slate-900 shadow-lg shadow-slate-900/5 backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/95 dark:text-slate-50",
              title: "text-sm font-semibold",
              description: "text-xs text-slate-500 dark:text-slate-400",
              actionButton:
                "rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600",
              cancelButton:
                "rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800",
              success:
                "border-emerald-200/80 bg-emerald-50/95 text-emerald-900 dark:border-emerald-700/80 dark:bg-emerald-900/40 dark:text-emerald-50",
              error:
                "border-rose-200/80 bg-rose-50/95 text-rose-900 dark:border-rose-800/80 dark:bg-rose-950/50 dark:text-rose-50",
              warning:
                "border-amber-200/80 bg-amber-50/95 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-50",
              info:
                "border-indigo-200/80 bg-indigo-50/95 text-indigo-900 dark:border-indigo-700/80 dark:bg-indigo-950/40 dark:text-indigo-50",
            },
          }}
        />
      </body>
    </html>
  );
}
