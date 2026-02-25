"use client";

import { useState, useEffect } from "react";
import { Plus, Copy, Share2, Edit2, Check, X, Bell, ChevronLeft, RefreshCw, LayoutGrid, Printer, FileDown, Trash2 } from "lucide-react";
import Link from "next/link";
import LogoutButton from "@/components/auth/LogoutButton";
import FamilyTree from "@/components/tree/FamilyTree";
import { ReactFlowProvider, useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import StatusModal from "@/components/ui/StatusModal";

const EditPersonModal = dynamic(() => import("@/components/tree/EditPersonModal"), { ssr: false });
const TreeAccessModal = dynamic(() => import("@/components/tree/TreeAccessModal"), { ssr: false });

interface FamilyTreeDashboardProps {
    initialPersons: any[];
    initialRelationships: any[];
    initialTree: any;
}

function FamilyTreeDashboardContent({
    initialPersons,
    initialRelationships,
    initialTree
}: FamilyTreeDashboardProps) {
    const router = useRouter();
    const { getNodes, fitView } = useReactFlow();

    const [persons, setPersons] = useState(initialPersons.filter((p: any) => p.status === 'APPROVED'));
    const [relationships, setRelationships] = useState(initialRelationships.filter((r: any) => r.status === 'APPROVED'));
    const [tree, setTree] = useState(initialTree);
    const [isEditingTreeName, setIsEditingTreeName] = useState(false);
    const [treeName, setTreeName] = useState(initialTree.name);
    const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [isExporting, setIsExporting] = useState(false);
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "error" | "success" | "info";
        code?: string;
    }>({ isOpen: false, title: "", message: "", type: "info" });

    useEffect(() => {
        setPersons(initialPersons.filter((p: any) => p.status === 'APPROVED'));
        setRelationships(initialRelationships.filter((r: any) => r.status === 'APPROVED'));
        setTree(initialTree);
        setTreeName(initialTree.name);
    }, [initialPersons, initialRelationships, initialTree]);

    useEffect(() => {
        // Parallel fetch for minor metadata
        Promise.all([
            fetch("/api/admin/requests/count").then(res => res.json()).catch(() => ({ count: 0 })),
        ]).then(([countData]) => {
            setPendingCount(countData.count);
        });
    }, []);

    const handleExportPDF = async () => {
        if (getNodes().length === 0) return;
        setIsExporting(true);

        try {
            // Сначала вписываем всё дерево в экран
            await fitView({ padding: 0.1 });
            // Даем время на рендер и стабилизацию
            await new Promise(resolve => setTimeout(resolve, 600));

            // Ищем контейнер с графом
            const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
            if (!viewportElement) {
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка экспорта",
                    message: "Область дерева не найдена",
                    type: "error"
                });
                return;
            }

            // Рендерим в PNG
            const dataUrl = await toPng(viewportElement, {
                backgroundColor: '#ffffff', // Белый фон для печати
                quality: 1,
                pixelRatio: 3, // Еще более высокое разрешение
            });

            // Создаем PDF
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [viewportElement.offsetWidth, viewportElement.offsetHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, viewportElement.offsetWidth, viewportElement.offsetHeight);
            pdf.save(`${tree.name || 'family-tree'}.pdf`);

        } catch (err) {
            console.error('PDF Export Error:', err);
            setStatusModal({
                isOpen: true,
                title: "Ошибка PDF",
                message: "Не удалось создать PDF файл. Попробуйте обновить страницу.",
                type: "error"
            });
        } finally {
            setIsExporting(false);
        }
    };

    const handleRenameTree = async () => {
        if (!tree?.id) return;
        try {
            const res = await fetch(`/api/tree?treeId=${tree.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: treeName }),
            });
            if (res.ok) {
                setTree({ ...tree, name: treeName });
                setIsEditingTreeName(false);
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка переименования",
                    message: data.error || "Не удалось сохранить новое название",
                    type: "error"
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCloneTree = async () => {
        // We'll keep confirm for destructive/large actions for now, 
        // but let's replace alert after success
        if (!confirm("Создать копию этого дерева?")) return;
        try {
            const res = await fetch("/api/tree/clone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ treeId: tree.id }),
            });
            if (res.ok) {
                const newTree = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Успех",
                    message: "Дерево успешно скопировано!",
                    type: "success"
                });
                setTimeout(() => router.push(`/?treeId=${newTree.id}`), 1500);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleNodeDoubleClick = useCallback((id: string) => {
        setSelectedPersonId(id);
        setIsEditModalOpen(true);
    }, []);

    const handleResetLayout = async () => {
        if (!confirm("Сбросить расположение всех карточек и выстроить заново?")) return;
        try {
            await fetch("/api/tree/reset-layout", { method: "POST" });
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const handleTreeDelete = async () => {
        if (!confirm("ВНИМАНИЕ! Вы уверены, что хотите полностью удалить это дерево и всех его участников? Это действие необратимо.")) return;

        try {
            const res = await fetch(`/api/tree?treeId=${tree.id}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setStatusModal({
                    isOpen: true,
                    title: "Дерево удалено",
                    message: "Дерево успешно удалено. Возвращаемся в список...",
                    type: "success"
                });
                setTimeout(() => router.push("/trees"), 1500);
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка",
                    message: data.error || "Не удалось удалить дерево",
                    type: "error"
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <main className="min-h-screen bg-transparent flex flex-col">
            <header className="px-8 py-4 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md border-b border-indigo-200/40 dark:border-gray-700/40 flex justify-between items-center sticky top-0 z-50 mt-6 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
                    <Link
                        href="/trees"
                        className="p-3 md:px-6 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 group shrink-0"
                        title="К списку деревьев"
                    >
                        <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="hidden xs:inline">К деревьям</span>
                    </Link>

                    <div className="flex items-center gap-2 md:gap-3 pr-2 md:pr-4 border-r dark:border-gray-800 max-w-[150px] md:max-w-none">
                        {isEditingTreeName ? (
                            <div className="flex items-center gap-2">
                                <input
                                    className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg px-2 py-1 font-bold text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                    value={treeName}
                                    onChange={(e) => setTreeName(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleRenameTree()}
                                />
                                <button onClick={handleRenameTree} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded-md"><Check size={16} /></button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingTreeName(true)}>
                                <span className="text-base font-black dark:text-white uppercase tracking-tighter">
                                    {tree?.name || "Дерево"}
                                </span>
                                <Edit2 size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        )}
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-gray-500 font-bold whitespace-nowrap">
                            {persons?.length || 0} чел.
                        </span>
                    </div>

                    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar md:overflow-visible pb-1 md:pb-0">
                        <button onClick={() => window.location.reload()} className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-colors whitespace-nowrap">
                            <RefreshCw size={18} className="md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Обновить</span>
                        </button>
                        <button onClick={handleCloneTree} className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-colors whitespace-nowrap">
                            <Copy size={18} className="md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Копировать</span>
                        </button>
                        <button onClick={() => setIsAccessModalOpen(true)} className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-colors whitespace-nowrap">
                            <Share2 size={18} className="md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Доступ</span>
                        </button>
                        <button onClick={handleResetLayout} className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-colors whitespace-nowrap">
                            <LayoutGrid size={18} className="md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Сетка</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            disabled={isExporting}
                            className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                            {isExporting ? <RefreshCw size={18} className="animate-spin md:w-5 md:h-5" /> : <Printer size={18} className="md:w-5 md:h-5" />}
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <a
                            href={`/api/tree/export-gedcom?treeId=${tree.id}`}
                            download
                            className="p-2 md:p-3 text-gray-500 hover:text-indigo-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-colors whitespace-nowrap"
                        >
                            <FileDown size={18} className="md:w-5 md:h-5" />
                            <span className="hidden sm:inline">GEDCOM</span>
                        </a>
                        <button
                            onClick={handleTreeDelete}
                            className="p-2 md:p-3 text-rose-300 hover:text-rose-600 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight transition-all whitespace-nowrap"
                        >
                            <Trash2 size={18} className="md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Удалить</span>
                        </button>
                        {pendingCount > 0 && (
                            <Link href="/admin/requests" className="p-2 md:p-3 text-rose-500 flex items-center gap-2 text-[10px] md:text-xs font-black uppercase tracking-tight animate-pulse whitespace-nowrap">
                                <Bell size={18} className="md:w-5 md:h-5" />
                                <span className="hidden sm:inline">Запросы ({pendingCount})</span>
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:gap-4 ml-auto md:ml-0">
                    <Link
                        href={`/persons/new?treeId=${tree.id}`}
                        className="p-3 md:px-6 md:py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                    >
                        <Plus size={16} />
                        <span className="hidden md:inline">Добавить персону</span>
                        <span className="md:hidden xs:inline">Добавить</span>
                    </Link>
                    <div className="hidden sm:block w-px h-6 bg-gray-100 dark:bg-gray-800 mx-1" />
                    <LogoutButton />
                </div>
            </header>

            <div className="flex-1 relative">
                <FamilyTree
                    persons={persons}
                    relationships={relationships}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    onResetLayout={handleResetLayout}
                />
            </div>

            <EditPersonModal
                personId={selectedPersonId}
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedPersonId(null);
                }}
                onSave={(data) => {
                    if (data?.deleted) {
                        setPersons(prev => prev.filter(p => p.id !== data.id));
                    } else if (data) {
                        setPersons(prev => prev.map(p => p.id === data.id ? data : p));
                    }
                    router.refresh();
                }}
            />
            <TreeAccessModal
                isOpen={isAccessModalOpen}
                onClose={() => setIsAccessModalOpen(false)}
                treeId={tree.id}
            />
            <StatusModal
                {...statusModal}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
            />
        </main>
    );
}

export default function FamilyTreeDashboardNEW(props: FamilyTreeDashboardProps) {
    return (
        <ReactFlowProvider>
            <FamilyTreeDashboardContent {...props} />
        </ReactFlowProvider>
    );
}
