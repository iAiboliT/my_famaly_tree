"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Share2, ShieldCheck, Edit2, Check, X, Bell } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import FamilyTree from "@/components/tree/FamilyTree";
import EditPersonModal from "@/components/tree/EditPersonModal";
import { useRouter } from "next/navigation";
import { ReactFlowProvider } from "@xyflow/react";

interface FamilyTreeDashboardProps {
    initialPersons: any[];
    initialRelationships: any[];
    initialTree: any;
}

export default function FamilyTreeDashboard({
    initialPersons,
    initialRelationships,
    initialTree
}: FamilyTreeDashboardProps) {
    const router = useRouter();
    const [persons, setPersons] = useState(initialPersons.filter(p => p.status === 'APPROVED'));
    const [relationships, setRelationships] = useState(initialRelationships.filter(r => r.status === 'APPROVED'));
    const [tree, setTree] = useState(initialTree);
    const [isEditingTreeName, setIsEditingTreeName] = useState(false);
    const [treeName, setTreeName] = useState(initialTree.name);
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        // Handle URL-based person selection (for clicking links inside the modal)
        const checkUrl = () => {
            const params = new URLSearchParams(window.location.search);
            const personId = params.get('id');
            if (personId) {
                setSelectedPersonId(personId);
                setIsEditModalOpen(true);
                // Clean up the URL without reloading to keep a clean state
                const url = new URL(window.location.href);
                url.searchParams.delete('id');
                window.history.replaceState({ modal: "edit" }, '', url);
            }
        };

        checkUrl();
        // Also listen for popstate if person was changed via history
        window.addEventListener('popstate', checkUrl);
        return () => window.removeEventListener('popstate', checkUrl);
    }, []);

    // Sync state with props when they change (critical for SPA navigation/refresh)
    useEffect(() => {
        setPersons(initialPersons.filter(p => p.status === 'APPROVED'));
        setRelationships(initialRelationships.filter(r => r.status === 'APPROVED'));
        setTree(initialTree);
        setTreeName(initialTree.name);
    }, [initialPersons, initialRelationships, initialTree]);

    // Fetch pending requests if admin
    useEffect(() => {
        fetch("/api/admin/requests/count")
            .then(res => res.json())
            .then(data => setPendingCount(data.count))
            .catch(() => { });
    }, []);

    // Sync modal state with browser history
    useEffect(() => {
        if (isEditModalOpen) {
            window.history.pushState({ modal: "edit" }, "");
        }

        const handlePopState = () => {
            setIsEditModalOpen(false);
            setSelectedPersonId(null);
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [isEditModalOpen]);

    const handleRenameTree = async () => {
        try {
            const res = await fetch("/api/tree", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: treeName }),
            });
            if (res.ok) {
                setTree({ ...tree, name: treeName });
                setIsEditingTreeName(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloneTree = async () => {
        if (!confirm("Создать копию этого дерева?")) return;
        try {
            const res = await fetch("/api/tree/clone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ treeId: tree.id }),
            });
            if (res.ok) {
                const newTree = await res.json();
                alert("Дерево успешно скопировано!");
                router.push(`/`); // Redirect to dashboard or the new tree
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleResetLayout = async () => {
        if (!confirm("Сбросить расположение всех карточек и выстроить заново?")) return;
        try {
            await fetch("/api/tree/reset-layout", { method: "POST" });
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleNodeDoubleClick = (id: string) => {
        setSelectedPersonId(id);
        setIsEditModalOpen(true);
    };

    return (
        <ReactFlowProvider>
            <main className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
                {/* Minimal Header */}
                <header className="px-8 py-3 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b dark:border-gray-800 flex justify-between items-center sticky top-0 z-50">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                                G
                            </div>
                            {isEditingTreeName ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-2 py-1 font-bold text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                        value={treeName}
                                        onChange={(e) => setTreeName(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={handleRenameTree} className="text-emerald-500 p-1 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md">
                                        <Check size={16} />
                                    </button>
                                    <button onClick={() => setIsEditingTreeName(false)} className="text-rose-500 p-1 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-md">
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTreeName(true)}>
                                    <span className="text-sm font-black dark:text-white uppercase tracking-tighter">
                                        {tree?.name || "Дерево"}
                                    </span>
                                    <Edit2 size={12} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                            <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full text-gray-500 font-bold">
                                {(persons || []).length} чел.
                            </span>
                        </div>

                        <nav className="flex items-center gap-1">
                            <button onClick={() => window.location.reload()} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 text-xs font-bold">
                                <Plus size={16} className="rotate-45" />
                                Обновить
                            </button>
                            <button onClick={handleCloneTree} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 text-xs font-bold">
                                <Copy size={16} />
                                Копировать
                            </button>
                            <button className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 text-xs font-bold">
                                <Share2 size={16} />
                                Доступ
                            </button>
                            <button onClick={handleResetLayout} className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-2 text-xs font-bold">
                                <Edit2 size={16} />
                                Сетка
                            </button>
                            {pendingCount > 0 && (
                                <Link href="/admin/requests" className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all flex items-center gap-2 text-xs font-bold animate-pulse">
                                    <Bell size={16} />
                                    Одобрение ({pendingCount})
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link
                            href="/persons/new"
                            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Plus size={16} />
                            Добавить персону
                        </Link>
                        <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-2" />
                        <LogoutButton />
                    </div>
                </header>

                {/* Tree Workspace - Full screen focus */}
                <div className="flex-1 relative bg-gray-50/20 dark:bg-gray-950">
                    {persons.length > 0 ? (
                        <FamilyTree
                            key={`tree-v1-${persons.length}`}
                            persons={persons}
                            relationships={relationships}
                            onNodeDoubleClick={handleNodeDoubleClick}
                            onResetLayout={handleResetLayout}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 text-center">
                            <div className="w-24 h-24 bg-indigo-50 dark:bg-indigo-900/20 rounded-[32px] flex items-center justify-center text-indigo-500 mb-8 border-4 border-white dark:border-gray-800 shadow-xl">
                                <Plus size={40} />
                            </div>
                            <h2 className="text-3xl font-black dark:text-white mb-3">Начните историю семьи</h2>
                            <p className="text-gray-400 max-w-sm font-medium mb-10 leading-relaxed">
                                Создайте первую карточку человека, чтобы запустить процесс построения родословной.
                            </p>
                            <Link
                                href="/persons/new"
                                className="px-12 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-lg shadow-2xl shadow-indigo-500/40 hover:-translate-y-1 transition-all"
                            >
                                Создать первую персону
                            </Link>
                        </div>
                    )}
                </div>

                <EditPersonModal
                    personId={selectedPersonId}
                    isOpen={isEditModalOpen}
                    onClose={() => {
                        if (window.history.state?.modal === "edit") {
                            window.history.back();
                        } else {
                            setIsEditModalOpen(false);
                            setSelectedPersonId(null);
                        }
                    }}
                    onSave={() => window.location.reload()}
                />
            </main>
        </ReactFlowProvider>
    );
}
