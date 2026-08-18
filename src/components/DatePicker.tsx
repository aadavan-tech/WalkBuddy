import React, { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DatePickerProps {
  /** ISO date string, "YYYY-MM-DD". */
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Dates before this ISO string are not selectable. */
  minDate?: string;
  /** Dates after this ISO string are not selectable. */
  maxDate?: string;
  placeholder?: string;
}

const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseISODate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/**
 * Fully themed replacement for `<input type="date">` — the browser's native
 * calendar popup can't be restyled with CSS, so this renders its own.
 */
export default function DatePicker({ value, onChange, className = "", minDate, maxDate, placeholder }: DatePickerProps) {
  const selected = parseISODate(value);
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => selected || new Date());
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen]);

  const openPicker = () => {
    setViewMonth(selected || new Date());
    setIsOpen(true);
  };

  const min = parseISODate(minDate || "");
  const max = parseISODate(maxDate || "");

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startWeekday = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const today = new Date();

  const displayValue = selected
    ? selected.toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })
    : placeholder || "Select date";

  return (
    <div className={`relative ${className}`} ref={rootRef}>
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openPicker())}
        className="w-full flex items-center justify-between gap-2 border border-black/30 bg-[#fbf6ec] px-3 py-2 text-xs text-[var(--wb-text)] hover:border-black transition-colors"
      >
        <span className={selected ? "font-bold" : "text-gray-400"}>{displayValue}</span>
        <Calendar className="w-3.5 h-3.5 text-black shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-[2100] mt-1.5 w-64 bg-[#fbf6ec] border border-black shadow-xl p-3 left-0">
          <div className="flex items-center justify-between mb-2.5">
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
              className="p-1 text-black hover:bg-black/5 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-headline text-xs font-black uppercase tracking-wider text-black">
              {viewMonth.toLocaleDateString("en", { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
              className="p-1 text-black hover:bg-black/5 transition-colors"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-1">
            {WEEKDAY_LABELS.map((w, i) => (
              <div key={`${w}-${i}`} className="text-[9px] font-black uppercase text-gray-500 text-center">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;
              const disabled =
                (min ? date < new Date(min.getFullYear(), min.getMonth(), min.getDate()) : false) ||
                (max ? date > new Date(max.getFullYear(), max.getMonth(), max.getDate()) : false);
              const isSelected = selected ? isSameDay(date, selected) : false;
              const isToday = isSameDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(toISODate(date));
                    setIsOpen(false);
                  }}
                  className={`w-8 h-8 text-[11px] font-bold transition-colors ${
                    isSelected
                      ? "bg-black text-white"
                      : disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : isToday
                      ? "text-black border border-black/50 hover:bg-black/5"
                      : "text-[var(--wb-text)] hover:bg-black/5"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
