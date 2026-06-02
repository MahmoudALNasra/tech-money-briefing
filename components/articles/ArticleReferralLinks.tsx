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
    <aside className="mt-10 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
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
            className="rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-400"
          >
            <span className="text-sm font-black text-ink">
              Open {referral.product}
            </span>
            <span className="mt-2 block text-xs leading-5 text-stone-600">
              {referral.disclosure}
            </span>
          </a>
        ))}
      </div>
    </aside>
  );
}
