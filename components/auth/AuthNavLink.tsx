"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthAccountMenu } from "@/components/auth/AuthAccountMenu";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export function AuthNavLink() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isReady, setIsReady] = useState(
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = getSupabaseBrowserClient();

      supabase.auth.getSession().then(({ data }) => {
        if (!mounted) {
          return;
        }

        setIsSignedIn(Boolean(data.session));
        setIsReady(true);
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setIsSignedIn(Boolean(session));
        setIsReady(true);
      });

      return () => {
        mounted = false;
        data.subscription.unsubscribe();
      };
    } catch {
      return undefined;
    }
  }, []);

  if (isReady && isSignedIn) {
    return <AuthAccountMenu />;
  }

  const queryString = searchParams.toString();
  const currentPath = `${pathname}${queryString ? `?${queryString}` : ""}`;
  const nextPath = pathname === "/login" || pathname === "/signup" ? "/" : currentPath;

  return (
    <Link
      href={`/login?next=${encodeURIComponent(nextPath)}`}
      className="inline-flex whitespace-nowrap rounded-[3px] border border-white/[0.06] bg-white/[0.03] px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-secondary)] transition hover:-translate-y-0.5 hover:border-[var(--border-accent)] hover:text-[var(--text-primary)]"
    >
      Sign in
    </Link>
  );
}
