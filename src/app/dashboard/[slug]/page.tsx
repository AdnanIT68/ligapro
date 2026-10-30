import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Fixtures, ScorersList, StandingsTable } from "@/components/league-views";
import { loadLeague } from "@/lib/league-data";
import { addTeam, clearSchedule, generateSchedule, removeTeam } from "../actions";

const errors: Record<string, string> = {
  teams: "Za raspored trebaju najmanje 2 ekipe.",
  exists: "Raspored već postoji. Obriši ga ako želiš novi.",
  save: "Promjena nije spremljena. Pokušaj ponovo.",
};

export default function CompetitionPage(props: PageProps<"/dashboard/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Moje lige
      </Link>
      <Suspense fallback={<p className="text-zinc-500">Učitavanje…</p>}>
        <Competition {...props} />
      </Suspense>
    </main>
  );
}

async function Competition({ params, searchParams }: PageProps<"/dashboard/[slug]">) {
  const { slug } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: competition } = await supabase
    .from("competitions")
    .select("id, name, season, owner_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!competition || competition.owner_id !== user.id) notFound();

  const league = await loadLeague(supabase, competition.id);
  const { teams, anyFinished } = league;
  const hasSchedule = league.matches.length > 0;
  const message = typeof error === "string" ? errors[error] : undefined;

  return (
    <>
      <header>
        <h1 className="text-2xl font-bold">{competition.name}</h1>
        {competition.season && <p className="text-zinc-500">{competition.season}</p>}
        <p className="mt-2 text-sm">
          Javna stranica:{" "}
          <Link href={`/l/${slug}`} className="text-emerald-700 underline" target="_blank">
            {`/l/${slug}`}
          </Link>
        </p>
      </header>

      {message && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{`Ekipe (${teams.length})`}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {teams.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
            >
              <span>{t.name}</span>
              {!hasSchedule && (
                <form action={removeTeam.bind(null, slug, t.id)}>
                  <button className="text-sm text-zinc-400 hover:text-red-600" aria-label={`Ukloni ${t.name}`}>
                    Ukloni
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        {hasSchedule ? (
          <p className="text-sm text-zinc-500">Ekipe se ne mogu mijenjati dok postoji raspored.</p>
        ) : (
          <form action={addTeam.bind(null, slug, competition.id)} className="flex gap-2">
            <input
              name="name"
              required
              maxLength={60}
              placeholder="Naziv ekipe"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button className="rounded-lg bg-zinc-900 px-4 py-2 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">
              Dodaj
            </button>
          </form>
        )}
      </section>

      {anyFinished && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Tabela</h2>
          <StandingsTable league={league} />
          {league.scorers.length > 0 && <h2 className="mt-4 text-lg font-semibold">Strijelci</h2>}
          <ScorersList league={league} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Raspored</h2>
        {hasSchedule ? (
          <>
            <Fixtures league={league} matchHref={(id) => `/dashboard/${slug}/match/${id}`} />
            <form action={clearSchedule.bind(null, slug, competition.id)}>
              <button className="text-sm text-zinc-500 hover:text-red-600">Obriši raspored</button>
            </form>
          </>
        ) : (
          <form
            action={generateSchedule.bind(null, slug, competition.id)}
            className="flex flex-wrap items-center gap-4"
          >
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="double" />
              Dvokružno (svaka ekipa i domaćin i gost)
            </label>
            <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
              Napravi raspored
            </button>
          </form>
        )}
      </section>
    </>
  );
}
