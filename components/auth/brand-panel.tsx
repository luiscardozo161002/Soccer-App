"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { LoaderCircle } from "lucide-react";

export function BrandLogo({ logoUrl, siteName }: { logoUrl: string | null; siteName: string }) {
  return (
    <div className="relative z-10 flex items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt="Logo"
          className="h-12 w-12 shrink-0 rounded-full border-2 border-white/40 bg-white object-cover p-1"
        />
      ) : (
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-2xl">
          <LoaderCircle className="animate-spin text-white" size={24} />
        </span>
      )}
      <span className="text-lg font-black uppercase tracking-tight text-white">{siteName}</span>
    </div>
  );
}

const bottomFadeMask = "linear-gradient(to bottom, black 82%, transparent 100%)";

function PlayerCutout({ src, className, delay }: { src: string; className?: string; delay: number }) {
  return (
    <motion.div
      className={`relative h-full w-1/2 max-w-[260px] ${className ?? ""}`}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {/* Contact shadow — kept outside the fade mask below so it isn't dimmed. */}
      <div className="absolute inset-x-10 bottom-1 z-0 h-3 rounded-full bg-black/50 blur-md" />

      <div className="absolute inset-0" style={{ maskImage: bottomFadeMask, WebkitMaskImage: bottomFadeMask }}>
        <Image src={src} alt="" fill priority sizes="260px" className="object-contain object-bottom" />
      </div>
    </motion.div>
  );
}

const cornerVignette =
  "radial-gradient(ellipse 85% 75% at 0% 100%, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.68) 22%, rgba(0,0,0,0.4) 42%, rgba(0,0,0,0.18) 60%, transparent 80%)";

// Softly darkens the whole photo's edges/highlights, independent of the stronger bottom-left corner shadow.
const edgeVignette =
  "radial-gradient(ellipse 90% 80% at 50% 40%, transparent 40%, rgba(0,0,0,0.32) 75%, rgba(0,0,0,0.55) 100%)";

export function BrandPanel({ logoUrl, siteName }: { logoUrl: string | null; siteName: string }) {
  return (
    <div className="relative hidden w-1/2 shrink-0 overflow-hidden lg:flex lg:flex-col lg:p-12">
      {/* Slightly scaled up so the blur filter never reveals a sharp edge. */}
      <Image
        src="/images/background_image_login.jpg"
        alt=""
        fill
        priority
        sizes="50vw"
        className="scale-110 object-cover blur-[2px]"
      />
      <div
        className="absolute inset-0 bg-black/25 backdrop-blur-[7px]"
        style={{ backgroundImage: edgeVignette }}
      />

      <BrandLogo logoUrl={logoUrl} siteName={siteName} />

      <div className="relative z-10 flex flex-1 items-end justify-center gap-4 pt-4">
        <PlayerCutout src="/images/player-kicking.webp" className="mb-2" delay={0.1} />
        <PlayerCutout src="/images/player-heading.webp" delay={0.25} />
      </div>

      <div className="relative z-10 mt-6 max-w-sm">
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/60">Portal de gestión</span>
        <h2 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white">
          Gestión integral de tu liga
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-white/70">
          Equipos, jugadores, calendario y resultados, todo en un solo lugar.
        </p>
      </div>

      {/* Netflix-style corner shadow — darkens the bottom-left so the pitch and players fade into it there, staying clear everywhere else. */}
      <div className="pointer-events-none absolute inset-0 z-20" style={{ background: cornerVignette }} />
    </div>
  );
}
