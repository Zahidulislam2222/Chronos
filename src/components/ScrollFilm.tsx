import { useEffect, useRef, useState } from "react";
import {
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { cinema } from "@/config/cinema";
export default function ScrollFilm({
  scene,
  children,
  className = "",
}: {
  scene: "hero" | "study";
  children: React.ReactNode;
  className?: string;
}) {
  const root = useRef<HTMLElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const desired = useRef(0);
  const reduced = useMotionPreference();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => { setReady(false); }, [reduced]);
  const [visible, setVisible] = useState(scene === "hero");
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setVisible(entry.isIntersecting),
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const { scrollYProgress } = useScroll({
    target: root,
    offset: ["start start", "end end"],
  });
  const media = cinema[scene];
  const [mobile, setMobile] = useState(
    () =>
      window.matchMedia(`(max-width: ${cinema.mobileBreakpoint}px)`).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(
      `(max-width: ${cinema.mobileBreakpoint}px)`,
    );
    const change = () => {
      setMobile(query.matches);
      setReady(false);
      setFailed(false);
    };
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useMotionValueEvent(scrollYProgress, "change", (value) => {
    desired.current = value;
    root.current?.style.setProperty("--film-progress", String(value));
  });
  useEffect(() => {
    if (reduced || failed || !visible || !ready) return;
    let frame: number;
    const update = () => {
      const el = video.current;
      if (el && ready && Number.isFinite(el.duration) && !el.seeking) {
        const target =
          desired.current * Math.max(0, el.duration - cinema.endPadding);
        if (Math.abs(el.currentTime - target) > cinema.seekThreshold)
          el.currentTime = target;
      }
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [ready, reduced, failed, visible]);
  return (
    <section
      ref={root}
      className={`film-section ${className} ${reduced || failed ? "film-reduced" : ""}`}
      data-scene={scene}
      data-film-status={
        failed ? "fallback" : reduced ? "reduced" : ready ? "ready" : "loading"
      }
    >
      <div className="film-stage">
        <picture className="film-poster">
          <source
            media={`(max-width: ${cinema.mobileBreakpoint}px)`}
            srcSet={
              reduced || failed
                ? media.mobileFallbackPoster
                : media.mobilePoster
            }
          />
          <img
            src={reduced || failed ? media.fallbackPoster : media.poster}
            alt=""
            fetchPriority={scene === "hero" ? "high" : "auto"}
          />
        </picture>
        {!reduced && !failed && (
          <video
            key={`${scene}-${mobile}`}
            ref={video}
            className={ready ? "film-video is-ready" : "film-video"}
            src={mobile ? media.mobileVideo : media.video}
            muted
            playsInline
            preload={scene === "hero" ? "auto" : "metadata"}
            aria-hidden="true"
            onLoadedData={() => setReady(true)}
            onError={() => {
              setFailed(true);
              setReady(false);
            }}
          />
        )}
        {children}
        <div className="film-meter" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
