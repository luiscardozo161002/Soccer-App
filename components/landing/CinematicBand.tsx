import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n/LocaleContext";
import { sectionReveal } from "@/lib/landing/animations";

export function CinematicBand() {
  const { t } = useLocale();

  return (
    <motion.section
      className="relative mt-20 h-56 overflow-hidden bg-gradient-to-br from-primary-light via-surface to-background sm:h-72"
      {...sectionReveal}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, color-mix(in srgb, var(--color-primary) 16%, transparent), transparent 60%)",
        }}
      />
      <div className="relative flex h-full flex-col items-center justify-end gap-1 pb-8 text-center">
        <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary ">
          {t.cinematic.season(new Date().getFullYear())}
        </span>
        <p className="text-lg font-black uppercase tracking-tight text-ink dark:text-white sm:text-xl">
          {t.cinematic.tagline}
        </p>
      </div>
    </motion.section>
  );
}
