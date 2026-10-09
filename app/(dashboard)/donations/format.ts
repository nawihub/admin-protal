import type { DonationMethod, Money } from "@/lib/api/types";

/** "SLE 1,250", "$25.50". */
export function formatMoney({ value, currency }: Money) {
  if (currency === "USD") return `$${value.toLocaleString("en-US", { minimumFractionDigits: value % 1 ? 2 : 0, maximumFractionDigits: 2 })}`;
  return `${currency} ${value.toLocaleString("en-GB", { maximumFractionDigits: 2 })}`;
}

export const METHOD_LABEL: Record<DonationMethod, string> = { MOBILE_MONEY: "Mobile money", CARD: "Card" };
