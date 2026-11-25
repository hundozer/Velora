export type TonightDiscoveryContext = { area: string; when: "all" | "now" | "tonight" | "upcoming"; view: "list" | "map" };
export function parseTonightDiscovery(search: string | URLSearchParams): TonightDiscoveryContext;
export function tonightDiscoveryHref(input: TonightDiscoveryContext): string;
export function discoveryPlanHref(id: string, input: TonightDiscoveryContext): string;
