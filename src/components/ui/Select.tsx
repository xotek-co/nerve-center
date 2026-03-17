"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type SelectOption = { value: string; label: string };

const dropdownVariants = {
  closed: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
  open: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.96,
    transition: { duration: 0.15 },
  },
};

const optionVariants = {
  closed: { opacity: 0, x: -4 },
  open: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: 0.02 * i },
  }),
};

export function Select({
  value,
  onChange,
  options,
  placeholder,
  label,
  className = "",
  title,
  "aria-label": ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label?: string;
  className?: string;
  title?: string;
  "aria-label"?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayLabel = selectedOption?.label ?? placeholder ?? "Select…";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    const idx = options.findIndex((o) => o.value === value);
    if (e.key === "ArrowDown" && idx < options.length - 1) {
      e.preventDefault();
      onChange(options[idx + 1].value);
    } else if (e.key === "ArrowUp" && idx > 0) {
      e.preventDefault();
      onChange(options[idx - 1].value);
    } else if (e.key === "Enter" && idx >= 0) {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`group/select relative ${className}`}>
      {label && (
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        title={title}
        aria-label={ariaLabel ?? label}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-12 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition-all duration-200 hover:border-slate-300 hover:bg-slate-50/80 hover:shadow focus:border-indigo-500 focus:bg-white focus:shadow-md focus:ring-2 focus:ring-indigo-500/25 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-500 dark:hover:bg-slate-700/80 dark:focus:border-indigo-400 dark:focus:bg-slate-800 dark:focus:ring-indigo-400/25"
      >
        <span className={`min-w-0 truncate ${!selectedOption ? "text-slate-400 dark:text-slate-500" : ""}`}>
          {displayLabel}
        </span>
        <span
          className={`pointer-events-none absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-all duration-200 group-hover/select:bg-slate-200 group-hover/select:text-slate-700 dark:bg-slate-700/80 dark:text-slate-400 dark:group-hover/select:bg-slate-600 dark:group-hover/select:text-slate-300 ${
            open ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : ""
          }`}
        >
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <ChevronDown className="h-4 w-4 shrink-0" />
          </motion.span>
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label={ariaLabel ?? label}
            initial="closed"
            animate="open"
            exit="exit"
            variants={dropdownVariants}
            className="absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl ring-1 ring-slate-900/5 scrollbar-thin dark:border-slate-600 dark:bg-slate-800 dark:ring-slate-100/5"
          >
            {options.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <motion.button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  variants={optionVariants}
                  custom={i}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-indigo-50 active:bg-indigo-100/80 dark:hover:bg-indigo-500/10 dark:active:bg-indigo-500/20 ${
                    isSelected
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300"
                      : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {opt.label}
                  {isSelected && (
                    <span className="ml-auto text-indigo-600 dark:text-indigo-400" aria-hidden>
                      ✓
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
