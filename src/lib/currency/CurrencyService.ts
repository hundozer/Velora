import { CurrencyCode } from "@/types";

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; name: string; symbol: string; rateFromUSD: number }[] = [
  { code: "USD", name: "US Dollar", symbol: "$", rateFromUSD: 1.0 },
  { code: "EUR", name: "Euro", symbol: "€", rateFromUSD: 0.92 },
  { code: "GBP", name: "British Pound", symbol: "£", rateFromUSD: 0.78 },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč", rateFromUSD: 23.2 },
  { code: "PLN", name: "Polish Złoty", symbol: "zł", rateFromUSD: 3.95 },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", rateFromUSD: 365.0 },
];

export class CurrencyService {
  static convert(amountInUSD: number, targetCurrency: CurrencyCode): number {
    const config = SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency) || SUPPORTED_CURRENCIES[0];
    return amountInUSD * config.rateFromUSD;
  }

  static format(amountInUSD: number, targetCurrency: CurrencyCode = "USD"): string {
    const config = SUPPORTED_CURRENCIES.find((c) => c.code === targetCurrency) || SUPPORTED_CURRENCIES[0];
    const converted = amountInUSD * config.rateFromUSD;

    if (targetCurrency === "CZK" || targetCurrency === "HUF") {
      return `${Math.round(converted).toLocaleString()} ${config.symbol}`;
    }

    return `${config.symbol}${converted.toFixed(2)}`;
  }
}
