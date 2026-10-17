export declare const SCENE_KINDS: { value: string; label: string }[];
export declare function sceneKindLabel(value: unknown): string;
export declare function validateSceneEvent(input: Record<string, unknown>, now?: Date): { error: string; event?: undefined } | { error?: undefined; event: { title: string; kind: string; starts_at: string; ends_at: string | null; venue_name: string | null; area_id: string | null; organiser: string; description: string | null; url: string } };
