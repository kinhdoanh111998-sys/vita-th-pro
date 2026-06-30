import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type Role = "admin" | "manager" | "staff" | "customer" | null;

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
  // Two independent flags — only block UI while we don't yet know the session.
  const [sessionLoading, setSessionLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    let active = true;

    // Safety net: never hang forever on the splash screen.
    const failsafe = setTimeout(() => {
      if (active) setSessionLoading(false);
    }, 4000);

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return;
        setSession(data.session ?? null);
      })
      .catch((err) => {
        console.error("[auth] getSession failed:", err);
      })
      .finally(() => {
        if (!active) return;
        setSessionLoading(false);
        clearTimeout(failsafe);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setSessionLoading(false);
      if (!s) {
        setRole(null);
        setFullName(null);
        setRoleLoading(false);
      }
    });

    return () => {
      active = false;
      clearTimeout(failsafe);
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) {
      setRole(null);
      setFullName(null);
      setRoleLoading(false);
      return;
    }
    let active = true;
    setRoleLoading(true);
    const failsafe = setTimeout(() => {
      if (active) setRoleLoading(false);
    }, 3000);
    (async () => {
      const { data, error } = await supabase
        .from("users")
        .select("role, full_name")
        .eq("email", email)
        .maybeSingle();
      if (!active) return;
      if (error) {
        console.error("[auth] fetch role failed:", error.message);
        setRole(null);
        setFullName(null);
      } else {
        setRole(((data?.role as Role) ?? null) as Role);
        setFullName((data?.full_name as string) ?? null);
      }
      setRoleLoading(false);
      clearTimeout(failsafe);
    })();
    return () => {
      active = false;
      clearTimeout(failsafe);
    };
  }, [session?.user?.email]);

  const value: AuthCtx = {
    session,
    email: session?.user?.email ?? null,
    role,
    fullName,
    loading: sessionLoading || (!!session && roleLoading),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
