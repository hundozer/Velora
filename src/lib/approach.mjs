// How to approach a member, in sentences (editorial redesign, Phase 2). Built from the
// same resolved boundaries POST /api/messages enforces (src/lib/boundaries.mjs), so the
// profile never promises something the server would refuse.
import { firstMessageDecision, senderCategory } from "./boundaries.mjs";

const FIRST = [
  ["FIRST_MESSAGE_WOMEN", "women"],
  ["FIRST_MESSAGE_MEN", "men"],
  ["FIRST_MESSAGE_COUPLES", "couples"],
  ["FIRST_MESSAGE_OTHER", "non-binary and trans people"],
];
const WORDS = Object.fromEntries(FIRST);
const list = (words) => words.length <= 1 ? words.join("") : `${words.slice(0, -1).join(", ")} and ${words[words.length - 1]}`;
const cap = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Sentences for "Her boundaries". Each item: { text, kind, appliesToViewer }.
 * @param {Record<string,string>} b resolved boundaries
 * @param {{ subject: string, viewerCategory?: string | null, viewerVerified?: boolean }} who
 */
export function boundarySentences(b, { subject = "they", viewerCategory = null, viewerVerified = true } = {}) {
  const out = [];
  const welcome = FIRST.filter(([id]) => b[id] === "COMFORTABLE").map(([, word]) => word);
  const ask = FIRST.filter(([id]) => b[id] === "ASK_FIRST");
  const closed = FIRST.filter(([id]) => b[id] === "NOT_INTERESTED");
  if (welcome.length === FIRST.length) out.push({ kind: "FIRST", text: "First messages from anyone are welcome.", appliesToViewer: false });
  else if (welcome.length) out.push({ kind: "FIRST", text: `First messages from ${list(welcome)} are welcome.`, appliesToViewer: false });
  for (const [id, word] of ask) out.push({ kind: id, text: `${cap(word)}: introduce yourself before anything else.`, appliesToViewer: viewerCategory === id });
  if (closed.length) out.push({ kind: "FIRST_CLOSED", text: `Not taking first messages from ${list(closed.map(([, word]) => word))}.`, appliesToViewer: closed.some(([id]) => id === viewerCategory) });
  if (b.FIRST_MESSAGE_UNVERIFIED === "ASK_FIRST") out.push({ kind: "FIRST_MESSAGE_UNVERIFIED", text: "Unverified members: introduce yourself first.", appliesToViewer: !viewerVerified });
  if (b.FIRST_MESSAGE_UNVERIFIED === "NOT_INTERESTED") out.push({ kind: "FIRST_MESSAGE_UNVERIFIED", text: "Only verified members can write first.", appliesToViewer: !viewerVerified });
  const media = { COMFORTABLE: "Explicit photographs are fine in chat.", ASK_FIRST: `Explicit photographs only after ${subject} ${subject === "they" ? "have" : "has"} replied.`, NOT_INTERESTED: "No explicit photographs in chat." }[b.EXPLICIT_MEDIA_IN_CHAT];
  if (media) out.push({ kind: "EXPLICIT_MEDIA_IN_CHAT", text: media, appliesToViewer: false });
  const sameDay = { COMFORTABLE: "Happy to meet the same day.", ASK_FIRST: "Ask before suggesting meeting the same day.", NOT_INTERESTED: "Not meeting the same day." }[b.MEET_SAME_DAY];
  if (sameDay) out.push({ kind: "MEET_SAME_DAY", text: sameDay, appliesToViewer: false });
  const chat = { ASK_FIRST: "Ask before explicit chat early on.", NOT_INTERESTED: "No explicit chat early on." }[b.EXPLICIT_CHAT];
  if (chat) out.push({ kind: "EXPLICIT_CHAT", text: chat, appliesToViewer: false });
  return out;
}

/**
 * Whether the viewer may write first, and the one line shown above "Begin a conversation".
 * Mirrors POST /api/messages (which stays authoritative): message permission, then boundaries.
 * @returns {{ canWrite: boolean, line: string | null }}
 */
export function approachFor({ name, boundaries, recipient, viewer, established, friends }) {
  if (recipient?.allow_direct_messages === false) return { canWrite: false, line: `${name} isn't taking messages right now.` };
  if (established) return { canWrite: true, line: null };
  if (recipient?.message_permission === "PRIVATE") return { canWrite: false, line: `${name} only writes first.` };
  if (recipient?.message_permission === "FRIENDS_ONLY" && !friends) return { canWrite: false, line: `${name} takes messages from friends only.` };
  if (recipient?.message_permission === "VERIFIED_ONLY" && !viewer.verified) return { canWrite: false, line: `${name} takes messages from verified members. Verify your photo to write.` };
  const decision = firstMessageDecision(boundaries, viewer);
  if (!decision.allowed) return { canWrite: false, line: decision.reason.replace(/^This member/, name) };
  const category = senderCategory(viewer.gender, viewer.isCoupleProfile);
  if (boundaries[category] === "ASK_FIRST") return { canWrite: true, line: `${name} asks ${WORDS[category]} to introduce themselves first.` };
  if (!viewer.verified && boundaries.FIRST_MESSAGE_UNVERIFIED === "ASK_FIRST") return { canWrite: true, line: `${name} asks unverified members to introduce themselves first.` };
  return { canWrite: true, line: null };
}
