"use client";

import { useState, useEffect } from "react";
import { TreePine, Users, Plus, ChevronRight, Share2, Shield, Search, Loader2, Mail, FileUp, X, Check } from "lucide-react";
import StatusModal from "@/components/ui/StatusModal";
import { useRouter } from "next/navigation";
import LogoutButton from "@/components/auth/LogoutButton";

export default function TreesPage() {
    const [ownedTrees, setOwnedTrees] = useState<any[]>([]);
    const [sharedTrees, setSharedTrees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "error" | "success";
    }>({ isOpen: false, title: "", message: "", type: "error" });
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newTreeName, setNewTreeName] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchTrees();
    }, []);

    const fetchTrees = () => {
        fetch("/api/tree")
            .then(res => res.json())
            .then(data => {
                setOwnedTrees(data.owned || []);
                setSharedTrees(data.shared || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const handleCreateTree = async () => {
        if (!newTreeName.trim()) return;

        setCreating(true);
        try {
            const res = await fetch("/api/tree", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTreeName }),
            });
            if (res.ok) {
                const newTree = await res.json();
                setIsCreateModalOpen(false);
                router.push(`/?treeId=${newTree.id}`);
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка создания",
                    message: data.error || "Не удалось создать дерево",
                    type: "error"
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setCreating(false);
        }
    };

    const handleSearch = async () => {
        if (searchQuery.length < 3) return;
        setSearching(true);
        try {
            const res = await fetch("/api/tree/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: searchQuery }),
            });
            const data = await res.json();
            setSearchResults(data.trees || []);
        } catch (err) {
            console.error(err);
        } finally {
            setSearching(false);
        }
    };

    const handleRequestAccess = async (treeId: string) => {
        try {
            const res = await fetch("/api/tree/request-access", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ treeId }),
            });
            const data = await res.json();
            setStatusModal({
                isOpen: true,
                title: "Запрос доступа",
                message: data.message || "Запрос успешно отправлен владельцу дерева!",
                type: res.ok ? "success" : "error"
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleImportGEDCOM = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            const gedcomData = event.target?.result as string;
            const treeName = file.name.replace('.ged', '');

            setCreating(true);
            try {
                const res = await fetch("/api/tree/import-gedcom", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gedcomData, treeName }),
                });
                if (res.ok) {
                    const data = await res.json();
                    router.push(`/?treeId=${data.treeId}`);
                } else {
                    const data = await res.json();
                    setStatusModal({
                        isOpen: true,
                        title: "Ошибка импорта",
                        message: data.error || "Не удалось импортировать файл GEDCOM",
                        type: "error"
                    });
                }
            } catch (err) {
                console.error(err);
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка соединения",
                    message: "Не удалось связаться с сервером",
                    type: "error"
                });
            } finally {
                setCreating(false);
            }
        };
        reader.readAsText(file);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="animate-spin text-indigo-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col">
            <header className="px-8 py-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b dark:border-gray-800 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
                        G
                    </div>
                    <h1 className="text-xl font-black dark:text-white uppercase tracking-tighter">Мои Деревья</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <input
                            type="file"
                            id="gedcom-import"
                            className="hidden"
                            accept=".ged"
                            onChange={handleImportGEDCOM}
                        />
                        <label
                            htmlFor="gedcom-import"
                            className="px-6 py-2 bg-white/40 dark:bg-gray-800/40 border border-indigo-200/50 dark:border-gray-700/50 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold text-sm cursor-pointer hover:bg-white/60 dark:hover:bg-gray-800/60 transition-all flex items-center gap-2"
                        >
                            <FileUp size={18} />
                            Импорт GEDCOM
                        </label>
                    </div>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        disabled={creating}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {creating ? <Loader2 className="animate-spin" size={16} /> : <Plus size={18} />}
                        Создать дерево
                    </button>
                    <div className="w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1" />
                    <LogoutButton />
                </div>
            </header>

            <main className="flex-1 max-w-6xl mx-auto w-full p-8 space-y-12">
                {/* Owned Trees */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <Shield size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">Ваши деревья</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ownedTrees.map(tree => (
                            <div
                                key={tree.id}
                                onClick={() => router.push(`/?treeId=${tree.id}`)}
                                className="group bg-white/60 dark:bg-gray-900/60 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-indigo-500/30 transition-all cursor-pointer relative overflow-hidden backdrop-blur-sm"
                            >
                                <div className="absolute -bottom-2 -right-2 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <TreePine size={80} className="text-indigo-600" />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black dark:text-white group-hover:text-indigo-600 transition-colors uppercase leading-tight truncate">
                                            {tree.name}
                                        </h3>
                                        <p className="text-xs font-bold text-gray-400">
                                            Создано {new Date(tree.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                            <Users size={14} />
                                            {tree._count.persons} чел.
                                        </div>
                                    </div>
                                    <div className="pt-2 flex items-center text-indigo-600 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        Открыть <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {ownedTrees.length === 0 && (
                            <div className="col-span-full py-20 bg-white/50 dark:bg-gray-900/50 rounded-[48px] border-4 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400">
                                    <Plus size={32} />
                                </div>
                                <p className="text-gray-400 font-bold max-w-xs">У вас пока нет созданных деревьев. Нажмите кнопку выше, чтобы начать.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Shared Trees */}
                <section className="space-y-6">
                    <div className="flex items-center gap-3 text-emerald-600">
                        <Share2 size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">Доступные вам</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sharedTrees.map(tree => (
                            <div
                                key={tree.id}
                                onClick={() => router.push(`/?treeId=${tree.id}`)}
                                className="group bg-white/60 dark:bg-gray-900/60 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all cursor-pointer relative overflow-hidden backdrop-blur-sm"
                            >
                                <div className="absolute -bottom-2 -right-2 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Users size={80} className="text-emerald-600" />
                                </div>
                                <div className="space-y-4 relative z-10">
                                    <div className="space-y-1">
                                        <h3 className="text-lg font-black dark:text-white group-hover:text-emerald-600 transition-colors uppercase leading-tight truncate">
                                            {tree.name}
                                        </h3>
                                        <p className="text-xs font-bold text-gray-400">
                                            {tree.canEdit ? "Доступ на редактирование" : "Только просмотр"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 text-xs font-black text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                            <Users size={14} />
                                            {tree._count.persons} чел.
                                        </div>
                                    </div>
                                    <div className="pt-2 flex items-center text-emerald-600 text-[10px] font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                                        Открыть <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>
                        ))}

                        {sharedTrees.length === 0 && (
                            <div className="col-span-full py-12 bg-white/50 dark:bg-gray-900/50 rounded-[48px] border-4 border-dashed border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center text-center space-y-4">
                                <Share2 size={32} className="text-gray-200" />
                                <p className="text-gray-400 font-bold max-w-xs">У вас нет деревьев, которыми с вами поделились.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Find Trees (Public) */}
                <section className="space-y-6 pt-12 border-t dark:border-gray-800">
                    <div className="flex items-center gap-3 text-gray-400">
                        <Search size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight">Найти дерево</h2>
                    </div>
                    <div className="max-w-xl bg-white dark:bg-gray-900 p-8 rounded-[40px] shadow-sm border border-gray-100 dark:border-gray-800 space-y-6">
                        <p className="text-sm text-gray-500 font-medium leading-relaxed">
                            Введите название дерева или email его владельца, чтобы запросить доступ.
                        </p>
                        <div className="flex gap-4">
                            <input
                                className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold dark:text-white"
                                placeholder="Название или email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button
                                onClick={handleSearch}
                                disabled={searching || searchQuery.length < 3}
                                className="px-8 py-4 bg-gray-900 dark:bg-white dark:text-black text-white rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all disabled:opacity-50"
                            >
                                {searching ? <Loader2 className="animate-spin" size={16} /> : "Найти"}
                            </button>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="space-y-3 pt-4">
                                {searchResults.map(tree => (
                                    <div key={tree.id} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-[24px] flex items-center justify-between group">
                                        <div className="flex items-center gap-4 truncate">
                                            <div className="w-10 h-10 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center text-indigo-500 shadow-sm shrink-0">
                                                <TreePine size={20} />
                                            </div>
                                            <div className="truncate">
                                                <h4 className="font-bold text-sm dark:text-white uppercase truncate">{tree.name}</h4>
                                                <p className="text-[10px] text-gray-400 flex items-center gap-1 font-bold truncate">
                                                    <Mail size={10} /> {tree.owner.email}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRequestAccess(tree.id)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-all shadow-md active:scale-95 shrink-0"
                                        >
                                            Запросить
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {searchQuery.length >= 3 && searchResults.length === 0 && !searching && (
                            <p className="text-center text-xs text-gray-400 font-bold py-4">Ничего не найдено</p>
                        )}
                    </div>
                </section>
            </main>

            {/* Create Tree Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-950 rounded-[32px] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] w-full max-w-md overflow-hidden flex flex-col border border-white/20 dark:border-white/5 animate-in zoom-in duration-300">
                        <div className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black dark:text-white uppercase tracking-tighter">Новое дерево</h3>
                                <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                                    <X size={20} className="text-gray-400" />
                                </button>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-indigo-600 uppercase tracking-widest px-1">Название дерева</label>
                                <input
                                    autoFocus
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold transition-all dark:text-white"
                                    placeholder="Напр: Семья Ивановых"
                                    value={newTreeName}
                                    onChange={(e) => setNewTreeName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTree()}
                                />
                            </div>
                        </div>
                        <div className="p-8 bg-gray-50 dark:bg-gray-900/50 flex gap-4">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 py-4 bg-white dark:bg-gray-800 text-gray-500 font-bold rounded-2xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 transition-all"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleCreateTree}
                                disabled={creating || !newTreeName.trim()}
                                className="flex-1 py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                            >
                                {creating ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <StatusModal {...statusModal} onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
}
