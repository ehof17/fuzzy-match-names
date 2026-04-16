import { parseFilename } from "../../utils/parseFilename";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  const league: string = body?.league;
  const filenames: string[] = Array.isArray(body?.filenames)
    ? body.filenames
    : body?.filename
    ? [body.filename]
    : [];

  if (!league) {
    throw createError({ statusCode: 400, message: "league is required" });
  }
  if (filenames.length === 0) {
    throw createError({
      statusCode: 400,
      message: "filename or filenames is required",
    });
  }

  const players = filenames.map((f) => parseFilename(f, league)).filter(Boolean);

  if (players.length === 0) {
    throw createError({ statusCode: 400, message: "No valid filenames parsed" });
  }

  const { db } = useNitroApp();
  const values: (string | null)[] = [];
  const placeholders = players.map((p, i) => {
    const base = i * 5;
    values.push(p!.name, p!.league, p!.position, p!.years_active, p!.external_id);
    return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
  });

  const result = await db.query(
    `INSERT INTO players (name, league, position, years_active, external_id)
     VALUES ${placeholders.join(", ")}
     ON CONFLICT (external_id) WHERE external_id IS NOT NULL DO NOTHING
     RETURNING id, name, league, position, years_active`,
    values
  );

  return {
    inserted: result.rowCount,
    players: result.rows,
  };
});
