import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { coachLogin } from "@/lib/videosApi";

export default function CoachLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      await coachLogin(username, password);
      setPassword("");
      onSignedIn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="max-w-sm mx-auto">
      <CardHeader><CardTitle className="text-blue-900">Coach sign in</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coach-user">Username</Label>
            <Input id="coach-user" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={busy} maxLength={100} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coach-pass">Password</Label>
            <Input id="coach-pass" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} maxLength={200} required />
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <Button type="submit" disabled={busy || !username || !password} className="w-full bg-blue-900 hover:bg-blue-800">
            {busy ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
