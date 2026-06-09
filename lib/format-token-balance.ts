export function formatTokenBalance(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

export const formatCreditBalance = formatTokenBalance;
