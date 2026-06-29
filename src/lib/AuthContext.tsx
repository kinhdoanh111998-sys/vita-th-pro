import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type Role = "admin" | "manager" | "staff" | null;

type AuthCtx = {
  session: Session | null;
  email: string | null;
  role: Role;
  fullName: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  email: null,
  role: null,
  fullName: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session ?? null);
      if (!data.session) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setRole(null);
        setFullName(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("email", email)
        .maybeSingle();
      if (error) {
        console.error("[auth] fetch role failed:", error.message);
        setRole(null);
      } else {
        setRole(((data?.role as Role) ?? null) as Role);
        setFullName((data?.full_name as string) ?? null);
      }
      setLoading(false);
    })();
  }, [session?.user?.email]);

  const value: AuthCtx = {
    session,
    email: session?.user?.email ?? null,
    role,
    fullName,
    loading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
