import type { SupabaseClient } from "@supabase/supabase-js";

export type Match = {
  id: string;
  round: number;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
};

export type StandingRow = {
  team_id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
};

export type Scorer = { player_id: string; full_name: string; team_id: string; goals: number };

/** Everything a league page shows: teams, fixtures by round, standings and top scorers. */
export async function loadLeague(supabase: SupabaseClient, competitionId: string) {
  const [{ data: teams }, { data: matches }, { data: standings }, { data: scorers }] = await Promise.all([
    supabase.from("teams").select("id, name").eq("competition_id", competitionId).order("created_at"),
    supabase
      .from("matches")
      .select("id, round, home_team_id, away_team_id, home_score, away_score, status")
      .eq("competition_id", competitionId)
      .order("round")
      .order("created_at")
      .returns<Match[]>(),
    supabase
      .from("standings")
      .select("team_id, team_name, played, won, drawn, lost, goals_for, goals_against, goal_difference, points")
      .eq("competition_id", competitionId)
      .order("points", { ascending: false })
      .order("goal_difference", { ascending: false })
      .order("goals_for", { ascending: false })
      .order("team_name")
      .returns<StandingRow[]>(),
    supabase
      .from("top_scorers")
      .select("player_id, full_name, team_id, goals")
      .eq("competition_id", competitionId)
      .order("goals", { ascending: false })
      .limit(10)
      .returns<Scorer[]>(),
  ]);

  const teamList = (teams ?? []) as { id: string; name: string }[];
  const rounds = new Map<number, Match[]>();
  for (const m of matches ?? []) rounds.set(m.round, [...(rounds.get(m.round) ?? []), m]);

  return {
    teams: teamList,
    teamName: new Map(teamList.map((t) => [t.id, t.name])),
    matches: matches ?? [],
    rounds,
    standings: standings ?? [],
    scorers: scorers ?? [],
    anyFinished: (matches ?? []).some((m) => m.status === "finished"),
  };
}

export type League = Awaited<ReturnType<typeof loadLeague>>;

/** Teams that don't play in a round (one per round when the team count is odd). */
export function restingTeams(league: League, games: Match[]): string[] {
  const playing = new Set(games.flatMap((g) => [g.home_team_id, g.away_team_id]));
  return league.teams.filter((t) => !playing.has(t.id)).map((t) => t.name);
}
