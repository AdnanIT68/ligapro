import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";

/** Supabase client for Server Components, Server Actions and Route Handlers. */
export async function createClient() {
  // Supabase reads the clock for token expiry; wait for the request so that
  // never happens during prerendering.
  await connection();
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Server Components can't set cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  );
}
