export declare const VARIANT_WIDTHS: number[];
export declare const VARIANT_CONTENT_TYPE: string;
export declare const VARIANT_CACHE_CONTROL: string;
export declare function variantKey(mediaId: string, width: number): string;
export declare function pickVariantWidth(variants: Record<string, string> | null | undefined, requested: number): number | null;
export declare function parseRequestedWidth(value: unknown): number | null;
export type VariantBuild =
  | { status: "SKIPPED"; reason: string }
  | { status: "READY"; files: { width: number; buffer: Buffer }[]; dominantColor: string; lqip: string; sourceWidth: number };
export declare function buildImageVariants(input: Buffer): Promise<VariantBuild>;
export type VariantResult = { status: "READY" | "FAILED" | "SKIPPED"; reason?: string; variants?: Record<string, string>; dominantColor?: string; lqip?: string };
export declare function processMediaVariants(args: {
  media: { id: string; object_key: string; mime_type: string };
  readObject: (key: string) => Promise<Buffer>;
  writeObject: (key: string, body: Buffer, contentType: string, cacheControl: string) => Promise<void>;
  recordResult: (result: VariantResult) => Promise<void>;
  timeoutMs?: number;
}): Promise<VariantResult>;
