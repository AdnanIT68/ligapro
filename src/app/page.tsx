import Link from "next/link";

const features = [
  { title: "Raspored za minut", text: "Dodaj ekipe, a LigaPro napravi raspored svako sa svakim, s pravednim domaćinstvima." },
  { title: "Rezultati s telefona", text: "Upiši rezultat, strijelce i kartone odmah poslije utakmice." },
  { title: "Tabela sama od sebe", text: "Bodovi, gol-razlika i lista strijelaca računaju se automatski." },
  { title: "Javna stranica lige", text: "Igrači i navijači prate sve preko jednog linka, bez prijave." },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-12 px-4 py-16">
      <section className="flex flex-col gap-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">LigaPro</p>
        <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
          Vodi svoju ligu bez Excela i Viber grupa.
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Rasporedi, rezultati, tabele i strijelci za amaterske lige i turnire u malom fudbalu,
          košarci i firminim ligama.
        </p>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg bg-emerald-600 px-5 py-3 font-semibold text-white hover:bg-emerald-700"
          >
            Napravi ligu
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
            <h2 className="font-semibold">{f.title}</h2>
            <p className="mt-1 text-zinc-600 dark:text-zinc-400">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
