import { Eye, Linkedin } from "lucide-react";
import { STAGES, type Candidate } from "@/lib/ats";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export  function CandidateDetailsDialog({
  candidate,
  jobTitle,
  company,
}: {
  candidate: Candidate;
  jobTitle?: string;
  company?: string;
}) {
  const stageLabel = STAGES.find((s) => s.value === candidate.stage)?.label ?? candidate.stage;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" aria-label="Visa detaljer">
          <Eye className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{candidate.full_name}</DialogTitle>
          <DialogDescription>
            {candidate.current_title || "Ingen nuvarande roll angiven"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Jobb / Position</p>
              <p>{jobTitle || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Företag</p>
              <p>{company || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Steg</p>
              <p>{stageLabel}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">E-post</p>
              <p className="break-all">{candidate.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Telefon</p>
              <p>{candidate.phone || "—"}</p>
            </div>
            {candidate.linkedin_url && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">LinkedIn</p>
                <a
                  href={candidate.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 break-all text-primary hover:underline"
                >
                  <Linkedin className="size-3.5 shrink-0" />
                  {candidate.linkedin_url}
                </a>
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Anteckningar</p>
            <p className="whitespace-pre-wrap rounded-md bg-muted p-3">
              {candidate.notes || "Inga anteckningar."}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
