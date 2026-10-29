import { Suspense } from "react";
import { sendMagicLink } from "./actions";

const errors: Record<string, string> = {
  email: "Upiši ispravnu e-mail adresu.",
  send: "Slanje linka nije uspjelo. Pokušaj ponovo za minut.",
  link: "Link je istekao ili je već iskorišten. Zatraži novi.",
};

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold">Prijava organizatora</h1>
      <Suspense>
        <LoginForm searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LoginForm({ searchParams }: Pick<PageProps<"/login">, "searchParams">) {
  const { sent, error } = await searchParams;
  const message = typeof error === "string" ? errors[error] : undefined;

  if (sent) {
    return (
      <p className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
        Poslali smo ti link za prijavu. Otvori e-mail i klikni na link.
      </p>
    );
  }

  return (
    <form action={sendMagicLink} className="flex flex-col gap-3">
      <label htmlFor="email" className="text-sm font-medium">
        E-mail
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700">
        Pošalji link za prijavu
      </button>
    </form>
  );
}
