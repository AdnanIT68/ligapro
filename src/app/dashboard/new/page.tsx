import Link from "next/link";
import { Suspense } from "react";
import { createCompetition } from "../actions";

const errors: Record<string, string> = {
  name: "Naziv lige mora imati između 2 i 80 znakova.",
  save: "Liga nije spremljena. Pokušaj ponovo.",
};

const field = "rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

export default function NewCompetitionPage({ searchParams }: PageProps<"/dashboard/new">) {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-6 px-4 py-12">
      <Link href="/dashboard" className="text-sm text-zinc-500 hover:underline">
        ← Moje lige
      </Link>
      <h1 className="text-2xl font-bold">Nova liga</h1>

      <form action={createCompetition} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Naziv
          <input name="name" required maxLength={80} placeholder="npr. Liga Ilidža 2026" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Sezona (nije obavezno)
          <input name="season" maxLength={20} placeholder="npr. Jesen 2026" className={field} />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Sport
          <select name="sport" defaultValue="futsal" className={field}>
            <option value="futsal">Mali fudbal</option>
            <option value="football">Veliki fudbal</option>
            <option value="basketball">Košarka</option>
            <option value="other">Drugo</option>
          </select>
        </label>
        <Suspense>
          <FormError searchParams={searchParams} />
        </Suspense>
        <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
          Napravi ligu
        </button>
      </form>
    </main>
  );
}

async function FormError({ searchParams }: Pick<PageProps<"/dashboard/new">, "searchParams">) {
  const { error } = await searchParams;
  const message = typeof error === "string" ? errors[error] : undefined;
  return message ? <p className="text-sm text-red-600">{message}</p> : null;
}
