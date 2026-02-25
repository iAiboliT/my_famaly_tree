"use client";

import { useState, useEffect } from "react";
import { X, Camera, Plus, Link as LinkIcon, Star, Trash, Edit3, Calendar, User, BookOpen, ImageIcon, Upload, FileText, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import StatusModal from "@/components/ui/StatusModal";

interface EditPersonModalProps {
    personId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (updatedPerson?: any) => void;
}

export default function EditPersonModal({ personId, isOpen, onClose, onSave }: EditPersonModalProps) {
    const [loading, setLoading] = useState(false);
    const [allPersons, setAllPersons] = useState<any[]>([]);
    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "error" | "success";
        code?: string;
    }>({ isOpen: false, title: "", message: "", type: "error" });

    const [formData, setFormData] = useState<any>({
        firstName: "",
        middleName: "",
        lastName: "",
        gender: "MALE",
        birthDate: "",
        deathDate: "",
        biography: "",
        photos: [],
        mainPhotoIndex: 0,
        relationships1: [],
        relationships2: [],
        documents: [],
    });

    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [newRel, setNewRel] = useState({ targetId: "", type: "PARENT" });
    const [showRelManager, setShowRelManager] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [mainPhotoOrientation, setMainPhotoOrientation] = useState<"portrait" | "landscape">("portrait");

    const formatDate = (dateStr: string) => {
        if (!dateStr || dateStr === "?") return "?";
        if (!dateStr.includes("-")) return dateStr;
        const [year, month, day] = dateStr.split("-");
        return `${day}.${month}.${year}`;
    };

    useEffect(() => {
        if (formData.photos[formData.mainPhotoIndex]) {
            const img = new Image();
            img.src = formData.photos[formData.mainPhotoIndex];
            img.onload = () => {
                setMainPhotoOrientation(img.width > img.height ? "landscape" : "portrait");
            };
        }
    }, [formData.mainPhotoIndex, formData.photos]);

    useEffect(() => {
        if (isOpen) {
            fetch("/api/persons")
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setAllPersons(data.filter((p: any) => p.id !== personId));
                    }
                })
                .catch(err => console.error(err));

            if (personId) {
                fetch(`/api/persons/${personId}`)
                    .then((res) => res.json())
                    .then((data) => {
                        if (data && !data.error) {
                            setFormData({
                                ...data,
                                firstName: data.firstName || "",
                                middleName: data.middleName || "",
                                lastName: data.lastName || "",
                                birthDate: data.birthDate ? new Date(data.birthDate).toISOString().split("T")[0] : "",
                                deathDate: data.deathDate ? new Date(data.deathDate).toISOString().split("T")[0] : "",
                                biography: data.biography || "",
                                photos: data.photos || [],
                                mainPhotoIndex: data.mainPhotoIndex || 0,
                                relationships1: data.relationships1 || [],
                                relationships2: data.relationships2 || [],
                                documents: data.documents || [],
                            });
                        }
                    });
            }
        }
    }, [isOpen, personId]);

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить эту персону? Это действие невозможно отменить.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/persons/${personId}`, { method: "DELETE" });
            if (res.ok) {
                onSave({ id: personId, deleted: true });
                onClose();
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка удаления",
                    message: data.error || "Неизвестная ошибка",
                    type: "error",
                    code: JSON.stringify(data, null, 2)
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRelationship = async () => {
        if (!newRel.targetId) return;
        setLoading(true);
        try {
            const res = await fetch("/api/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    person1Id: personId,
                    person2Id: newRel.targetId,
                    type: newRel.type
                }),
            });
            if (res.ok) {
                const updatedRes = await fetch(`/api/persons/${personId}`);
                const updatedData = await updatedRes.json();
                setFormData((prev: any) => ({
                    ...prev,
                    relationships1: updatedData.relationships1,
                    relationships2: updatedData.relationships2
                }));
                setNewRel({ targetId: "", type: "PARENT" });
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка создания связи",
                    message: data.error || "Неизвестная ошибка",
                    type: "error",
                    code: JSON.stringify(data, null, 2)
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteRel = async (relId: string) => {
        if (!confirm("Удалить эту связь?")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/relationships?id=${relId}`, { method: "DELETE" });
            if (res.ok) {
                setFormData((prev: any) => ({
                    ...prev,
                    relationships1: prev.relationships1.filter((r: any) => r.id !== relId),
                    relationships2: prev.relationships2.filter((r: any) => r.id !== relId),
                }));
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка удаления связи",
                    message: data.error || "Неизвестная ошибка",
                    type: "error",
                    code: JSON.stringify(data, null, 2)
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getRelationLabel = (type: string, gender: string, inverted: boolean = false) => {
        let actualType = type;
        if (inverted) {
            if (type === 'PARENT') actualType = 'CHILD';
            else if (type === 'CHILD') actualType = 'PARENT';
        }

        const labels: Record<string, any> = {
            PARENT: { MALE: "Отец", FEMALE: "Мать", OTHER: "Родитель" },
            SPOUSE: { MALE: "Муж", FEMALE: "Жена", OTHER: "Супруг(а)" },
            CHILD: { MALE: "Сын", FEMALE: "Дочь", OTHER: "Ребенок" },
            BROTHER: { MALE: "Брат", FEMALE: "Брат", OTHER: "Брат" },
            SISTER: { MALE: "Сестра", FEMALE: "Сестра", OTHER: "Сестра" },
            PUPIL: { MALE: "Воспитанник", FEMALE: "Воспитанница", OTHER: "Воспитанник" },
        };
        return labels[actualType]?.[gender] || actualType;
    };

    if (!isOpen) return null;

    const mainPhoto = formData.photos[formData.mainPhotoIndex] || null;
    const allThumbs = formData.photos.map((url: string, idx: number) => ({ url, idx })).filter((p: any) => p.idx !== formData.mainPhotoIndex);
    const rightThumbsCount = mainPhotoOrientation === "portrait" ? 12 : 10;
    const rightThumbs = allThumbs.slice(0, rightThumbsCount);
    const bottomThumbs = allThumbs.slice(rightThumbsCount);

    return (
        <div className="fixed inset-0 z-[100] bg-transparent backdrop-blur-3xl animate-in fade-in zoom-in duration-300 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-4 border-b border-indigo-100/30 dark:border-gray-800/30 shrink-0 shadow-sm relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                        <User size={20} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black dark:text-white leading-tight">Карточка персоны</h2>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-3 bg-white/50 hover:bg-rose-50 dark:bg-gray-800/50 dark:hover:bg-rose-900/20 text-rose-500 rounded-2xl transition-all border border-indigo-100/50 dark:border-gray-700/50 hover:border-rose-200 shadow-sm active:scale-95">
                        <X size={28} strokeWidth={3} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col xl:flex-row overflow-hidden">
                <div className="w-full xl:w-1/4 border-b xl:border-b-0 xl:border-r border-indigo-100/30 dark:border-gray-800/30 bg-transparent p-6 md:p-8 space-y-6 md:space-y-10 overflow-y-auto xl:shrink-0">
                    <div className="space-y-6 md:space-y-8 text-center xl:text-left">
                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-gray-100 leading-tight">
                            {formData.lastName}<br />
                            {formData.firstName}<br />
                            {formData.middleName}
                        </h1>

                        <div className="grid gap-4">
                            <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-indigo-100/30 dark:border-indigo-100/30">
                                <Calendar className="text-indigo-500" size={24} />
                                <div className="text-left">
                                    <div className="text-[12px] font-black text-gray-400 uppercase">Даты жизни</div>
                                    <div className="font-bold text-lg md:text-xl dark:text-white">
                                        {formatDate(formData.birthDate)} — {formatDate(formData.deathDate) === "?" ? "по н.в." : formatDate(formData.deathDate)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 text-left pt-2 md:pt-4">
                            <h3 className="text-lg md:text-xl font-black text-indigo-600 uppercase tracking-widest border-b border-indigo-100/30 pb-4 dark:border-indigo-100/30 text-center xl:text-left">Связи</h3>
                            <div className="space-y-2">
                                {[...(formData.relationships1 || []), ...(formData.relationships2 || [])].map((r: any) => {
                                    const isSource = r.person1Id === personId;
                                    const otherPerson = isSource ? r.person2 : r.person1;
                                    if (!otherPerson) return null;
                                    const label = getRelationLabel(r.relationType, otherPerson.gender, !isSource);
                                    return (
                                        <div key={r.id} className="flex items-center justify-between p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl group transition-colors">
                                            <div className="flex flex-col">
                                                <span className="text-[12px] md:text-[16px] font-black text-indigo-500 uppercase">{label}</span>
                                                <span className="font-bold text-lg md:text-2xl dark:text-gray-300">
                                                    {otherPerson.lastName} {otherPerson.firstName}
                                                </span>
                                            </div>
                                            <button onClick={() => handleDeleteRel(r.id)} className="p-1.5 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash size={14} />
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={() => setShowRelManager(!showRelManager)}
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-indigo-100 dark:border-gray-800 text-xs font-black uppercase text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={16} /> {showRelManager ? 'Скрыть выбор' : 'Добавить родство'}
                                </button>

                                {showRelManager && (
                                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl space-y-2 border border-indigo-50 dark:border-indigo-900/30">
                                        <select
                                            className="w-full p-2 bg-white dark:bg-gray-900 rounded-lg text-[10px] font-bold outline-none border border-indigo-50 dark:border-gray-800 focus:border-indigo-500"
                                            value={newRel.targetId}
                                            onChange={e => setNewRel({ ...newRel, targetId: e.target.value })}
                                        >
                                            <option value="">Выберите человека...</option>
                                            {allPersons.map(p => (
                                                <option key={p.id} value={p.id}>{p.lastName} {p.firstName} {p.middleName || ''}</option>
                                            ))}
                                        </select>
                                        <select
                                            className="w-full p-2 bg-white dark:bg-gray-900 rounded-lg text-[10px] font-bold outline-none border border-indigo-50 dark:border-gray-800 focus:border-indigo-500"
                                            value={newRel.type}
                                            onChange={e => setNewRel({ ...newRel, type: e.target.value })}
                                        >
                                            <option value="PARENT">Родитель</option>
                                            <option value="SPOUSE">Супруг(а)</option>
                                            <option value="CHILD">Ребенок</option>
                                            <option value="BROTHER">Брат</option>
                                            <option value="SISTER">Сестра</option>
                                            <option value="PUPIL">Воспитанник</option>
                                        </select>
                                        <button
                                            onClick={handleAddRelationship}
                                            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-md active:scale-95 transition-all"
                                        >
                                            Связать
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white/5 dark:bg-gray-950/5">
                    <div className="w-full mx-auto space-y-8 md:space-y-12">
                        {/* 1. Фотогалерея */}
                        <section className="space-y-6">
                            <div className="flex flex-col xl:flex-row gap-6 items-stretch">
                                <div
                                    className={`relative rounded-[32px] md:rounded-[48px] overflow-hidden shadow-2xl border-4 md:border-8 border-white/50 dark:border-gray-950/50 bg-gray-100 dark:bg-gray-900 group cursor-pointer transition-all duration-500
                                        ${mainPhotoOrientation === "portrait" ? "w-full xl:w-[35%] aspect-[2/3]" : "w-full xl:w-[65%] aspect-[3/1]"}
                                        ${!mainPhoto ? "h-32" : ""}`}
                                    onClick={() => mainPhoto && setLightboxIndex(formData.mainPhotoIndex)}
                                >
                                    {mainPhoto ? (
                                        <img src={mainPhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Main" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <ImageIcon size={32} />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className={`grid gap-2 md:gap-3 ${mainPhotoOrientation === "portrait" ? "grid-cols-4 lg:grid-cols-4" : "grid-cols-4 lg:grid-cols-5"}`}>
                                        {rightThumbs.map((p: any) => (
                                            <button
                                                key={p.idx}
                                                onClick={() => setLightboxIndex(p.idx)}
                                                className="aspect-square rounded-2xl md:rounded-3xl overflow-hidden border-2 md:border-4 border-white/20 hover:border-indigo-500 hover:scale-105 transition-all shadow-md group"
                                            >
                                                <img src={p.url} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" alt={`Thumb ${p.idx}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Биография */}
                        <section className="bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-[32px] md:rounded-[48px] border border-white/50 dark:border-gray-800/50 shadow-xl p-6 md:p-10 space-y-4 md:space-y-6">
                            <div className="flex items-center gap-3 text-indigo-600 border-b border-indigo-100/30 pb-4">
                                <BookOpen size={20} className="md:w-6 md:h-6" />
                                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight">Биография</h3>
                            </div>
                            <div className="text-lg md:text-2xl font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                                {formData.biography || "История жизни пока не заполнена..."}
                            </div>
                        </section>

                        {/* 3. Документы */}
                        <section className="space-y-8 pb-12">
                            <div className="flex items-center gap-3 text-indigo-600">
                                <FileText size={24} />
                                <h3 className="text-xl font-black uppercase tracking-tight">Медиа-архив и документы</h3>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {formData.documents?.map((doc: any, idx: number) => (
                                    <a
                                        key={idx}
                                        href={doc.url}
                                        target="_blank"
                                        className="group flex flex-col bg-white/40 dark:bg-gray-800/40 backdrop-blur-md rounded-[32px] border border-white/50 dark:border-gray-700/50 overflow-hidden hover:scale-[1.02] transition-all hover:shadow-2xl hover:border-indigo-500/50"
                                    >
                                        <div className="aspect-square bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-600/30 group-hover:text-indigo-600 transition-colors">
                                            {doc.url?.match(/\.(jpeg|jpg|gif|png|webp)$/i) || doc.url?.startsWith('data:image') ? (
                                                <img src={doc.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <FileText size={48} />
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h4 className="font-bold text-lg dark:text-white truncate leading-tight">{doc.title}</h4>
                                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1 opacity-60">Документ</p>
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </section>

                        {/* 4. Родственные связи (Карточки) */}
                        <section className="space-y-8 pb-12 border-t border-indigo-100/30 pt-10">
                            <div className="flex items-center gap-3 text-indigo-600">
                                <LinkIcon size={24} />
                                <h3 className="text-xl font-black uppercase tracking-tight">Родственники</h3>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {[...(formData.relationships1 || []), ...(formData.relationships2 || [])].map((r: any) => {
                                    const isSource = r.person1Id === personId;
                                    const otherPerson = isSource ? r.person2 : r.person1;
                                    if (!otherPerson) return null;
                                    const label = getRelationLabel(r.relationType, otherPerson.gender, !isSource);
                                    const photo = otherPerson.photos && otherPerson.photos[otherPerson.mainPhotoIndex || 0];

                                    return (
                                        <button
                                            key={r.id}
                                            onClick={() => {
                                                const params = new URLSearchParams(window.location.search);
                                                params.set('id', otherPerson.id);
                                                window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                                                onClose();
                                                setTimeout(() => {
                                                    const event = new CustomEvent('nodeDoubleClick', { detail: { id: otherPerson.id } });
                                                    window.dispatchEvent(event);
                                                }, 50);
                                            }}
                                            className="group flex items-center gap-4 bg-white/40 dark:bg-gray-800/40 backdrop-blur-md p-4 rounded-[32px] border border-white/50 dark:border-gray-700/50 hover:scale-[1.02] transition-all hover:shadow-xl hover:border-indigo-500/50 text-left"
                                        >
                                            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-900 border-2 border-white/50">
                                                {photo ? (
                                                    <img src={photo} className="w-full h-full object-cover" alt={otherPerson.firstName} />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <User size={24} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[16px] font-black text-indigo-500/50 uppercase tracking-tighter leading-none mb-1">
                                                    {label}
                                                </span>
                                                <span className="font-bold text-2xl dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                                                    {otherPerson.lastName} {otherPerson.firstName} {otherPerson.middleName || ''}
                                                </span>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <div className="px-6 md:px-12 py-6 border-t border-indigo-100/30 dark:border-gray-800/30 flex flex-wrap justify-between items-center gap-6 bg-white/60 dark:bg-gray-950/60 backdrop-blur-xl shrink-0 relative z-10">
                <button onClick={onClose} className="flex-1 md:flex-none px-6 md:px-12 py-4 bg-white/80 dark:bg-gray-800/80 text-gray-500 font-black text-sm md:text-lg hover:text-rose-600 rounded-2xl border-2 border-white dark:border-white/10 flex items-center justify-center gap-3 transition-all hover:shadow-lg active:scale-95">
                    <X size={24} className="md:w-7 md:h-7" /> <span className="inline">Закрыть</span>
                </button>
                <div className="flex flex-1 md:flex-none gap-4">
                    <button onClick={handleDelete} className="flex-1 md:flex-none px-6 md:px-12 py-4 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-2xl font-black text-sm md:text-lg flex items-center justify-center gap-3 transition-all border-2 border-rose-100 hover:shadow-lg active:scale-95">
                        <Trash2 size={24} className="md:w-7 md:h-7" /> <span className="inline">Удалить</span>
                    </button>
                    <button
                        onClick={() => {
                            const params = new URLSearchParams(window.location.search);
                            const treeId = params.get('treeId');
                            window.location.href = `/persons/${personId}/edit${treeId ? `?treeId=${treeId}` : ''}`;
                        }}
                        className="flex-[1.5] md:flex-none px-10 md:px-20 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm md:text-lg flex items-center justify-center gap-3 transition-all hover:bg-indigo-700 shadow-xl shadow-indigo-500/30 active:scale-95"
                    >
                        <Edit3 size={24} className="md:w-7 md:h-7" /> Изменить
                    </button>
                </div>
            </div>

            <StatusModal {...statusModal} onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))} />

            {lightboxIndex !== null && (
                <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex flex-col animate-in fade-in duration-300">
                    <div className="flex justify-between items-center p-6 text-white">
                        <span className="font-black italic text-lg opacity-60">Фото {lightboxIndex + 1} / {formData.photos.length}</span>
                        <button onClick={() => setLightboxIndex(null)} className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="flex-1 relative flex items-center justify-center p-12">
                        <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev! > 0 ? prev! - 1 : formData.photos.length - 1); }} className="absolute left-6 w-14 h-14 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center text-white z-10">
                            <ChevronLeft size={32} />
                        </button>
                        <img src={formData.photos[lightboxIndex]} className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in duration-500" alt="Gallery" />
                        <button onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev! < formData.photos.length - 1 ? prev! + 1 : 0); }} className="absolute right-6 w-14 h-14 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center text-white z-10">
                            <ChevronRight size={32} />
                        </button>
                    </div>
                    <div className="p-8 flex gap-4 overflow-x-auto justify-center no-scrollbar">
                        {formData.photos.map((url: string, idx: number) => (
                            <button key={idx} onClick={() => setLightboxIndex(idx)} className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all border-2 ${lightboxIndex === idx ? 'border-white scale-110' : 'border-white/10 opacity-50'}`}>
                                <img src={url} className="w-full h-full object-cover" alt="thumb" />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
