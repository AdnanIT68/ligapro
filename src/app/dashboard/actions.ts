"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { roundRobin } from "@/lib/schedule";
import { parseScore, parseShirtNumber, playerLabel } from "@/lib/score";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function createCompetition(formData: FormData) {
  const { supabase, user } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const season = String(formData.get("season") ?? "").trim() || null;
  const sport = String(formData.get("sport") ?? "futsal");
  if (name.length < 2 || name.length > 80) redirect("/dashboard/new?error=name");

  const base = slugify(name).padEnd(3, "0");
  // A few attempts with a short random suffix if the slug is already taken.
  for (let attempt = 0; attempt < 4; attempt++) {
    const slug = attempt === 0 ? base : `${base.slice(0, 54)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase
      .from("competitions")
      .insert({ owner_id: user.id, name, season, sport, slug });
    if (!error) redirect(`/dashboard/${slug}`);
    if (error.code !== "23505") break;
  }
  redirect("/dashboard/new?error=save");
}

export async function addTeam(slug: string, competitionId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (name) {
    await supabase.from("teams").insert({ competition_id: competitionId, name });
  }
  revalidatePath(`/dashboard/${slug}`);
}

export async function removeTeam(slug: string, teamId: string) {
  const { supabase } = await requireUser();
  await supabase.from("teams").delete().eq("id", teamId);
  revalidatePath(`/dashboard/${slug}`);
}

export async function generateSchedule(slug: string, competitionId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const doubleRound = formData.get("double") === "on";

  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("competition_id", competitionId);
  if ((count ?? 0) > 0) redirect(`/dashboard/${slug}?error=exists`);

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("competition_id", competitionId)
    .order("created_at");
  if (!teams || teams.length < 2) redirect(`/dashboard/${slug}?error=teams`);

  const fixtures = roundRobin(teams.map((t) => t.id), doubleRound).map((f) => ({
    competition_id: competitionId,
    round: f.round,
    home_team_id: f.home,
    away_team_id: f.away,
  }));
  const { error } = await supabase.from("matches").insert(fixtures);
  if (error) redirect(`/dashboard/${slug}?error=save`);
  revalidatePath(`/dashboard/${slug}`);
}

export async function saveResult(slug: string, matchId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const home = parseScore(formData.get("home"));
  const away = parseScore(formData.get("away"));
  const back = `/dashboard/${slug}/match/${matchId}`;
  if (home === null || away === null) redirect(`${back}?error=score`);

  const { error } = await supabase
    .from("matches")
    .update({ home_score: home, away_score: away, status: "finished" })
    .eq("id", matchId);
  if (error) redirect(`${back}?error=save`);
  revalidatePath(`/dashboard/${slug}`);
  redirect(back);
}

export async function resetResult(slug: string, matchId: string) {
  const { supabase } = await requireUser();
  await supabase.from("match_events").delete().eq("match_id", matchId);
  await supabase
    .from("matches")
    .update({ home_score: null, away_score: null, status: "scheduled" })
    .eq("id", matchId);
  revalidatePath(`/dashboard/${slug}`);
  revalidatePath(`/dashboard/${slug}/match/${matchId}`);
}

export async function addGoal(slug: string, matchId: string, formData: FormData) {
  const { supabase } = await requireUser();
  const teamId = String(formData.get("team") ?? "");
  const shirt = parseShirtNumber(formData.get("shirt"));
  const back = `/dashboard/${slug}/match/${matchId}`;
  if (!teamId || shirt === null) redirect(`${back}?error=shirt`);

  // Players are identified only by shirt number within their team.
  let { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("team_id", teamId)
    .eq("shirt_number", shirt)
    .maybeSingle();
  if (!player) {
    const { data: created } = await supabase
      .from("players")
      .insert({ team_id: teamId, shirt_number: shirt, full_name: playerLabel(shirt) })
      .select("id")
      .single();
    player = created;
  }
  if (!player) redirect(`${back}?error=save`);

  const type = formData.get("own") === "on" ? "own_goal" : "goal";
  await supabase.from("match_events").insert({ match_id: matchId, team_id: teamId, player_id: player.id, type });
  revalidatePath(back);
  revalidatePath(`/dashboard/${slug}`);
}

export async function removeEvent(slug: string, matchId: string, eventId: string) {
  const { supabase } = await requireUser();
  await supabase.from("match_events").delete().eq("id", eventId);
  revalidatePath(`/dashboard/${slug}/match/${matchId}`);
  revalidatePath(`/dashboard/${slug}`);
}

export async function clearSchedule(slug: string, competitionId: string) {
  const { supabase } = await requireUser();
  await supabase.from("matches").delete().eq("competition_id", competitionId);
  revalidatePath(`/dashboard/${slug}`);
}
