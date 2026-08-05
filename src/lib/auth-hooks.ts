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

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    user: null,
    roles: [],
  });

  useEffect(() => {
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
