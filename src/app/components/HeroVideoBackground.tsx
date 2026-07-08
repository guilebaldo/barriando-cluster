const HERO_YOUTUBE_ID = "yFKtQSGwDdQ";

const embedSrc = `https://www.youtube-nocookie.com/embed/${HERO_YOUTUBE_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_YOUTUBE_ID}&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&cc_load_policy=0&disablekb=1&fs=0`;

export default function HeroVideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <iframe
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
      />
      <div className="absolute inset-x-0 bottom-0 h-[18%] bg-gradient-to-t from-[#27366D] via-[#27366D]/80 to-transparent" />
    </div>
  );
}
