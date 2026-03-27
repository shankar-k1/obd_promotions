"use client";

import React from "react";
import { Moon, Sun, Monitor, Palette } from "lucide-react";
import { useTheme, ThemeKey } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
    const { theme, setTheme, allThemes, t } = useTheme();
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="action-secondary h-11 px-4 flex items-center gap-2 font-semibold"
                title="Change Theme"
            >
                {theme === "light" ? (
                    <Sun className="h-4 w-4" />
                ) : theme === "midnight" ? (
                    <Moon className="h-4 w-4" />
                ) : (
                    <Palette className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Theme</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
                            onClick={() => setIsOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 top-full mt-2 z-50 min-w-[200px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-primary)] p-2 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="grid grid-cols-1 gap-1">
                                {(Object.entries(allThemes) as [ThemeKey, typeof t][]).map(([key, themeData]) => (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setTheme(key);
                                            setIsOpen(false);
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all duration-200",
                                            theme === key 
                                                ? "bg-[var(--primary)] text-white" 
                                                : "text-[var(--text-secondary)] hover:bg-[var(--hover-bg)] hover:text-[var(--text-primary)]"
                                        )}
                                    >
                                        <div 
                                            className="h-4 w-4 rounded-full border border-white/20" 
                                            style={{ backgroundColor: themeData.primary }}
                                        />
                                        <span className="flex-1 text-left">{themeData.name}</span>
                                        {theme === key && (
                                            <motion.div
                                                layoutId="active-theme"
                                                className="h-1.5 w-1.5 rounded-full bg-white"
                                            />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
