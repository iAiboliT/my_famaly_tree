"use client";

import { useState, useEffect } from "react";
import { X, UserPlus, Shield, ShieldCheck, Trash2, Loader2, Mail } from "lucide-react";

interface TreeAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    treeId: string;
}

export default function TreeAccessModal({ isOpen, onClose, treeId }: TreeAccessModalProps) {
    const [accessors, setAccessors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteCanEdit, setInviteCanEdit] = useState(false);
    const [inviting, setInviting] = useState(false);

    useEffect(() => {
        if (isOpen && treeId) {
            fetchAccessors();
        }
    }, [isOpen, treeId]);

    const fetchAccessors = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tree/access?treeId=${treeId}`);
            if (res.ok) {
                const data = await res.json();
                setAccessors(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail) return;
        setInviting(true);
        try {
            const res = await fetch("/api/tree/access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ treeId, email: inviteEmail, canEdit: inviteCanEdit }),
            });
            if (res.ok) {
                setInviteEmail("");
                fetchAccessors();
            } else {
                const data = await res.json();
                alert(data.error || "Ошибка приглашения");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setInviting(false);
        }
    };

    const handleRemove = async (targetUserId: string) => {
        if (!confirm("Удалить доступ для этого пользователя?")) return;
        try {
            const res = await fetch("/api/tree/access", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ treeId, targetUserId }),
            });
            if (res.ok) fetchAccessors();
        } catch (err) {
            console.error(err);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-white/20 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                <header className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-950/20">
                    <div>
                        <h2 className="text-xl font-black dark:text-white uppercase tracking-tight">Управление доступом</h2>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Кто видит это дерево</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-400">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-6 space-y-8">
                    {/* Invite Form */}
                    <form onSubmit={handleInvite} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-1">Пригласить по email</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        placeholder="user@example.com"
                                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl dark:text-white font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={inviting || !inviteEmail}
                                    className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                                >
                                    {inviting ? <Loader2 className="animate-spin" size={18} /> : <UserPlus size={18} />}
                                </button>
                            </div>
                        </div>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${inviteCanEdit ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${inviteCanEdit ? 'translate-x-4' : ''}`} />
                            </div>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={inviteCanEdit}
                                onChange={(e) => setInviteCanEdit(e.target.checked)}
                            />
                            <span className="text-xs font-bold dark:text-gray-300 group-hover:text-indigo-600 transition-colors">Разрешить редактирование</span>
                        </label>
                    </form>

                    {/* Access List */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Текущий доступ</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {loading ? (
                                <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                            ) : accessors.length === 0 ? (
                                <p className="text-center text-xs text-gray-400 font-medium py-8">Пока никто не добавлен</p>
                            ) : (
                                accessors.map((acc) => (
                                    <div key={acc.userId} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-gray-100 dark:hover:border-gray-700 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm font-black text-xs">
                                                {acc.user.email[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-black dark:text-white truncate max-w-[150px]">{acc.user.email}</p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    {acc.canEdit ? (
                                                        <span className="text-[8px] bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase font-black flex items-center gap-1">
                                                            <ShieldCheck size={8} /> Редактор
                                                        </span>
                                                    ) : (
                                                        <span className="text-[8px] bg-gray-100 dark:bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded uppercase font-black flex items-center gap-1">
                                                            <Shield size={8} /> Читатель
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(acc.userId)}
                                            className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
