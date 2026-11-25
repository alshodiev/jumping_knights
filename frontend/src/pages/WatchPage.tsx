import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PageShell from "@/components/site/PageShell";
import VideoCard from "@/components/videos/VideoCard";
import { usePageMeta } from "@/lib/usePageMeta";
import { getVideo, type PublicVideo } from "@/lib/videosApi";

/** The link a coach shares: one private video with its password box already open. */
export default function WatchPage() {
  usePageMeta("Watch | Jumping Knights", true);
  const { id = "" } = useParams();
  const [video, setVideo] = useState<PublicVideo | null>(null);
  const [state, setState] = useState<"loading" | "missing" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading"); setVideo(null);
    getVideo(id)
      .then((v) => alive && setVideo(v))
      .catch((e: { status?: number }) => alive && setState(e.status === 404 ? "missing" : "error"));
    return () => { alive = false; };
  }, [id]);

  return (
    <PageShell>
      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {video && <VideoCard video={video} autoOpen />}
          {!video && state === "loading" && <p className="text-center text-gray-500" aria-live="polite">Loading…</p>}
          {!video && state === "missing" && (
            <div className="text-center">
              <h1 className="text-2xl font-bold text-blue-900 mb-2">This video isn't available</h1>
              <p className="text-gray-600 mb-4">The link may be wrong, or the video was removed.</p>
              <Link to="/videos" className="text-blue-900 underline">See all videos</Link>
            </div>
          )}
          {!video && state === "error" && <p role="alert" className="text-center text-red-700">We couldn't load this video. Please try again in a moment.</p>}
        </div>
      </section>
    </PageShell>
  );
}
