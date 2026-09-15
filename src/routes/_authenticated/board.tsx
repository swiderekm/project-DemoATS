import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Linkedin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCandidates, useJobs } from "@/hooks/useAts";
import { STAGES, type Candidate, type Stage } from "@/lib/ats";
import { CandidateDialog } from "@/components/CandidateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "Kanban | DemoATS" },
      { name: "description", content: "Kompakt kanban-vy över alla kandidater per jobb." },
      { property: "og:title", content: "Kanban | DemoATS" },
      { property: "og:description", content: "Kompakt kanban-vy över alla kandidater per jobb." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Board,
});

function Board() {
  const { data: jobs } = useJobs();
  const { data: candidates, isLoading } = useCandidates();
  const queryClient = useQueryClient();
  const [jobFilter, setJobFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");

  const move = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: Stage }) => {
      const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidates"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success("Kandidaten togs bort");
    },
  });

  const filtered = useMemo(() => {
    return (candidates ?? []).filter((c) => {
      const matchJob = jobFilter === "all" || c.job_id === jobFilter;
      const matchName = c.full_name.toLowerCase().includes(nameFilter.trim().toLowerCase());
      return matchJob && matchName;
    });
  }, [candidates, jobFilter, nameFilter]);

  const jobById = useMemo(
    () => Object.fromEntries((jobs ?? []).map((j) => [j.id, j])),
    [jobs],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} kandidater i {STAGES.length} steg
          </p>
        </div>
        <CandidateDialog
          trigger={
            <Button>
              <Plus className="size-4" /> Ny kandidat
            </Button>
          }
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Sök kandidatnamn…"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          className="max-w-xs"
        />
        <Select value={jobFilter} onValueChange={setJobFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Alla jobb" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alla jobb</SelectItem>
            {(jobs ?? []).map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Laddar…</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const items = filtered.filter((c) => c.stage === stage.value);
            return (
              <div
                key={stage.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) move.mutate({ id, stage: stage.value });
                }}
                className="flex w-64 shrink-0 flex-col rounded-xl bg-muted/60 p-2"
              >
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: stage.color }}
                    aria-hidden
                  />
                  <span className="text-sm font-semibold">{stage.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {items.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      jobTitle={jobById[c.job_id]?.title ?? ""}
                      onDelete={() => remove.mutate(c.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CandidateCard({
  candidate,
  jobTitle,
  onDelete,
}: {
  candidate: Candidate;
  jobTitle: string;
  onDelete: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", candidate.id)}
      className="group rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{candidate.full_name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {candidate.current_title ?? jobTitle}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <CandidateDialog
            candidate={candidate}
            trigger={
              <button className="rounded p-1 hover:bg-muted" aria-label="Redigera">
                <Pencil className="size-3.5" />
              </button>
            }
          />
          <button onClick={onDelete} className="rounded p-1 hover:bg-muted" aria-label="Ta bort">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="truncate rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
          {jobTitle}
        </span>
        {candidate.linkedin_url && (
          <a
            href={candidate.linkedin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
            aria-label="LinkedIn-profil"
          >
            <Linkedin className="size-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}
