export interface BoundarySentence { kind: string; text: string; appliesToViewer: boolean }
export declare function boundarySentences(boundaries: Record<string, string>, who?: { subject?: string; viewerCategory?: string | null; viewerVerified?: boolean }): BoundarySentence[];
export declare function approachFor(input: {
  name: string; boundaries: Record<string, string>;
  recipient: { allow_direct_messages?: boolean | null; message_permission?: string | null } | null;
  viewer: { gender?: string | null; isCoupleProfile?: boolean | null; verified: boolean };
  established: boolean; friends: boolean;
}): { canWrite: boolean; line: string | null };
