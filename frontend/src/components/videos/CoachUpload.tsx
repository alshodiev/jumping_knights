import { useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyText, formatSize, watchLink } from "@/lib/format";
import { generatePassphrase } from "@/lib/passphrase";
import { coachComplete, coachCreate, uploadFile } from "@/lib/videosApi";

interface Done { id: string; password: string }

export default function CoachUpload({ onUploaded }: { onUploaded: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [password, setPassword] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState<Done | null>(null);
  const [copied, setCopied] = useState("");
  const abort = useRef<AbortController | null>(null);
  const picker = useRef<HTMLInputElement>(null);
  const busy = progress !== null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setDone(null);
    if (!file) return setError("Choose an MP4 video first.");
    if (!/\.mp4$/i.test(file.name) && file.type !== "video/mp4") return setError("Only MP4 videos are supported.");
    if (password.length < 8) return setError("The password needs at least 8 characters.");
    setProgress(0);
    abort.current = new AbortController();
    try {
      const { id, upload } = await coachCreate({ note, password, size: file.size });
      await uploadFile(upload, file, setProgress, abort.current.signal);
      await coachComplete(id);
      setDone({ id, password });
      setFile(null); setNote(""); setPassword("");
      if (picker.current) picker.current.value = "";
      onUploaded();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProgress(null);
    }
  };

  const copy = async (label: string, text: string) => {
    if (await copyText(text)) { setCopied(label); window.setTimeout(() => setCopied(""), 1800); }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-blue-900">Upload a video</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="up-file">MP4 file</Label>
            <input
              id="up-file" ref={picker} type="file" accept="video/mp4,.mp4" disabled={busy}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-blue-900 file:px-4 file:py-2 file:text-white hover:file:bg-blue-800"
            />
            {file && <p className="text-xs text-gray-500">{file.name} · {formatSize(file.size)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="up-note">Private note (only you see this)</Label>
            <Input id="up-note" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} disabled={busy} placeholder="e.g. Sam, forks and pins" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="up-pass">Password for this video</Label>
            <div className="flex gap-2">
              <Input id="up-pass" value={password} onChange={(e) => setPassword(e.target.value)} maxLength={100} disabled={busy} autoComplete="off" placeholder="At least 8 characters" />
              <Button type="button" variant="outline" disabled={busy} onClick={() => setPassword(generatePassphrase())}>Generate</Button>
            </div>
            <p className="text-xs text-gray-500">You can't view a password later (only a scrambled copy is stored), so note it down or send it right away. You can always set a new one.</p>
          </div>

          {busy && (
            <div aria-live="polite">
              <div className="h-2 w-full overflow-hidden rounded bg-gray-200"><div className="h-full bg-blue-900 transition-all" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} /></div>
              <p className="mt-1 text-xs text-gray-500">{progress === 1 ? "Finishing…" : `Uploading… ${Math.round((progress ?? 0) * 100)}%`}</p>
            </div>
          )}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={busy} className="bg-blue-900 hover:bg-blue-800">{busy ? "Uploading…" : "Upload"}</Button>
            {busy && <Button type="button" variant="outline" onClick={() => abort.current?.abort()}>Cancel</Button>}
          </div>
        </form>

        {done && (
          <div role="status" className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
            <p className="font-semibold text-green-900 mb-2">Uploaded. Share these with the student:</p>
            <p className="break-all text-gray-800"><span className="text-gray-500">Link:</span> {watchLink(done.id)}</p>
            <p className="text-gray-800"><span className="text-gray-500">Password:</span> <code>{done.password}</code></p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => copy("link", watchLink(done.id))}>{copied === "link" ? "Copied" : "Copy link"}</Button>
              <Button size="sm" variant="outline" onClick={() => copy("pw", done.password)}>{copied === "pw" ? "Copied" : "Copy password"}</Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
