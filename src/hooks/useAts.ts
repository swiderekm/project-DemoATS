import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Candidate, Job } from "@/lib/ats";

export function useJobs() {
  return useQuery<Job[]>({
    queryKey: ["jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Job[];
    },
  });
}

export function useCandidates() {
  return useQuery<Candidate[]>({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Candidate[];
    },
  });
}

export type OwnerOption = { id: string; label: string };

export function useOwners(enabled: boolean) {
  return useQuery<OwnerOption[]>({
    queryKey: ["owners"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, company")
        .order("full_name");
      if (error) throw error;
      return (data ?? []).map((p) => ({
        id: p.id,
        label: [p.full_name ?? p.email, p.company].filter(Boolean).join(" · "),
      }));
    },
  });
}
