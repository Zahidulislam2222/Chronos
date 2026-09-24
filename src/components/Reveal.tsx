import { motion } from "framer-motion";
import { useMotionPreference } from "@/hooks/use-motion-preference";
import { motionTokens } from "@/config/settings";
import type { ReactNode } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useMotionPreference();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{
        duration: reduced ? 0 : motionTokens.reveal,
        delay: reduced ? 0 : delay,
        ease: motionTokens.ease,
      }}
    >
      {children}
    </motion.div>
  );
}
