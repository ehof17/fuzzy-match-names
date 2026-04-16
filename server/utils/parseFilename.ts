import path from "path";

export interface Player {
  name: string;
  league: string;
  position: string;
  years_active: string;
  external_id: string;
}

export function parseFilename(filename: string, league: string): Player | null {
  const base = path.basename(filename, ".html");
  const parts = base.split("-");

  const endYear = parts.at(-1)!;
  const startYear = parts.at(-2)!;
  const position = parts[0];
  const namePart = parts.slice(1, -2).join("-");
  const name = namePart.replace(/_/g, " ");

  if (!name || !/^\d{4}$/.test(startYear) || !/^\d{4}$/.test(endYear)) {
    return null;
  }

  return {
    name,
    league: league.toUpperCase(),
    position,
    years_active: `${startYear}-${endYear}`,
    external_id: base,
  };
}
