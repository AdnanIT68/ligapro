import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { addGoal, removeEvent, resetResult, saveResult } from "../../../actions";

const errors: Record<string, string> = {
  score: "Rezultat mora biti broj od 0 do 99 za obje ekipe.",
  shirt: "Izaberi ekipu i upiši broj dresa (0–99).",
  save: "Promjena nije spremljena. Pokušaj ponovo.",
};

const input = "rounded-lg border border-zinc-300 px-3 py-2 text-center dark:border-zinc-700 dark:bg-zinc-900";

export default function MatchPage(props: PageProps<"/dashboard/[slug]/match/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p className="text-zinc-500">Učitavanje…</p>}>
        <Match {...props} />
      </Suspense>
    </main>
  );
}

async function Match({ params, searchParams }: PageProps<"/dashboard/[slug]/match/[id]">) {
  const { slug, id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: match } = await supabase
    .from("matches")
    .select(
      "id, round, status, home_score, away_score, home_team_id, away_team_id, " +
        "competition:competitions!inner(owner_id, slug, name), " +
        "home:teams!matches_home_team_id_fkey(name), away:teams!matches_away_team_id_fkey(name)",
    )
    .eq("id", id)
    .maybeSingle<{
      id: string;
      round: number;
      status: string;
      home_score: number | null;
      away_score: number | null;
      home_team_id: string;
      away_team_id: string;
      competition: { owner_id: string; slug: string; name: string };
      home: { name: string };
      away: { name: string };
    }>();
  if (!match || match.competition.owner_id !== user.id || match.competition.slug !== slug) notFound();

  const { data: events } = await supabase
    .from("match_events")
    .select("id, type, team_id, player:players(shirt_number)")
    .eq("match_id", id)
    .order("created_at")
    .returns<{ id: string; type: string; team_id: string; player: { shirt_number: number | null } | null }[]>();

  const teamName = (teamId: string) => (teamId === match.home_team_id ? match.home.name : match.away.name);
  const finished = match.status === "finished";
  const message = typeof error === "string" ? errors[error] : undefined;

  return (
    <>
      <Link href={`/dashboard/${slug}`} className="text-sm text-zinc-500 hover:underline">
        ← {match.competition.name}
      </Link>
      <h1 className="text-center text-sm font-semibold uppercase tracking-wide text-zinc-500">
        {`${match.round}. kolo`}
      </h1>

      {message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}

      <form action={saveResult.bind(null, slug, id)} className="flex flex-col gap-4">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <label className="flex flex-col items-center gap-2 text-center font-semibold">
            {match.home.name}
            <input
              name="home"
              inputMode="numeric"
              required
              defaultValue={match.home_score ?? ""}
              className={`${input} w-20 text-2xl`}
            />
          </label>
          <span className="pt-8 text-2xl text-zinc-400">:</span>
          <label className="flex flex-col items-center gap-2 text-center font-semibold">
            {match.away.name}
            <input
              name="away"
              inputMode="numeric"
              required
              defaultValue={match.away_score ?? ""}
              className={`${input} w-20 text-2xl`}
            />
          </label>
        </div>
        <button className="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700">
          {finished ? "Ispravi rezultat" : "Spremi rezultat"}
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Strijelci</h2>
        <p className="text-xs text-zinc-500">Igrači se vode samo po broju dresa, bez imena.</p>
        <ul className="flex flex-col gap-1 text-sm">
          {(events ?? []).map((e) => (
            <li key={e.id} className="flex items-center justify-between">
              <span>
                {`#${e.player?.shirt_number ?? "?"} · ${teamName(e.team_id)}`}
                {e.type === "own_goal" && " (autogol)"}
              </span>
              <form action={removeEvent.bind(null, slug, id, e.id)}>
                <button className="text-zinc-400 hover:text-red-600" aria-label="Ukloni gol">
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addGoal.bind(null, slug, id)} className="flex flex-wrap items-center gap-2">
          <select name="team" required className={`${input} text-left`}>
            <option value={match.home_team_id}>{match.home.name}</option>
            <option value={match.away_team_id}>{match.away.name}</option>
          </select>
          <input name="shirt" inputMode="numeric" required placeholder="Br. dresa" className={`${input} w-28`} />
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" name="own" /> autogol
          </label>
          <button className="rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
            Dodaj gol
          </button>
        </form>
      </section>

      {finished && (
        <form action={resetResult.bind(null, slug, id)}>
          <button className="text-sm text-zinc-500 hover:text-red-600">Poništi rezultat i strijelce</button>
        </form>
      )}
    </>
  );
}
