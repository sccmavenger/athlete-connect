import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { MOCK_USER } from "@/lib/mock-data";

export type AppRole = "admin" | "coach" | "athlete" | "parent";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  roles: AppRole[];
}

function getMockRoles(): AppRole[] | null {
  if (typeof window === "undefined") return null;
  const p = new URLSearchParams(window.location.search).get("mockRole");
  if (!p) return null;
  if (p === "athlete") return ["athlete"];
  if (p === "coach") return ["coach"];
  if (p === "admin") return ["admin"];
  if (p === "parent") return ["parent"];
  if (p === "pending") return [];
  return null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    roles: [],
  });

  useEffect(() => {
    const mock = getMockRoles();
    if (mock !== null) {
      setState({
        loading: false,
        session: null,
        user: { ...MOCK_USER } as unknown as User,
        roles: mock,
      });
      return;
    }
    let mounted = true;

    async function loadRoles(userId: string): Promise<AppRole[]> {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      return (data ?? []).map((r) => r.role as AppRole);
    }

    async function refresh(session: Session | null) {
      if (!session?.user) {
        if (mounted) setState({ loading: false, session: null, user: null, roles: [] });
        return;
      }
      const roles = await loadRoles(session.user.id);
      if (mounted) setState({ loading: false, session, user: session.user, roles });
    }

    supabase.auth.getSession().then(({ data }) => refresh(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setTimeout(() => refresh(session), 0);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export function hasRole(roles: AppRole[], role: AppRole) {
  return roles.includes(role);
}
