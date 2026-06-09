import Image from "next/image";
import Link from "next/link";

type LoadingMascotProps = {
  label?: string;
  description?: string;
  showBusinessDataLink?: boolean;
};

export function LoadingMascot({
  label = "Scanning the market...",
  description = "The cat-bot is quietly gathering clues, comparing signals, and shaping the business report for you.",
  showBusinessDataLink = false
}: LoadingMascotProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <div className="relative h-24 w-24 animate-bounce">
        <Image
          src="/assistant-mascot-body.svg"
          alt="Running assistant mascot"
          fill
          className="object-contain"
          priority
        />
      </div>
      <p className="text-sm font-black text-ink">{label}</p>
      <p className="max-w-sm text-xs leading-6 text-stone-500">
        {description}
      </p>
      {showBusinessDataLink ? (
        <Link
          href="/business-data-generator?source=loading_mascot"
          className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800"
        >
          Open paid competitor report
        </Link>
      ) : null}
    </div>
  );
}
