// Built-in room IDs are permanent links; their public names can change independently.
const builtinCopy: Record<string, { title: string; description: string }> = {
  introductions: { title: "Kinky Talk", description: "Talk desires, boundaries and what turns you on." },
  tonight: { title: "Sexpartner finder", description: "Find someone who's looking for sex and up for meeting." },
};

export function presentRoom<T extends { id: string; builtin: boolean; title: string; description: string }>(room: T): T {
  return room.builtin && builtinCopy[room.id] ? { ...room, ...builtinCopy[room.id] } : room;
}
