"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPToastProps {
  amount: number;
  axisColor: string;
  axisName?: string;
}

export function XPToast({ amount, axisColor, axisName }: XPToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.95 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
          style={{
            backgroundColor: axisColor,
            color: "#fff",
          }}
        >
          <Zap className="size-4 fill-current" />
          <span className="text-sm font-bold">+{amount} XP</span>
          {axisName && (
            <span className="text-xs opacity-80">{axisName}</span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
