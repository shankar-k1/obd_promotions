"use client";

import React, { useState } from "react";
import {
    LayoutDashboard, Users, Settings,
    Shield, ArrowLeft, LogOut,
    Menu, X, FileUp, Palette, Bell,
    Sun, Moon
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { redirect } from "next/navigation";
import { ThemeProvider, useTheme, ThemeKey } from "@/context/ThemeContext";

/* ─── Theme Picker Dropdown ─── */
function ThemePicker() {
    const { theme, setTheme, allThemes, t } = useTheme();
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="h-10 px-4 rounded-xl inline-flex items-center justify-center gap-2.5 transition-all text-sm font-semibold"
                style={{
                    background: t.hoverBg,
                    border: `1px solid ${t.border}`,
                    color: t.textSecondary,
                }}
            >
                {t.isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                <div className="w-3.5 h-3.5 rounded-full" style={{ background: t.primary }} />
                <span className="hidden sm:inline">{t.name}</span>
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.97 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full mt-2 z-50 w-64 rounded-2xl p-3 shadow-2xl"
                            style={{
                                background: t.isDark ? "#0f1320" : "#ffffff",
                                border: `1px solid ${t.border}`,
                            }}
                        >
                            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: t.textMuted }}>
                                Appearance
                            </p>
                            <div className="space-y-0.5">
                                {(Object.keys(allThemes) as ThemeKey[]).map((key) => {
                                    const item = allThemes[key];
                                    return (
                                        <button
                                            key={key}
                                            onClick={() => { setTheme(key); setOpen(false); }}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                                                theme === key ? "font-semibold" : ""
                                            )}
                                            style={{
                                                background: theme === key ? t.hoverBg : "transparent",
                                                color: theme === key ? t.textPrimary : t.textSecondary,
                                            }}
                                        >
                                            <div className="flex gap-1">
                                                <div className="w-3 h-3 rounded-full" style={{ background: item.primary }} />
                                                <div className="w-3 h-3 rounded-full" style={{ background: item.secondary }} />
                                            </div>
                                            <span className="text-sm flex-1">{item.name}</span>
                                            {!item.isDark && <Sun className="w-3 h-3" style={{ color: t.textMuted }} />}
                                            {theme === key && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── Layout Inner ─── */
function AdminLayoutInner({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const pathname = usePathname();
    const { t } = useTheme();

    if (status === "loading") return null;
    if (!session || (session.user as any).role !== "ADMIN") {
        redirect("/");
    }

    const menuItems = [
        { name: "Overview", icon: <LayoutDashboard className="w-[18px] h-[18px]" />, path: "/admin" },
        { name: "User Management", icon: <Users className="w-[18px] h-[18px]" />, path: "/admin/users" },
        { name: "Global Settings", icon: <Settings className="w-[18px] h-[18px]" />, path: "/admin/settings" },
        { name: "Security & Keys", icon: <Shield className="w-[18px] h-[18px]" />, path: "/admin/keys" },
        { name: "Limits & Controls", icon: <FileUp className="w-[18px] h-[18px]" />, path: "/admin/limits" }
    ];

    const userName = (session.user as any)?.name || (session.user as any)?.email || "Admin";

    return (
        <div className="flex h-screen transition-colors duration-300" style={{ background: t.bg, color: t.textPrimary }}>

            {/* ─── Sidebar ─── */}
            <motion.aside
                initial={false}
                animate={{ width: sidebarOpen ? "260px" : "76px" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="relative z-50 overflow-hidden flex flex-col shrink-0"
                style={{ background: t.sidebarBg, borderRight: `1px solid ${t.border}` }}
            >
                {/* Brand */}
                <div className="px-6 py-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${t.border}` }}>
                    {sidebarOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                            <div
                                className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm text-white shadow-md"
                                style={{ background: t.primary }}
                            >A</div>
                            <div className="leading-tight">
                                <p className="font-bold text-sm" style={{ color: t.textPrimary }}>Admin Hub</p>
                                <p className="text-[10px] font-medium" style={{ color: t.textMuted }}>VocalSync</p>
                            </div>
                        </motion.div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-lg transition-colors"
                        style={{ color: t.textMuted }}
                    >
                        {sidebarOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
                    </button>
                </div>

                {/* Nav Links */}
                <nav className="flex-1 px-5 py-6 space-y-2">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.path;
                        return (
                            <Link key={item.path} href={item.path}>
                                <div
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
                                    style={{
                                        background: isActive ? t.primary : "transparent",
                                        color: isActive ? (t.isDark ? "#000" : "#fff") : t.textSecondary,
                                        fontWeight: isActive ? 700 : 500,
                                    }}
                                >
                                    <div className="shrink-0 flex items-center justify-center">{item.icon}</div>
                                    {sidebarOpen && <span className="text-[13px] truncate">{item.name}</span>}
                                </div>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="px-5 py-6 space-y-2" style={{ borderTop: `1px solid ${t.border}` }}>
                    <Link href="/">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all" style={{ color: t.textSecondary }}>
                            <ArrowLeft className="w-[18px] h-[18px] shrink-0" />
                            {sidebarOpen && <span className="text-[13px] font-medium">Exit Admin</span>}
                        </div>
                    </Link>
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500/70 hover:text-red-500"
                    >
                        <LogOut className="w-[18px] h-[18px] shrink-0" />
                        {sidebarOpen && <span className="text-[13px] font-medium">Sign Out</span>}
                    </button>
                </div>
            </motion.aside>

            {/* ─── Main ─── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

                {/* Top Bar */}
                <header
                    className="h-14 flex items-center justify-between px-6 shrink-0 backdrop-blur-xl"
                    style={{ background: t.topBarBg, borderBottom: `1px solid ${t.border}` }}
                >
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-sm" style={{ color: t.textMuted }}>
                        <span>Admin</span>
                        <span className="opacity-40">/</span>
                        <span style={{ color: t.textPrimary }} className="font-semibold capitalize">
                            {pathname === "/admin" ? "Overview" : pathname.split("/").pop()?.replace(/-/g, " ")}
                        </span>
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-3">
                        <ThemePicker />

                        <button
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all relative"
                            style={{ background: t.hoverBg, border: `1px solid ${t.border}`, color: t.textMuted }}
                        >
                            <Bell className="w-4 h-4" />
                            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2" style={{ borderColor: t.bg }} />
                        </button>

                        <div
                            className="h-10 px-3 rounded-xl inline-flex items-center justify-center gap-2.5"
                            style={{ background: t.hoverBg, border: `1px solid ${t.border}` }}
                        >
                            <div
                                className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[11px]"
                                style={{ background: t.primary }}
                            >
                                {userName[0].toUpperCase()}
                            </div>
                            <span className="text-sm font-medium hidden sm:inline" style={{ color: t.textSecondary }}>
                                {userName}
                            </span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto" style={{ padding: "32px 40px 48px 40px" }}>
                    <div className="w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

/* ─── Export ─── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AdminLayoutInner>{children}</AdminLayoutInner>
        </ThemeProvider>
    );
}
