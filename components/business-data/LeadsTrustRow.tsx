export function LeadsTrustRow() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs font-semibold text-stone-600 shadow-sm">
      <span className="font-black uppercase tracking-[0.16em] text-stone-500">Pay securely</span>
      <span>Stripe checkout</span>
      <span>Card</span>
      <span>Apple Pay</span>
      <span>Google Pay</span>
      <span>Link</span>
      <span className="text-emerald-700">One-time credit packs · no subscription required</span>
    </div>
  );
}
