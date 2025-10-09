// src/componenets/buttons/AnimatedButton.tsx
import { motion } from "framer-motion";
import { Icon } from "@iconify/react";

interface AnimatedButtonProps {
  isOpen?: boolean;
  onClick: () => void;
  openTitle?: string;
  closeTitle?: string;
  openIcon?: string;
  closeIcon?: string;
  icon?: string;
  title?: string;
  className?: string;
  iconClassName?: string;
  tooltip?: string; // NEW: hover tooltip label
}

export function AnimatedButton({
  isOpen,
  onClick,
  openTitle = "Close Panel",
  closeTitle = "Open Panel",
  openIcon = "streamline-kameleon-color:map",
  closeIcon = "streamline-kameleon-color:map-pin",
  icon,
  title,
  className = "",
  iconClassName,
  tooltip,
}: Readonly<AnimatedButtonProps>) {
  const resolvedIcon = icon || (isOpen ? openIcon : closeIcon);
  const resolvedTitle = title || (isOpen ? openTitle : closeTitle);
  const tip = tooltip || resolvedTitle;

  return (
    <div className="relative group">
      <motion.button
        whileTap={{ scale: 0.9, rotate: -6 }}
        whileHover={{ y: -1 }}
        transition={{ type: "spring", stiffness: 500, damping: 18, mass: 0.9 }}
        className={`
          inline-flex items-center justify-center leading-none
          rounded-2xl
          h-12 w-12
          bg-white/90 hover:bg-white
          shadow-md shadow-black/10
          ring-1 ring-black/5
          outline-none
          focus-visible:ring-2 focus-visible:ring-blue-400/40
          ${className}
        `}
        onClick={onClick}
        title={resolvedTitle}
        aria-label={resolvedTitle}
        type="button"
      >
        <Icon
          icon={resolvedIcon}
          className={iconClassName || "block h-6 w-6 md:h-6.5 md:w-6.5"}
        />
      </motion.button>

      {/* Tooltip (desktop only) */}
      <div
        className="
          pointer-events-none
          absolute right-full top-1/2 -translate-y-1/2 mr-2
          hidden md:block
          opacity-0 group-hover:opacity-100
          transition-opacity duration-150
        "
      >
        <div
          className="
          px-2.5 py-1 rounded-lg text-xs font-medium
          bg-black/75 text-white
          shadow-lg backdrop-blur
        "
        >
          {tip}
        </div>
      </div>
    </div>
  );
}
