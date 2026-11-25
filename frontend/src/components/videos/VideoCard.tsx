import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/format";
import { unlockVideo, type PublicVideo } from "@/lib/videosApi";

/**
 * A private video in the feed. Locked it shows only a grey box and the date posted.
 * Nothing about the video is requested until the right password is entered.
 */
export default function VideoCard({ video, autoOpen = false }: { video: PublicVideo; autoOpen?: boolean }) {
  const [open, setOpen] = useState(autoOpen);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [src, setSrc] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const posted = formatDate(video.createdAt);

  useEffect(() => { if (open && !src) input.current?.focus(); }, [open, src]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true); setError("");
    try {
      const r = await unlockVideo(video.id, password);
      setSrc(r.url);
      setPassword("");
    } catch (err) {
      setError((err as Error).message);
      input.current?.select();
    } finally {
      setBusy(false);
    }
  };

  // The watch link lasts a limited time. If it runs out, ask for the password again.
  const onVideoError = () => {
    setSrc(null);
    setOpen(true);
    setError("This link has expired. Enter the password again to keep watching.");
  };

  return (
    <article className={src ? "rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden" : "rounded-xl border border-gray-200 bg-gray-100 overflow-hidden"}>
      {src ? (
        <video src={src} controls autoPlay playsInline preload="auto" onError={onVideoError} className="block w-full aspect-video bg-black" />
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Private video posted ${posted}. Enter the password to watch.`}
          className="flex w-full aspect-video flex-col items-center justify-center gap-2 bg-gray-200 text-gray-500 hover:bg-gray-300/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-900"
        >
          <Lock className="h-10 w-10" aria-hidden />
          <span className="text-sm font-medium">Private video</span>
        </button>
      )}

      <div className="px-4 py-3">
        <p className={src ? "text-sm text-gray-600" : "text-sm text-gray-500"}>Posted {posted}</p>

        {!src && !open && <p className="mt-1 text-xs text-gray-400">Select to watch with a password.</p>}

        {!src && open && (
          <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row" noValidate>
            <label htmlFor={`pw-${video.id}`} className="sr-only">Password for this video</label>
            <Input
              id={`pw-${video.id}`}
              ref={input}
              type="password"
              autoComplete="off"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              maxLength={200}
              className="bg-white"
            />
            <Button type="submit" disabled={busy || !password} className="bg-blue-900 hover:bg-blue-800 sm:w-32">
              {busy ? "Checking…" : "Watch"}
            </Button>
          </form>
        )}
        {!src && open && error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      </div>
    </article>
  );
}
