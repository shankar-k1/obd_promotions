"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type ThemeKey = "dark" | "light" | "midnight";

interface ThemeColors {
    name: string;
    primary: string;
    secondary: string;
    accent: string;
    bg: string;
    bgCard: string;
    sidebarBg: string;
    dot: string;
    isDark: boolean;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    inputBg: string;
    cardBorder: string;
    hoverBg: string;
    topBarBg: string;
}

const themes: Record<ThemeKey, ThemeColors> = {
    dark: {
        name: "Standard Dark",
        primary: "#3b82f6",
        secondary: "#22d3ee",
        accent: "#10b981",
        bg: "#020617",
        bgCard: "rgba(15, 23, 42, 0.7)",
        sidebarBg: "rgba(2, 6, 23, 0.9)",
        dot: "#22d3ee",
        isDark: true,
        textPrimary: "#f8fafc",
        textSecondary: "#94a3b8",
        textMuted: "#64748b",
        border: "rgba(255,255,255,0.08)",
        inputBg: "rgba(15, 23, 42, 0.5)",
        cardBorder: "rgba(255,255,255,0.08)",
        hoverBg: "rgba(255,255,255,0.05)",
        topBarBg: "rgba(2, 6, 23, 0.8)",
    },
    midnight: {
        name: "Midnight",
        primary: "#818cf8",
        secondary: "#6366f1",
        accent: "#a855f7",
        bg: "#050510",
        bgCard: "rgba(10, 10, 30, 0.7)",
        sidebarBg: "rgba(5, 5, 16, 0.9)",
        dot: "#818cf8",
        isDark: true,
        textPrimary: "#e0e0f0",
        textSecondary: "#8080a0",
        textMuted: "#505070",
        border: "rgba(129, 140, 248, 0.15)",
        inputBg: "rgba(5, 5, 16, 0.5)",
        cardBorder: "rgba(129, 140, 248, 0.15)",
        hoverBg: "rgba(255,255,255,0.03)",
        topBarBg: "rgba(5, 5, 16, 0.8)",
    },
    light: {
        name: "Light",
        primary: "#3b82f6",
        secondary: "#22d3ee",
        accent: "#10b981",
        bg: "#f8fafc",
        bgCard: "rgba(255, 255, 255, 0.6)",
        sidebarBg: "#ffffff",
        dot: "#3b82f6",
        isDark: false,
        textPrimary: "#0f172a",
        textSecondary: "#475569",
        textMuted: "#94a3b8",
        border: "rgba(0,0,0,0.06)",
        inputBg: "#f1f5f9",
        cardBorder: "rgba(0,0,0,0.06)",
        hoverBg: "rgba(0,0,0,0.03)",
        topBarBg: "rgba(255,255,255,0.8)",
    },
};

interface ThemeContextType {
    theme: ThemeKey;
    t: ThemeColors;
    setTheme: (t: ThemeKey) => void;
    allThemes: typeof themes;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: "dark",
    t: themes.dark,
    setTheme: () => { },
    allThemes: themes,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<ThemeKey>("dark");

    useEffect(() => {
        // Sync with main app via Query Param or LocalStorage
        const params = new URLSearchParams(window.location.search);
        const urlTheme = params.get("theme") as ThemeKey | null;
        const saved = localStorage.getItem("obd-theme") as ThemeKey | null;
        
        const targetTheme = (urlTheme && themes[urlTheme]) ? urlTheme : 
                           (saved && themes[saved]) ? saved : "dark";
                           
        setTheme(targetTheme);
    }, []);

    const setTheme = (key: ThemeKey) => {
        setThemeState(key);
        localStorage.setItem("obd-theme", key);
        applyTheme(key);
    };

    const applyTheme = (key: ThemeKey) => {
        const c = themes[key];
        const root = document.documentElement;
        
        root.style.setProperty("--primary", c.primary);
        root.style.setProperty("--secondary", c.secondary);
        root.style.setProperty("--accent", c.accent);
        root.style.setProperty("--bg-primary", c.bg);
        root.style.setProperty("--bg-card", c.bgCard);
        root.style.setProperty("--text-primary", c.textPrimary);
        root.style.setProperty("--text-secondary", c.textSecondary);
        root.style.setProperty("--text-muted", c.textMuted);
        root.style.setProperty("--line", c.border);
        root.style.setProperty("--input-bg", c.inputBg);
        
        root.setAttribute("data-theme", key);
        
        if (c.isDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    };

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, t: themes[theme], setTheme, allThemes: themes }}>
            {children}
        </ThemeContext.Provider>
    );
}
