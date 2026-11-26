import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";
import PageShell from "@/components/site/PageShell";
import SectionHeading from "@/components/site/SectionHeading";
import VideoCard from "@/components/videos/VideoCard";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/usePageMeta";
import { coachLogout, coachMe, listVideos, type PublicVideo } from "@/lib/videosApi";

const PAGE = 8;

export default function VideosPage() {
  usePageMeta("Videos | Jumping Knights");
  const [videos, setVideos] = useState<PublicVideo[] | null>(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [coach, setCoach] = useState<"unknown" | "yes" | "no">("unknown");

  useEffect(() => {
    let alive = true;
    listVideos().then((v) => alive && setVideos(v)).catch((e: Error) => alive && setError(e.message));
    coachMe().then((r) => alive && setCoach(r.signedIn ? "yes" : "no")).catch(() => alive && setCoach("no"));
    return () => { alive = false; };
  }, []);

  const signOut = async () => { await coachLogout().catch(() => undefined); setCoach("no"); };

  return (
    <PageShell>
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-end mb-4 min-h-8 text-sm" data-testid="coach-bar">
            {coach === "no" && (
              <Link to="/coach" className="inline-flex items-center gap-1.5 text-blue-900 hover:underline">
                <LogIn className="h-4 w-4" aria-hidden /> Coach login
              </Link>
            )}
            {coach === "yes" && (
              <p className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-gray-600">
                <span>Signed in as coach</span>
                <Link to="/coach" className="text-blue-900 hover:underline">Manage videos</Link>
                <button type="button" onClick={signOut} className="text-blue-900 hover:underline">Sign out</button>
              </p>
            )}
          </div>

          <SectionHeading
            title="Videos"
            subtitle="Lessons and tips from your coach. Each video is private. Ask your coach for its password."
          />

          {error && <p role="alert" className="text-center text-red-700">{error}</p>}
          {!error && videos === null && <p className="text-center text-gray-500" aria-live="polite">Loading videos…</p>}
          {videos && videos.length === 0 && <p className="text-center text-gray-500">No videos have been posted yet. Check back soon.</p>}

          {videos && videos.length > 0 && (
            <div className="flex flex-col gap-6">
              {videos.slice(0, shown).map((v) => <VideoCard key={v.id} video={v} coach={coach === "yes"} />)}
              {shown < videos.length && (
                <Button variant="outline" className="self-center" onClick={() => setShown((n) => n + PAGE)}>Show more</Button>
              )}
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
