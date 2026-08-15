import "./aurora.css";

export function AuroraBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, #fdfcfb 0%, #f7f2ea 54%, #ece7de 100%)",
        }}
      />
      <div
        className="absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full opacity-60 blur-3xl animate-[sakeenah-float_16s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(222,171,101,0.34), transparent 70%)" }}
      />
      <div
        className="absolute -bottom-40 -left-24 h-[480px] w-[480px] rounded-full opacity-60 blur-3xl animate-[sakeenah-float_20s_ease-in-out_infinite_reverse]"
        style={{ background: "radial-gradient(circle, rgba(184,138,79,0.24), transparent 70%)" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(255,255,255,0.75), transparent 70%)" }}
      />
      <div
        className="absolute inset-0 opacity-[0.025] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
