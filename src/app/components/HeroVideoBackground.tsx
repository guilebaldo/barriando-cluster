const HERO_YOUTUBE_ID = "yFKtQSGwDdQ";

const embedSrc = `https://www.youtube.com/embed/${HERO_YOUTUBE_ID}?autoplay=1&mute=1&loop=1&playlist=${HERO_YOUTUBE_ID}&controls=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3`;

export default function HeroVideoBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <iframe
        title="Video de fondo Barriando"
        src={embedSrc}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] max-w-none border-0 opacity-70"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
