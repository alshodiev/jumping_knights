import { useCallback, useEffect, useState } from "react";
import PageShell from "@/components/site/PageShell";
import CoachLogin from "@/components/videos/CoachLogin";
import CoachUpload from "@/components/videos/CoachUpload";
import CoachVideoRow from "@/components/videos/CoachVideoRow";
import { Button } from "@/components/ui/button";
import { usePageMeta } from "@/lib/usePageMeta";
import { coachList, coachLogout, coachMe, type CoachVideo } from "@/lib/videosApi";

type Auth = "checking" | "out" | "in" | "unconfigured" | "unreachable";

export default function CoachPage() {
  usePageMeta("Coach | Jumping Knights", true);
  const [auth, setAuth] = useState<Auth>("checking");
  const [videos, setVideos] = useState<CoachVideo[] | null>(null);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try { setVideos(await coachList()); setError(""); }
    catch (e) {
      if ((e as { status?: number }).status === 401) setAuth("out");
      else setError((e as Error).message);
    }
  }, []);

  const check = useCallback(async () => {
    try {
      const me = await coachMe();
      setAuth(!me.configured ? "unconfigured" : me.signedIn ? "in" : "out");
    } catch { setAuth("unreachable"); }
  }, []);

  useEffect(() => { void check(); }, [check]);
  useEffect(() => { if (auth === "in") void refresh(); }, [auth, refresh]);

  const signOut = async () => { await coachLogout().catch(() => undefined); setVideos(null); setAuth("out"); };

  return (
    <PageShell>
      <section className="py-12 sm:py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {auth === "checking" && <p className="text-center text-gray-500" aria-live="polite">Loading…</p>}
          {auth === "unreachable" && <p role="alert" className="text-center text-red-700">We couldn't reach the server. Please try again in a moment.</p>}
          {auth === "unconfigured" && <p role="alert" className="text-center text-gray-700">Coach sign-in isn't set up on the server yet. See DEPLOY.md.</p>}
          {auth === "out" && <CoachLogin onSignedIn={() => setAuth("in")} />}

          {auth === "in" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-blue-900">Your videos</h1>
                <Button variant="outline" onClick={signOut}>Sign out</Button>
              </div>

              <CoachUpload onUploaded={refresh} />

              <div>
                <h2 className="text-xl font-semibold text-blue-900 mb-3">All videos</h2>
                {error && <p role="alert" className="text-red-700 mb-3">{error}</p>}
                {videos === null && !error && <p className="text-gray-500">Loading…</p>}
                {videos?.length === 0 && <p className="text-gray-500">Nothing uploaded yet.</p>}
                <ul className="space-y-3">
                  {videos?.map((v) => <CoachVideoRow key={v.id} video={v} onChanged={refresh} />)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
