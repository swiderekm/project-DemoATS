import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useJobs } from "@/hooks/useAts";
import { STAGES, type Candidate, type Stage } from "@/lib/ats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CandidateDialog({
  candidate,
  defaultJobId,
  trigger,
}: {
  candidate?: Candidate;
  defaultJobId?: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: jobs } = useJobs();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [jobId, setJobId] = useState(candidate?.job_id ?? defaultJobId ?? "");
  const [fullName, setFullName] = useState(candidate?.full_name ?? "");
  const [email, setEmail] = useState(candidate?.email ?? "");
  const [phone, setPhone] = useState(candidate?.phone ?? "");
  const [linkedin, setLinkedin] = useState(candidate?.linkedin_url ?? "");
  const [currentTitle, setCurrentTitle] = useState(candidate?.current_title ?? "");
  const [notes, setNotes] = useState(candidate?.notes ?? "");
  const [stage, setStage] = useState<Stage>(candidate?.stage ?? "new");

  const mutation = useMutation({
    mutationFn: async () => {
      const job = (jobs ?? []).find((j) => j.id === jobId);
      if (!job) throw new Error("Välj ett jobb först.");
      if (!email.trim() && !phone.trim()) {
        throw new Error("Ange minst e-post eller telefon.");
      }
      const payload = {
        job_id: jobId,
        owner_id: job.owner_id,
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        linkedin_url: linkedin || null,
        current_title: currentTitle || null,
        notes: notes || null,
        stage,
      };
      if (candidate) {
        const { error } = await supabase.from("candidates").update(payload).eq("id", candidate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("candidates").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast.success(candidate ? "Kandidaten uppdaterades" : "Kandidaten lades till");
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {candidate ? "Redigera kandidat" : "Ny kandidat"}
          </DialogTitle>
          <DialogDescription>Profilinformation och status i processen.</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Jobb</Label>
            {(jobs ?? []).length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Du har inga jobb ännu. Skapa ett jobb först.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="mt-3"
                  onClick={() => {
                    setOpen(false);
                    navigate({ to: "/jobs" });
                  }}
                >
                  <Plus className="size-4" /> Skapa jobb
                </Button>
              </div>
            ) : (
              <Select value={jobId} onValueChange={setJobId}>
                <SelectTrigger>
                  <SelectValue placeholder="Välj jobb" />
                </SelectTrigger>
                <SelectContent>
                  {(jobs ?? []).map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.title}
                      {j.company ? ` · ${j.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Namn</Label>
              <Input
                id="name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentTitle">Nuvarande roll</Label>
              <Input
                id="currentTitle"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cemail">E-post</Label>
              <Input id="cemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn eller annat</Label>
            <Input
              id="linkedin"
              placeholder="https://linkedin.com/in/…"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Steg</Label>
            <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Anteckningar</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {candidate ? "Spara" : "Lägg till kandidat"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
