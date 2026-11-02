"use client";

import { useTranslation } from "@/context/LanguageContext";
import React from "react";
import { AREAS, type AreaKind } from "@/lib/areas.mjs";

const GROUPS: { kind: AreaKind; label: string }[] = [
  { kind: "PRAGUE_DISTRICT", label: "Prague" },
  { kind: "NEAR_PRAGUE", label: "Near Prague" },
  { kind: "CZECHIA", label: "Czechia" },
  { kind: "ABROAD", label: "Elsewhere" },
];

/** Area picker (P1-03). Members choose a district or nearby town, never a position. */
export function AreaSelect({ value, onChange, className, id }: {
  value: string;
  onChange: (areaId: string) => void;
  className?: string;
  id?: string;
}) {
  const { t } = useTranslation();
  return (
    <select id={id} className={className} value={value} onChange={(event) => onChange(event.target.value)}>
      <option value="">{t("Choose your area")}</option>
      {GROUPS.map((group) => (
        <optgroup key={group.kind} label={t(group.label)}>
          {AREAS.filter((area) => area.kind === group.kind).map((area) => (
            <option key={area.id} value={area.id}>
              {area.kind === "PRAGUE_DISTRICT" ? `${area.name} · ${area.label}` : t(area.name)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
