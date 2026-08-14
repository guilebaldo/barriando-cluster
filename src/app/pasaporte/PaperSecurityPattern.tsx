/** Fondo liviano tipo papel pautado — CSS only, apto para swipe en mobile. */
export default function PaperSecurityPattern() {
  return (
    <>
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(160,120,60,0.07) 24px, rgba(160,120,60,0.07) 25px), repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(160,120,60,0.035) 24px, rgba(160,120,60,0.035) 25px)",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{ boxShadow: "inset 0 0 56px rgba(120,90,40,0.06)" }}
        aria-hidden
      />
    </>
  );
}
