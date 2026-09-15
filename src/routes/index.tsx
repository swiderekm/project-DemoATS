import { createFileRoute, Link } from "@tanstack/react-router";
import { KanbanSquare, Users, Briefcase, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DemoATS – enkelt rekryteringsverktyg" },
      {
        name: "description",
        content:
          "DemoATS är ett minimalt ATS: lägg upp jobb, samla kandidater och följ processen i en kompakt kanban-vy.",
      },
      { property: "og:title", content: "DemoATS – enkelt rekryteringsverktyg" },
      {
        property: "og:description",
        content: "Lägg upp jobb, samla kandidater och följ rekryteringen i en kompakt kanban-vy.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Briefcase, title: "Jobb", text: "Lägg upp rollerna du rekryterar till." },
  { icon: Users, title: "Kandidater", text: "Profiler med LinkedIn, kontakt och anteckningar." },
  { icon: KanbanSquare, title: "Kanban", text: "Kompakt vy med filter på jobb och namn." },
  { icon: ShieldCheck, title: "Admin", text: "Skapa konton och arbeta åt kunder." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-sidebar text-sidebar-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-semibold">DemoATS</span>
        <Button asChild variant="secondary">
          <Link to="/auth">Logga in</Link>
        </Button>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <h1 className="max-w-2xl font-display text-4xl font-semibold leading-tight tracking-tight md:text-6xl">
          Ett mini-ATS som håller rekryteringen på ett ställe.
        </h1>
        <p className="mt-6 max-w-xl text-base opacity-80">
          Jobb, kandidatprofiler och en kompakt kanban-vy — för byrån och för kunderna.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/auth">Kom igång</Link>
          </Button>
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl bg-sidebar-accent p-5">
              <Icon className="size-5 text-sidebar-primary" />
              <h2 className="mt-3 font-display text-base font-semibold">{title}</h2>
              <p className="mt-1 text-sm opacity-75">{text}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
