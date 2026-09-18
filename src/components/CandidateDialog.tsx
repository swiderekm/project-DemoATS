import { useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Plus, Upload, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { assessCv } from "@/lib/ai.functions";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useJobs } from "@/hooks/useAts";
import { STAGES, type Candidate, type Stage } from "@/lib/ats";
import { cn } from "@/lib/utils";
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
  const [cvText, setCvText] = useState("");
  const [assessment, setAssessment] = useState("");
  const [assessing, setAssessing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileData, setFileData] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const runAssessCv = useServerFn(assessCv);

  function readAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Kunde inte läsa filen."));
      reader.readAsDataURL(file);
    });
  }

  async function handleFile(file: File) {
    if (file.size > 15 * 1024 * 1024) {
      toast.error("Filen är för stor (max 15 MB).");
      return;
    }
    const isText =
      file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name);
    if (isText) {
      const text = await file.text();
      setCvText(text.slice(0, 20000));
      setFileName(file.name);
      setFileData("");
      return;
    }
    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      setFileData(await readAsDataUrl(file));
      setFileName(file.name);
      return;
    }
    toast.error("Stödda filer: PDF, bild eller textfil.");
  }

  function clearFile() {
    setFileName("");
    setFileData("");
  }

  async function runAssessment() {
    setAssessing(true);
    try {
      const job = (jobs ?? []).find((j) => j.id === jobId);
      const result = await runAssessCv({
        data: {
          cvText,
          fileName: fileName || undefined,
          fileData: fileData || undefined,
          jobTitle: job?.title,
          jobDescription: job?.description ?? undefined,
        },
      });
      setAssessment(result.assessment);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte bedöma CV:t.");
    } finally {
      setAssessing(false);
    }
  }

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

          <div className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="cv">CV-bedömning med AI</Label>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={assessing || (cvText.trim().length < 20 && !fileData)}
                onClick={runAssessment}
              >
                {assessing ? "Bedömer…" : "Bedöm CV"}
              </Button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed p-4 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              )}
            >
              <Upload className="size-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Släpp en fil här, eller klicka för att välja (PDF, bild eller textfil)
              </p>
              {fileName && (
                <div
                  className="mt-1 flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="max-w-[220px] truncate">{fileName}</span>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Ta bort fil"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,text/plain,application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />

            <Textarea
              id="cv"
              placeholder="…eller klistra in CV-text här"
              value={cvText}
              onChange={(e) => setCvText(e.target.value)}
              rows={4}
            />
            {assessment && (
              <div className="space-y-2">
                <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{assessment}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setNotes((n) => (n ? `${n}\n\nAI-bedömning:\n${assessment}` : `AI-bedömning:\n${assessment}`))
                  }
                >
                  Spara i anteckningar
                </Button>
              </div>
            )}
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
