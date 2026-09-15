import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  company: string | null;
  isAdmin: boolean;
};

export function useCurrentUser() {
  return useQuery<CurrentUser | null>({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      const user = data.user;

      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("full_name, company, email").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      return {
        id: user.id,
        email: profile?.email ?? user.email ?? "",
        fullName: profile?.full_name ?? null,
        company: profile?.company ?? null,
        isAdmin: (roles ?? []).some((r) => r.role === "admin"),
      };
    },
  });
}
