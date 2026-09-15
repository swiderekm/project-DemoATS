import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCandidates, useJobs } from "@/hooks/useAts";
import { JobDialog } from "@/components/JobDialog";
import { CandidateDialog } from "@/components/CandidateDialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/jobs")({
  head: () => ({
    meta: [
      { title: "Jobb | DemoATS" },
      { name: "description", content: "Hantera jobben du rekryterar kandidater till." },
      { property: "og:title", content: "Jobb | DemoATS" },
      { property: "og:description", content: "Hantera jobben du rekryterar kandidater till." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Jobs,
});

function Jobs() {
  const { data: jobs, isLoading } = useJobs();
  const { data: candidates } = useCandidates();
  const queryClient = useQueryClient();

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("jobs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Jobbet togs bort");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Jobb</h1>
          <p className="text-sm text-muted-foreground">Rollerna du söker kandidater till.</p>
        </div>
        <JobDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Nytt jobb
            </Button>
          }
        />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laddar…</p>
      ) : (jobs ?? []).length === 0 ? (
        <p className="text-sm text-muted-foreground">Inga jobb ännu — skapa ditt första.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(jobs ?? []).map((job) => {
            const count = (candidates ?? []).filter((c) => c.job_id === job.id).length;
            return (
              <div key={job.id} className="rounded-xl border border-border bg-card p-5">
                <h2 className="font-display text-lg font-semibold">{job.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {[job.company, job.location].filter(Boolean).join(" · ") || "—"}
                </p>
                {job.description && (
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{job.description}</p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">{count} kandidater</p>
                <div className="mt-4 flex gap-2">
                  <CandidateDialog
                    defaultJobId={job.id}
                    trigger={
                      <Button size="sm" variant="secondary">
                        <UserPlus className="size-4" /> Kandidat
                      </Button>
                    }
                  />
                  <JobDialog
                    job={job}
                    trigger={
                      <Button size="sm" variant="ghost">
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                  <Button size="sm" variant="ghost" onClick={() => remove.mutate(job.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
