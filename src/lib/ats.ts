export const STAGES = [
  { value: "new", label: "Ny", color: "var(--stage-new)" },
  { value: "screening", label: "Screening", color: "var(--stage-screening)" },
  { value: "interview", label: "Intervju", color: "var(--stage-interview)" },
  { value: "offer", label: "Erbjudande", color: "var(--stage-offer)" },
  { value: "hired", label: "Anställd", color: "var(--stage-hired)" },
  { value: "rejected", label: "Avslag", color: "var(--stage-rejected)" },
] as const;

export type Stage = (typeof STAGES)[number]["value"];

export type Job = {
  id: string;
  owner_id: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

export type Candidate = {
  id: string;
  owner_id: string;
  job_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  current_title: string | null;
  notes: string | null;
  stage: Stage;
  created_at: string;
};
