import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Linkedin, Pencil, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCandidates, useJobs } from "@/hooks/useAts";
import { STAGES } from "@/lib/ats";
import { CandidateDialog } from "@/components/CandidateDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/candidates")({
  head: () => ({
    meta: [
      { title: "Kandidater | DemoATS" },
      { name: "description", content: "Alla kandidater med profilinformation och LinkedIn-länk." },
      { property: "og:title", content: "Kandidater | DemoATS" },
      {
        property: "og:description",
        content: "Alla kandidater med profilinformation och LinkedIn-länk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Candidates,
});

function Candidates() {
  const { data: candidates } = useCandidates();
  const { data: jobs } = useJobs();
  const [jobFilter, setJobFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const queryClient = useQueryClient();

  const jobById = useMemo(() => Object.fromEntries((jobs ?? []).map((j) => [j.id, j])), [jobs]);
  const rows = (candidates ?? []).filter(
    (c) =>
      (jobFilter === "all" || c.job_id === jobFilter) &&
      c.full_name.toLowerCase().includes(nameFilter.trim().toLowerCase()),
  );

  const remove = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", candidateId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Kandidaten togs bort");
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Kandidater</h1>
          <p className="text-sm text-muted-foreground">{rows.length} profiler</p>
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
          placeholder="Sök namn…"
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

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>Jobb</TableHead>
              <TableHead>Företag</TableHead>
              <TableHead>Steg</TableHead>
              <TableHead>Kontakt</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {c.full_name}
                    {c.linkedin_url && (
                      <a href={c.linkedin_url} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="size-3.5 text-muted-foreground hover:text-primary" />
                      </a>
                    )}
                  </div>
                  {c.current_title && (
                    <span className="text-xs text-muted-foreground">{c.current_title}</span>
                  )}
                </TableCell>
                <TableCell>{jobById[c.job_id]?.title ?? "—"}</TableCell>
                <TableCell>{jobById[c.job_id]?.company ?? "—"}</TableCell>
                <TableCell>{STAGES.find((s) => s.value === c.stage)?.label}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {c.email ?? c.phone ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <CandidateDialog
                      candidate={c}
                      trigger={
                        <Button size="sm" variant="ghost">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={remove.isPending}
                      onClick={() => {
                        if (confirm(`Ta bort ${c.full_name}? Detta går inte att ångra.`)) {
                          remove.mutate(c.id);
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
