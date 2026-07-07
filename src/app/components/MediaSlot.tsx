import fs from "fs";
import path from "path";
import Image from "next/image";

export type MediaSlotProps = {
  id: string;
  type: "image" | "video";
  /** Path relative to /public, e.g. `/equipo/alexander-gehrke.jpg` */
  expectedPath: string;
  aspectRatio?: string;
  description: string;
  className?: string;
  imageClassName?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

function resolvePublicPath(expectedPath: string): string {
  return expectedPath.startsWith("/") ? expectedPath.slice(1) : expectedPath;
}

function mediaExists(expectedPath: string): boolean {
  const relative = resolvePublicPath(expectedPath);
  return fs.existsSync(path.join(process.cwd(), "public", relative));
}

function Placeholder({
  id,
  description,
  aspectRatio,
  className,
}: Pick<MediaSlotProps, "id" | "description" | "aspectRatio" | "className">) {
  return (
    <div
      className={`border-2 border-dashed border-slate-300/80 bg-slate-50 rounded-lg flex flex-col items-center justify-center p-4 text-center ${className ?? ""}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      data-media-slot={id}
    >
      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{id}</span>
      <p className="text-xs text-slate-500 mt-2 max-w-[16rem] leading-relaxed">{description}</p>
    </div>
  );
}

export default function MediaSlot({
  id,
  type,
  expectedPath,
  aspectRatio,
  description,
  className,
  imageClassName,
  fill,
  priority,
  sizes,
}: MediaSlotProps) {
  if (!mediaExists(expectedPath)) {
    return <Placeholder id={id} description={description} aspectRatio={aspectRatio} className={className} />;
  }

  if (type === "video") {
    return (
      <video
        autoPlay
        loop
        muted
        playsInline
        className={className}
        aria-label={description}
        data-media-slot={id}
      >
        <source src={expectedPath} />
      </video>
    );
  }

  if (fill) {
    return (
      <Image
        src={expectedPath}
        alt={description}
        fill
        className={imageClassName ?? "object-cover"}
        priority={priority}
        sizes={sizes ?? "100vw"}
        data-media-slot={id}
      />
    );
  }

  return (
    <div
      className={`relative overflow-hidden ${className ?? ""}`}
      style={aspectRatio ? { aspectRatio } : undefined}
      data-media-slot={id}
    >
      <Image
        src={expectedPath}
        alt={description}
        fill
        className={imageClassName ?? "object-cover"}
        priority={priority}
        sizes={sizes ?? "100vw"}
      />
    </div>
  );
}
