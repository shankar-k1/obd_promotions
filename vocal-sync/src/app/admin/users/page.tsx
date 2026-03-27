"use client";

import React, { useState, useEffect } from "react";
import {
    Trash2, Mail, Shield, UserPlus, Search,
    X as XIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext";

export default function AdminUsers() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "USER" });
    const { t } = useTheme();

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get("/api/admin/users");
            setUsers(res.data.users);
            setLoading(false);
        } catch (err) { console.error("Failed to fetch users:", err); }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post("/api/admin/users", { user: { ...newUser, id: Math.random().toString(36).substr(2, 9) } });
            fetchUsers();
            setShowAddModal(false);
            setNewUser({ name: "", email: "", password: "", role: "USER" });
        } catch (err) { console.error("Failed to add user:", err); }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm("Are you sure you want to remove this user?")) return;
        try {
            await axios.delete(`/api/admin/users?id=${id}`);
            fetchUsers();
        } catch (err) { console.error("Failed to delete user:", err); }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return null;

    const inputStyle: React.CSSProperties = {
        background: t.inputBg,
        border: `1px solid ${t.border}`,
        color: t.textPrimary,
        "--tw-ring-color": `${t.primary}40`,
    } as React.CSSProperties;

    return (
        <div className="w-full space-y-10">

            {/* ─── Header ─── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight" style={{ color: t.textPrimary }}>
                        User Management
                    </h1>
                    <p className="text-base font-medium" style={{ color: t.textSecondary }}>
                        Manage identities and access control for the platform.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: t.textMuted }} />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 transition-all w-56 font-medium"
                            style={inputStyle}
                        />
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="h-10 px-5 rounded-xl text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                        style={{ background: t.primary }}
                    >
                        <UserPlus className="w-4 h-4" />
                        Add User
                    </button>
                </div>
            </div>

            {/* ─── Users Table ─── */}
            <div className="rounded-2xl overflow-hidden" style={{ background: t.bgCard, border: `1px solid ${t.cardBorder}` }}>
                <table className="w-full text-left">
                    <thead>
                        <tr style={{ borderBottom: `1px solid ${t.border}` }}>
                            <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold" style={{ color: t.textMuted }}>User</th>
                            <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold hidden md:table-cell" style={{ color: t.textMuted }}>Role</th>
                            <th className="px-6 py-4 text-[11px] uppercase tracking-widest font-bold text-right" style={{ color: t.textMuted }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((u, i) => (
                            <motion.tr
                                key={u.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.03 }}
                                className="transition-colors"
                                style={{ borderBottom: i < filteredUsers.length - 1 ? `1px solid ${t.border}` : "none" }}
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                                            style={{ background: `${t.primary}18`, color: t.primary }}
                                        >
                                            {u.name?.[0] || u.email[0].toUpperCase()}
                                        </div>
                                        <div className="space-y-1">
                                            <p className="font-semibold text-sm" style={{ color: t.textPrimary }}>
                                                {u.name || "Unnamed User"}
                                            </p>
                                            <p className="text-xs flex items-center gap-1.5" style={{ color: t.textSecondary }}>
                                                <Mail className="w-3 h-3" /> {u.email}
                                            </p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 hidden md:table-cell">
                                    <span className={cn(
                                        "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5",
                                        u.role === "ADMIN"
                                            ? "bg-purple-500/10 text-purple-500"
                                            : "bg-blue-400/10 text-blue-500"
                                    )} style={{ border: `1px solid ${u.role === "ADMIN" ? "rgba(168,85,247,0.2)" : "rgba(59,130,246,0.2)"}` }}>
                                        <Shield className="w-3 h-3" />
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <button
                                        onClick={() => handleDeleteUser(u.id)}
                                        className="w-9 h-9 inline-flex items-center justify-center rounded-lg transition-all hover:scale-110 active:scale-90 hover:bg-red-500/10 hover:text-red-500"
                                        style={{ background: t.hoverBg, color: t.textMuted }}
                                        title="Remove user"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-16 text-center text-sm" style={{ color: t.textMuted }}>
                                    No users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Add User Modal ─── */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.96, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.96, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="w-full max-w-md rounded-2xl p-8 shadow-2xl overflow-hidden relative"
                            style={{ background: t.isDark ? "#0f1320" : "#ffffff", border: `1px solid ${t.border}` }}
                        >
                            {/* Gradient Accent */}
                            <div className="absolute top-0 left-0 w-full h-0.5" style={{ background: `linear-gradient(to right, ${t.primary}, ${t.secondary})` }} />

                            {/* Modal Header */}
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${t.primary}18` }}>
                                        <UserPlus className="w-5 h-5" style={{ color: t.primary }} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <h2 className="text-xl font-bold" style={{ color: t.textPrimary }}>Add New User</h2>
                                        <p className="text-xs" style={{ color: t.textMuted }}>Create a new platform account</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                    style={{ background: t.hoverBg, color: t.textMuted }}
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleAddUser} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Full Name</label>
                                    <input
                                        type="text" required value={newUser.name}
                                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all font-medium"
                                        style={inputStyle}
                                        placeholder="Enter full name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Email Address</label>
                                    <input
                                        type="email" required value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all font-medium"
                                        style={inputStyle}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Password</label>
                                    <input
                                        type="password" required value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        className="w-full rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all font-mono"
                                        style={inputStyle}
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider" style={{ color: t.textMuted }}>Role</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                        className="w-full appearance-none rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 transition-all cursor-pointer font-medium"
                                        style={inputStyle}
                                    >
                                        <option value="USER">Standard User</option>
                                        <option value="ADMIN">Administrator</option>
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 h-11 rounded-xl font-semibold text-sm flex items-center justify-center transition-all"
                                        style={{ background: t.hoverBg, border: `1px solid ${t.border}`, color: t.textSecondary }}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 h-11 rounded-xl text-white font-semibold text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
                                        style={{ background: t.primary }}
                                    >
                                        Create User
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
