"use client";

import { useEffect, useRef, useState } from "react";

const HERO_YOUTUBE_ID = "yFKtQSGwDdQ";

function buildEmbedSrc(origin: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: HERO_YOUTUBE_ID,
    controls: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    iv_load_policy: "3",
    cc_load_policy: "0",
    disablekb: "1",
    fs: "0",
    enablejsapi: "1",
    origin,
  });
  return `https://www.youtube-nocookie.com/embed/${HERO_YOUTUBE_ID}?${params.toString()}`;
}

function sendPlayerCommand(iframe: HTMLIFrameElement, func: "playVideo" | "mute") {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: "command", func, args: [] }),
    "*"
  );
}

export default function HeroVideoBackground() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [embedSrc, setEmbedSrc] = useState<string | null>(null);

  useEffect(() => {
    setEmbedSrc(buildEmbedSrc(window.location.origin));
  }, []);

  useEffect(() => {
    if (!embedSrc) return;

    const iframe = iframeRef.current;
    if (!iframe) return;

    const kickPlayback = () => {
      sendPlayerCommand(iframe, "mute");
      sendPlayerCommand(iframe, "playVideo");
    };

    const onLoad = () => {
      kickPlayback();
      window.setTimeout(kickPlayback, 400);
      window.setTimeout(kickPlayback, 1200);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") kickPlayback();
    };

    iframe.addEventListener("load", onLoad);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      iframe.removeEventListener("load", onLoad);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [embedSrc]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      {embedSrc ? (
        <iframe
          ref={iframeRef}
          title="Video de fondo Barriando"
          src={embedSrc}
          className="absolute left-1/2 border-0 opacity-70 pointer-events-none"
          style={{
            top: "46%",
            transform: "translate(-50%, -50%) scale(1.18)",
            width: "100vw",
            height: "56.25vw",
            minHeight: "118%",
            minWidth: "210vh",
          }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          loading="eager"
        />
      ) : (
        <div className="absolute inset-0 bg-[#1e2b58]" />
      )}
      <div className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-[#27366D] via-[#27366D]/80 to-transparent" />
    </div>
  );
}
