export default defineEventHandler(async (event) => {
  const { q, league } = getQuery(event) as { q?: string; league?: string };

  if (!q || q.trim().length < 2) {
    return [];
  }

  const { db } = useNitroApp();
  const query = q.trim();

  const leagueFilter = league ? "AND league = $2" : "";
  const params: (string | number)[] = [query];
  if (league) params.push(league.toUpperCase());

  const { rows } = await db.query(
    `SELECT id, name, league, position, team, years_active
     FROM players
     WHERE (name % $1 OR name ILIKE $1 || '%')
     ${leagueFilter}
     ORDER BY similarity(name, $1) DESC
     LIMIT 15`,
    params
  );

  return rows;
});
