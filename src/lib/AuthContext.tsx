import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabaseClient";

export type Role = "admin" | "manager" | "staff" | "employee" | "customer" | null;

type AuthCtx = {
  session: Session | null;
  email: string | null;
  role: Role;
  fullName: string | null;
  loading: boolean;
  isLoadingRole: boolean;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  session: null,
  email: null,
  role: null,
  fullName: null,
  loading: true,
  isLoadingRole: false,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const roleEmailRef = useRef<string | null>(null);
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
        roleEmailRef.current = null;
        setRole(null);
        setFullName(null);
        setRoleLoading(Boolean(data.session));
        setSession(data.session ?? null);
      })
      .catch((err) => {
        console.error("[auth] getSession failed:", err);
        if (!active) return;
        setSession(null);
        roleEmailRef.current = null;
        setRole(null);
        setFullName(null);
        setRoleLoading(false);
      })
      .finally(() => {
        if (!active) return;
        setSessionLoading(false);
        clearTimeout(failsafe);
      });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      const nextEmail = s?.user?.email ?? null;
      const emailChanged = nextEmail !== roleEmailRef.current;
      if (emailChanged) {
        roleEmailRef.current = null;
        setRole(null);
        setFullName(null);
        setRoleLoading(Boolean(s));
      }
      setSession(s);
      setSessionLoading(false);
      if (!s) {
        roleEmailRef.current = null;
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

    // Failsafe: never block the UI longer than 5s waiting for the role lookup.
    const roleFailsafe = setTimeout(() => {
      if (!active) return;
      console.warn("[auth] role fetch timeout (5s) — releasing loading lock");
      setRoleLoading(false);
    }, 5000);

    (async () => {
      const isVirtualCustomer = email.toLowerCase().endsWith("@khach.vitath.pro");
      try {
        const { data, error } = await supabase
          .from("users")
          .select("role, full_name")
          .eq("email", email)
          .maybeSingle();

        if (!active) return;

        if (error) {
          console.error("[auth] fetch role failed:", error.message);
        }

        const fetchedRole = (data?.role as Role) ?? null;
        // Fallback: virtual-email accounts are always customers, even when the
        // users-table read is blocked by RLS or the row is missing.
        roleEmailRef.current = email;
        setRole(fetchedRole ?? (isVirtualCustomer ? "customer" : null));
        setFullName((data?.full_name as string) ?? null);
      } catch (err) {
        if (!active) return;
        console.error("[auth] fetch role crashed:", err);
        roleEmailRef.current = email;
        setRole(isVirtualCustomer ? "customer" : null);
        setFullName(null);
      } finally {
        if (active) setRoleLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [session?.user?.email]);

  const value: AuthCtx = {
    session,
    email: session?.user?.email ?? null,
    role,
    fullName,
    loading: sessionLoading || roleLoading,
    isLoadingRole: roleLoading,
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
