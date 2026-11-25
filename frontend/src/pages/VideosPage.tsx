import { useEffect, useState } from "react";
import PageShell from "@/components/site/PageShell";
import SectionHeading from "@/components/site/SectionHeading";
import VideoCard from "@/components/videos/VideoCard";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/usePageMeta";
import { listVideos, type PublicVideo } from "@/lib/videosApi";

const PAGE = 8;

export default function VideosPage() {
  usePageMeta("Videos | Jumping Knights");
  const [videos, setVideos] = useState<PublicVideo[] | null>(null);
  const [error, setError] = useState("");
  const [shown, setShown] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    listVideos().then((v) => alive && setVideos(v)).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, []);

  return (
    <PageShell>
      <section className="py-16 sm:py-20">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <SectionHeading
            title="Videos"
            subtitle="Lessons and tips from your coach. Each video is private. Ask your coach for its password."
          />

          {error && <p role="alert" className="text-center text-red-700">{error}</p>}
          {!error && videos === null && <p className="text-center text-gray-500" aria-live="polite">Loading videos…</p>}
          {videos && videos.length === 0 && <p className="text-center text-gray-500">No videos have been posted yet. Check back soon.</p>}

          {videos && videos.length > 0 && (
            <div className="flex flex-col gap-6">
              {videos.slice(0, shown).map((v) => <VideoCard key={v.id} video={v} />)}
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
