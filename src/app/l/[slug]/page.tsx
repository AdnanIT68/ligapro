import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Fixtures, ScorersList, StandingsTable } from "@/components/league-views";
import { loadLeague } from "@/lib/league-data";
import { createClient } from "@/lib/supabase/server";

async function getCompetition(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("competitions")
    .select("id, name, season")
    .eq("slug", slug)
    .maybeSingle();
  return { supabase, competition: data };
}

export async function generateMetadata({ params }: PageProps<"/l/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const { competition } = await getCompetition(slug);
  if (!competition) return { title: "LigaPro" };
  return {
    title: `${competition.name} · LigaPro`,
    description: `Raspored, rezultati i tabela: ${competition.name}${competition.season ? `, ${competition.season}` : ""}.`,
  };
}

/** Public league page: anyone with the link can follow it, no account needed. */
export default function PublicLeaguePage(props: PageProps<"/l/[slug]">) {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8">
      <Suspense fallback={<p className="text-zinc-500">Učitavanje…</p>}>
        <PublicLeague {...props} />
      </Suspense>
      <footer className="mt-auto pt-8 text-center text-xs text-zinc-400">Vodi se u LigaPro</footer>
    </main>
  );
}

async function PublicLeague({ params }: PageProps<"/l/[slug]">) {
  const { slug } = await params;
  const { supabase, competition } = await getCompetition(slug);
  if (!competition) notFound();
  const league = await loadLeague(supabase, competition.id);

  return (
    <>
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">LigaPro</p>
        <h1 className="text-2xl font-bold">{competition.name}</h1>
        {competition.season && <p className="text-zinc-500">{competition.season}</p>}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Tabela</h2>
        {league.anyFinished ? (
          <StandingsTable league={league} />
        ) : (
          <p className="text-sm text-zinc-500">Tabela se pojavljuje nakon prve odigrane utakmice.</p>
        )}
      </section>

      {league.scorers.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Strijelci</h2>
          <ScorersList league={league} />
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Raspored i rezultati</h2>
        {league.matches.length > 0 ? (
          <Fixtures league={league} />
        ) : (
          <p className="text-sm text-zinc-500">Raspored još nije objavljen.</p>
        )}
      </section>
    </>
  );
}
