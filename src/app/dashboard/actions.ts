"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { roundRobin } from "@/lib/schedule";
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

export async function clearSchedule(slug: string, competitionId: string) {
  const { supabase } = await requireUser();
  await supabase.from("matches").delete().eq("competition_id", competitionId);
  revalidatePath(`/dashboard/${slug}`);
}
