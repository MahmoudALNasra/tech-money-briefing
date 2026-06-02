import type { Article } from "@/lib/types";
import {
  getReferralLinksForText,
  isExternalReferralUrl
} from "@/lib/referral-links";

type ArticleReferralLinksProps = {
  article: Article;
};

export function ArticleReferralLinks({ article }: ArticleReferralLinksProps) {
  const referrals = getReferralLinksForText(
    `${article.title}\n${article.meta_description}\n${article.content}`,
    3
  );

  if (referrals.length === 0) {
    return null;
  }

  return (
    <aside className="mt-10 rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-stone-50 p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
        Relevant referral links
      </p>
      <h2 className="mt-3 text-xl font-black tracking-tight text-ink">
        Tools mentioned in this briefing
      </h2>
      <p className="mt-3 text-sm leading-6 text-stone-700">
        Some links below may be referral links. They can support Tech Revenue
        Brief, but the recommendation should still match your use case, budget,
        and current product terms.
      </p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {referrals.map((referral) => (
          <a
            key={referral.product}
            href={referral.href}
            target={isExternalReferralUrl(referral.href) ? "_blank" : undefined}
            rel={
              isExternalReferralUrl(referral.href)
                ? "sponsored nofollow noopener noreferrer"
                : undefined
            }
            className="group rounded-3xl border border-stone-900 bg-stone-950 p-5 text-white shadow-xl shadow-stone-950/15 transition hover:-translate-y-1 hover:bg-emerald-700 hover:shadow-2xl"
          >
            <span className="text-[0.65rem] font-black uppercase tracking-[0.22em] text-emerald-200">
              Referral link
            </span>
            <span className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 text-sm font-black text-ink transition group-hover:bg-emerald-50">
              Open {referral.product}
              <span aria-hidden="true">{"->"}</span>
            </span>
            <span className="mt-3 block text-xs leading-5 text-stone-300">
              {referral.disclosure}
            </span>
          </a>
        ))}
      </div>
    </aside>
  );
}
