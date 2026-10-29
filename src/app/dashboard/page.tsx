import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default function DashboardPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-12">
      <Suspense fallback={<p className="text-zinc-500">Učitavanje…</p>}>
        <Competitions />
      </Suspense>
    </main>
  );
}

async function Competitions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: competitions } = await supabase
    .from("competitions")
    .select("id, name, slug, season")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Moje lige</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
        </div>
        <form action={signOut}>
          <button className="text-sm text-zinc-600 hover:underline">Odjava</button>
        </form>
      </header>

      {competitions && competitions.length > 0 ? (
        <ul className="grid gap-3">
          {competitions.map((c) => (
            <li key={c.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <p className="font-semibold">{c.name}</p>
              <p className="text-sm text-zinc-500">{c.season ?? "Sezona nije upisana"}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500">
          Još nemaš nijednu ligu. Pravljenje lige stiže u sljedećem koraku.
        </p>
      )}
    </>
  );
}
