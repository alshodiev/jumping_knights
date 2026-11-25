import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copyText, formatDate, formatSize, watchLink } from "@/lib/format";
import { generatePassphrase } from "@/lib/passphrase";
import { coachDelete, coachPatch, coachPlay, type CoachVideo } from "@/lib/videosApi";

type Panel = null | "note" | "password" | "delete";

export default function CoachVideoRow({ video, onChanged }: { video: CoachVideo; onChanged: () => void }) {
  const [panel, setPanel] = useState<Panel>(null);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [src, setSrc] = useState<string | null>(null);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true); setError(""); setMsg("");
    try { await fn(); if (ok) setMsg(ok); return true; }
    catch (e) { setError((e as Error).message); return false; }
    finally { setBusy(false); }
  };

  const open = (p: Panel) => { setPanel(p === panel ? null : p); setValue(p === "note" ? video.note : ""); setError(""); setMsg(""); };
  const watch = () => run(async () => setSrc((await coachPlay(video.id)).url));
  const copyLink = async () => setMsg((await copyText(watchLink(video.id))) ? "Link copied." : "Couldn't copy. Select the link manually.");

  const save = async () => {
    const ok = panel === "note"
      ? await run(() => coachPatch(video.id, { note: value }), "Note saved.")
      : await run(() => coachPatch(video.id, { password: value }), `New password set: ${value}`);
    if (ok) { setPanel(null); onChanged(); }
  };
  const remove = async () => { if (await run(() => coachDelete(video.id))) onChanged(); };

  return (
    <li className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-gray-900 break-words">{video.note || <span className="text-gray-400">No note</span>}</p>
          <p className="text-xs text-gray-500">
            {formatDate(video.createdAt)} · {formatSize(video.size)}
            {video.status === "uploading" && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">Unfinished upload</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {video.status === "ready" && <Button size="sm" variant="outline" disabled={busy} onClick={watch}>Watch</Button>}
          {video.status === "ready" && <Button size="sm" variant="outline" onClick={copyLink}>Copy link</Button>}
          {video.status === "ready" && <Button size="sm" variant="outline" onClick={() => open("password")}>Change password</Button>}
          <Button size="sm" variant="outline" onClick={() => open("note")}>Edit note</Button>
          <Button size="sm" variant="outline" className="text-red-700 hover:text-red-800" onClick={() => open("delete")}>Delete</Button>
        </div>
      </div>

      {src && (
        <div className="mt-3">
          <video src={src} controls autoPlay playsInline className="block w-full max-w-xl aspect-video rounded bg-black" onError={() => { setSrc(null); setError("The watch link expired. Press Watch again."); }} />
          <button className="mt-1 text-xs text-gray-500 underline" onClick={() => setSrc(null)}>Close player</button>
        </div>
      )}

      {(panel === "note" || panel === "password") && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label={panel === "note" ? "Private note" : "New password"}
            value={value} onChange={(e) => setValue(e.target.value)} disabled={busy} autoComplete="off"
            maxLength={panel === "note" ? 200 : 100} placeholder={panel === "note" ? "Private note" : "New password (8+ characters)"}
          />
          {panel === "password" && <Button type="button" variant="outline" onClick={() => setValue(generatePassphrase())}>Generate</Button>}
          <Button disabled={busy || (panel === "password" && value.length < 8)} className="bg-blue-900 hover:bg-blue-800" onClick={save}>Save</Button>
        </div>
      )}
      {panel === "delete" && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded bg-red-50 p-3 text-sm">
          <span className="text-red-900">Delete this video for good? This can't be undone.</span>
          <Button size="sm" disabled={busy} className="bg-red-700 hover:bg-red-800" onClick={remove}>Yes, delete</Button>
          <Button size="sm" variant="outline" onClick={() => setPanel(null)}>Keep it</Button>
        </div>
      )}

      {msg && <p role="status" className="mt-2 text-sm text-green-800 break-all">{msg}</p>}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    </li>
  );
}
