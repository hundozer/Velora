import React from "react";

/** People keeps its list mounted while a profile opens over it in the `sheet` slot. */
export default function PeopleLayout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  return <>{children}{sheet}</>;
}
