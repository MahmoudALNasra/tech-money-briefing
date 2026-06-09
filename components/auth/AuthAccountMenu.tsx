"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AccountProfile = {
  name: string;
  email: string;
  avatarUrl: string;
};

function readAccountProfile(user: {
  email?: string;
  user_metadata?: Record<string, unknown>;
}): AccountProfile {
  const name =
    String(user.user_metadata?.full_name ?? user.user_metadata?.name ?? "").trim() ||
    user.email?.split("@")[0] ||
    "Account";

  return {
    name,
    email: user.email ?? "",
    avatarUrl: String(user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? "").trim()
  };
}

export function AuthAccountMenu() {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<AccountProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    try {
      const supabase = getSupabaseBrowserClient();

      supabase.auth.getSession().then(({ data }) => {
        if (!mounted || !data.session?.user) {
          return;
        }

        setProfile(readAccountProfile(data.session.user));
      });

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setProfile(session?.user ? readAccountProfile(session.user) : null);
      });

      return () => {
        mounted = false;
        data.subscription.unsubscribe();
      };
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.replace("/");
    router.refresh();
  };

  if (!profile) {
    return null;
  }

  const initials = profile.name.slice(0, 2).toUpperCase();

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 text-sm font-bold text-stone-700 transition hover:-translate-y-0.5 hover:border-ink hover:text-ink"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span
          className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-200 bg-cover bg-center text-xs font-black uppercase text-stone-950"
          style={profile.avatarUrl ? { backgroundImage: `url(${profile.avatarUrl})` } : undefined}
          aria-hidden="true"
        >
          {profile.avatarUrl ? null : initials}
        </span>
        <span className="hidden max-w-[9rem] truncate sm:inline">{profile.name}</span>
      </button>

      {isOpen ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-stone-200 bg-white py-2 shadow-xl"
        >
          <div className="border-b border-stone-100 px-4 py-3">
            <p className="truncate text-sm font-black text-ink">{profile.name}</p>
            <p className="truncate text-xs text-stone-500">{profile.email}</p>
          </div>
          <Link
            href="/profile"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Profile
          </Link>
          <Link
            href="/profile#settings"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Settings
          </Link>
          <Link
            href="/profile#reports"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Reports
          </Link>
          <Link
            href="/profile#credits"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
          >
            Buy more credits
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut()}
            className="block w-full px-4 py-2.5 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}
