import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { createAccount, deleteAccount, listAccounts } from "@/lib/admin.functions";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Konton | DemoATS" },
      { name: "description", content: "Skapa admin- och kundkonton för DemoATS." },
      { property: "og:title", content: "Konton | DemoATS" },
      { property: "og:description", content: "Skapa admin- och kundkonton för DemoATS." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { data: user } = useCurrentUser();
  const fetchAccounts = useServerFn(listAccounts);
  const submitAccount = useServerFn(createAccount);
  const removeAccount = useServerFn(deleteAccount);
  const queryClient = useQueryClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState<"admin" | "customer">("customer");

  const accounts = useQuery({
    queryKey: ["accounts"],
    enabled: Boolean(user?.isAdmin),
    queryFn: () => fetchAccounts(),
  });

  const create = useMutation({
    mutationFn: () =>
      submitAccount({ data: { email, password, fullName, company, role } }),
    onSuccess: () => {
      toast.success("Kontot skapades");
      setEmail("");
      setPassword("");
      setFullName("");
      setCompany("");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["owners"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (userId: string) => removeAccount({ data: { userId } }),
    onSuccess: () => {
      toast.success("Kontot togs bort");
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      queryClient.invalidateQueries({ queryKey: ["owners"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (user && !user.isAdmin) {
    return <p className="text-sm text-muted-foreground">Endast administratörer har åtkomst.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Konton</h1>
        <p className="text-sm text-muted-foreground">Skapa admin- och kundkonton.</p>
      </div>

      <form
        className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          create.mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="aname">Namn</Label>
          <Input id="aname" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="acompany">Företag</Label>
          <Input id="acompany" value={company} onChange={(e) => setCompany(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="aemail">E-post</Label>
          <Input
            id="aemail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="apassword">Lösenord (minst 8 tecken)</Label>
          <Input
            id="apassword"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Roll</Label>
          <Select value={role} onValueChange={(v) => setRole(v as "admin" | "customer")}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Kund</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={create.isPending}>
            Skapa konto
          </Button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Namn</TableHead>
              <TableHead>E-post</TableHead>
              <TableHead>Företag</TableHead>
              <TableHead>Roll</TableHead>
              <TableHead className="text-right">Åtgärd</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(accounts.data ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.full_name ?? "—"}</TableCell>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.company ?? "—"}</TableCell>
                <TableCell>{a.role === "admin" ? "Admin" : "Kund"}</TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={a.id === user?.id || remove.isPending}
                    onClick={() => {
                      if (confirm(`Ta bort ${a.email}? Detta går inte att ångra.`)) {
                        remove.mutate(a.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
