"use client";

import { useEffect, useRef, useState } from "react";

import { ChevronDownIcon } from "@/components/business-data/ChevronDownIcon";

type MaskedRangeInputProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  mode: "decimal" | "integer";
  min: number;
  max: number;
  step: number;
};

const MAX_RATING_TENTHS = 50;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ratingToDigits(tenths: number) {
  const clamped = clamp(Math.round(tenths), 0, MAX_RATING_TENTHS);
  if (clamped === 0) {
    return "";
  }

  return String(clamped);
}

function digitsToRatingTenths(digits: string) {
  if (!digits) {
    return 0;
  }

  return clamp(Number.parseInt(digits, 10), 0, MAX_RATING_TENTHS);
}

function formatRatingDigits(digits: string) {
  return (digitsToRatingTenths(digits) / 10).toFixed(1);
}

function integerToDigits(value: number, max: number) {
  const clamped = clamp(Math.round(value), 0, max);
  if (clamped === 0) {
    return "";
  }

  return String(clamped);
}

function digitsToInteger(digits: string, max: number) {
  if (!digits) {
    return 0;
  }

  return clamp(Number.parseInt(digits, 10), 0, max);
}

export function MaskedRangeInput({
  id,
  label,
  value,
  onChange,
  mode,
  min,
  max,
  step
}: MaskedRangeInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [digits, setDigits] = useState(() =>
    mode === "decimal"
      ? ratingToDigits(Math.round(value * 10))
      : integerToDigits(value, max)
  );

  useEffect(() => {
    setDigits(
      mode === "decimal"
        ? ratingToDigits(Math.round(value * 10))
        : integerToDigits(value, max)
    );
  }, [mode, max, value]);

  const displayValue =
    mode === "decimal" ? formatRatingDigits(digits) : digits === "" ? "0" : digits;

  const commitDigits = (nextDigits: string) => {
    setDigits(nextDigits);

    if (mode === "decimal") {
      onChange(digitsToRatingTenths(nextDigits) / 10);
      return;
    }

    onChange(digitsToInteger(nextDigits, max));
  };

  const bump = (direction: 1 | -1) => {
    const next =
      mode === "decimal"
        ? clamp(value + direction * step, min, max)
        : clamp(Math.round(value) + direction * step, min, max);

    onChange(Number(next.toFixed(mode === "decimal" ? 1 : 0)));
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleBeforeInput = (
    event: React.FormEvent<HTMLInputElement> & { nativeEvent: InputEvent }
  ) => {
    const inputType = event.nativeEvent.inputType;

    if (inputType === "deleteContentBackward") {
      event.preventDefault();
      commitDigits(digits.slice(0, -1));
      return;
    }

    if (inputType === "deleteContentForward") {
      event.preventDefault();
      commitDigits("");
      return;
    }

    if (inputType === "insertText") {
      const data = event.nativeEvent.data;
      if (!data || !/^\d$/.test(data)) {
        event.preventDefault();
        return;
      }

      event.preventDefault();
      const nextDigits = `${digits}${data}`.slice(mode === "decimal" ? -2 : -4);

      if (mode === "decimal") {
        if (digitsToRatingTenths(nextDigits) > MAX_RATING_TENTHS) {
          return;
        }
      } else if (digitsToInteger(nextDigits, max) > max) {
        return;
      }

      commitDigits(nextDigits);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      bump(1);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      bump(-1);
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      commitDigits(digits.slice(0, -1));
      return;
    }

    if (event.key === "Delete") {
      event.preventDefault();
      commitDigits("");
      return;
    }

    if (/^\d$/.test(event.key)) {
      event.preventDefault();
      const nextDigits = `${digits}${event.key}`.slice(mode === "decimal" ? -2 : -4);

      if (mode === "decimal") {
        if (digitsToRatingTenths(nextDigits) > MAX_RATING_TENTHS) {
          return;
        }
      } else if (digitsToInteger(nextDigits, max) > max) {
        return;
      }

      commitDigits(nextDigits);
    }
  };

  const atMax = mode === "decimal" ? value >= max - 0.0001 : value >= max;
  const atMin = value <= min + 0.0001;

  return (
    <label htmlFor={id} className="block flex-1 text-sm font-semibold text-stone-800">
      {label}
      <div className="mt-2 flex items-stretch gap-2">
        <input
          id={id}
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={displayValue}
          onBeforeInput={handleBeforeInput}
          onKeyDown={handleKeyDown}
          onChange={() => undefined}
          onFocus={(event) => {
            const input = event.currentTarget;
            requestAnimationFrame(() => {
              const end = input.value.length;
              input.setSelectionRange(end, end);
            });
          }}
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold tabular-nums text-stone-950 shadow-sm outline-none ring-emerald-200 focus:border-emerald-300 focus:ring-4"
        />
        <div className="flex min-h-11 w-11 shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-stone-50 shadow-sm">
          <button
            type="button"
            aria-label={`Increase ${label.toLowerCase()}`}
            onClick={() => bump(1)}
            disabled={atMax}
            className="flex flex-1 items-center justify-center border-b border-stone-200 text-stone-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronDownIcon className="h-4 w-4 rotate-180" />
          </button>
          <button
            type="button"
            aria-label={`Decrease ${label.toLowerCase()}`}
            onClick={() => bump(-1)}
            disabled={atMin}
            className="flex flex-1 items-center justify-center text-stone-800 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </label>
  );
}
