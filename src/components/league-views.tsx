import Link from "next/link";
import { restingTeams, type League } from "@/lib/league-data";

export function StandingsTable({ league }: { league: League }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-zinc-500">
          <tr>
            <th className="py-1 pr-2">#</th>
            <th className="py-1 pr-2">Ekipa</th>
            <th className="px-1 text-center" title="Odigrano">O</th>
            <th className="px-1 text-center" title="Pobjede">P</th>
            <th className="px-1 text-center" title="Neriješeno">N</th>
            <th className="px-1 text-center" title="Porazi">I</th>
            <th className="px-1 text-center" title="Golovi">G</th>
            <th className="px-1 text-center font-bold" title="Bodovi">B</th>
          </tr>
        </thead>
        <tbody>
          {league.standings.map((s, i) => (
            <tr key={s.team_id} className="border-t border-zinc-200 dark:border-zinc-800">
              <td className="py-1 pr-2 text-zinc-500">{i + 1}</td>
              <td className="py-1 pr-2">{s.team_name}</td>
              <td className="px-1 text-center">{s.played}</td>
              <td className="px-1 text-center">{s.won}</td>
              <td className="px-1 text-center">{s.drawn}</td>
              <td className="px-1 text-center">{s.lost}</td>
              <td className="px-1 text-center">{`${s.goals_for}:${s.goals_against}`}</td>
              <td className="px-1 text-center font-bold">{s.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ScorersList({ league }: { league: League }) {
  if (league.scorers.length === 0) return null;
  return (
    <ol className="flex flex-col gap-1 text-sm">
      {league.scorers.map((s) => (
        <li key={s.player_id} className="flex justify-between">
          <span>{`${s.full_name} · ${league.teamName.get(s.team_id) ?? ""}`}</span>
          <span className="font-semibold">{s.goals}</span>
        </li>
      ))}
    </ol>
  );
}

/** Fixtures grouped by round; `matchHref` makes each fixture a link (organizer view). */
export function Fixtures({ league, matchHref }: { league: League; matchHref?: (id: string) => string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[...league.rounds].map(([round, games]) => (
        <div key={round} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <h3 className="mb-2 font-semibold">{`${round}. kolo`}</h3>
          <ul className="flex flex-col gap-1 text-sm">
            {games.map((g) => {
              const row = (
                <>
                  <span>{`${league.teamName.get(g.home_team_id)} – ${league.teamName.get(g.away_team_id)}`}</span>
                  <span className={g.status === "finished" ? "font-semibold" : "text-zinc-400"}>
                    {g.status === "finished" ? `${g.home_score}:${g.away_score}` : "–:–"}
                  </span>
                </>
              );
              return (
                <li key={g.id}>
                  {matchHref ? (
                    <Link
                      href={matchHref(g.id)}
                      className="flex justify-between gap-2 rounded px-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      {row}
                    </Link>
                  ) : (
                    <div className="flex justify-between gap-2 px-1">{row}</div>
                  )}
                </li>
              );
            })}
          </ul>
          {restingTeams(league, games).map((name) => (
            <p key={name} className="mt-2 text-xs text-zinc-500">{`Slobodna: ${name}`}</p>
          ))}
        </div>
      ))}
    </div>
  );
}
