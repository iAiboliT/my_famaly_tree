"use client";

import { useState, useCallback, useEffect } from "react";
import { X, Save, Trash2, Camera, Plus, Link as LinkIcon, Star, Trash, Edit3, Calendar, User, BookOpen, ImageIcon, Upload, Loader2 } from "lucide-react";

interface EditPersonModalProps {
    personId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
}

export default function EditPersonModal({ personId, isOpen, onClose, onSave }: EditPersonModalProps) {
    const [loading, setLoading] = useState(false);
    const [allPersons, setAllPersons] = useState<any[]>([]);
    const [mode, setMode] = useState<"view" | "edit">("view");
    const [isDragging, setIsDragging] = useState(false);
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
    });

    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [newRel, setNewRel] = useState({ targetId: "", type: "PARENT" });
    const [showRelManager, setShowRelManager] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setMode("view");
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
                            });
                        }
                    });
            }
        }
    }, [isOpen, personId]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/persons/${personId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: formData.firstName,
                    middleName: formData.middleName,
                    lastName: formData.lastName,
                    gender: formData.gender,
                    birthDate: formData.birthDate,
                    deathDate: formData.deathDate,
                    biography: formData.biography,
                    photos: formData.photos,
                    mainPhotoIndex: formData.mainPhotoIndex,
                }),
            });

            if (res.ok) {
                onSave();
                setMode("view");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPhoto = () => {
        if (!newPhotoUrl) return;
        setFormData((prev: any) => ({ ...prev, photos: [...prev.photos, newPhotoUrl] }));
        setNewPhotoUrl("");
    };

    const handleRemovePhoto = (index: number) => {
        setFormData((prev: any) => {
            const newPhotos = prev.photos.filter((_: any, i: number) => i !== index);
            let newMain = prev.mainPhotoIndex;
            if (newMain >= newPhotos.length) newMain = 0;
            return { ...prev, photos: newPhotos, mainPhotoIndex: newMain };
        });
    };

    // Drag and Drop Logic
    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const url = event.target?.result as string;
                        setFormData((prev: any) => ({ ...prev, photos: [...prev.photos, url] }));
                    };
                    reader.readAsDataURL(file);
                }
            });
        } else {
            // Check for URL drag and drop
            const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
            if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
                setFormData((prev: any) => ({ ...prev, photos: [...prev.photos, url] }));
            }
        }
    }, []);

    const handleAddRelationship = async () => {
        const { targetId, type } = newRel;
        if (!targetId) return;

        // Custom Logic: Incest detection
        if (type === 'SPOUSE') {
            const myParents = new Set([
                ...(formData.relationships1 || []).filter((r: any) => r.relationType === 'CHILD' && r.person1Id === personId).map((r: any) => r.person2Id),
                ...(formData.relationships2 || []).filter((r: any) => r.relationType === 'PARENT' && r.person2Id === personId).map((r: any) => r.person1Id)
            ]);

            try {
                const tData = await fetch(`/api/persons/${targetId}`).then(r => r.json());
                const theirParents = new Set([
                    ...(tData.relationships1 || []).filter((r: any) => r.relationType === 'CHILD' && r.person1Id === targetId).map((r: any) => r.person2Id),
                    ...(tData.relationships2 || []).filter((r: any) => r.relationType === 'PARENT' && r.person2Id === targetId).map((r: any) => r.person1Id)
                ]);

                const commonParents = [...myParents].filter(p => theirParents.has(p));
                if (commonParents.length > 0) {
                    if (!confirm("Вы женаты/За мужем на сестре/брате? Одумайтесь, садомиты!!! Продолжить?")) return;
                }
            } catch (e) { console.error(e); }
        }

        try {
            const res = await fetch("/api/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    person1Id: personId,
                    person2Id: targetId,
                    relationType: type,
                }),
            });
            if (res.ok) {
                const data = await fetch(`/api/persons/${personId}`).then(r => r.json());
                setFormData((prev: any) => ({ ...prev, relationships1: data.relationships1, relationships2: data.relationships2 }));
            } else {
                const error = await res.json();
                alert(error.error || "Ошибка");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteRel = async (relId: string) => {
        if (!confirm("Удалить эту связь?")) return;
        try {
            const res = await fetch(`/api/relationships?id=${relId}`, { method: "DELETE" });
            if (res.ok) {
                setFormData((prev: any) => ({
                    ...prev,
                    relationships1: (prev.relationships1 || []).filter((r: any) => r.id !== relId),
                    relationships2: (prev.relationships2 || []).filter((r: any) => r.id !== relId),
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить эту персону? Это действие невозможно отменить. Если вы не владелец дерева, будет создан запрос на удаление.")) return;
        setLoading(true);
        try {
            const res = await fetch(`/api/persons/${personId}`, { method: "DELETE" });
            if (res.ok) {
                onSave();
            } else {
                const data = await res.json();
                alert(data.error || "Ошибка при удалении");
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

    return (
        <div className="fixed inset-0 z-[100] bg-white/95 dark:bg-gray-950/95 backdrop-blur-md animate-in fade-in zoom-in duration-300 flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-8 py-4 border-b dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                        <User size={20} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black dark:text-white leading-tight">
                            {mode === 'view' ? 'Карточка персоны' : 'Редактирование профиля'}
                        </h2>
                        <p className="text-gray-400 text-[10px] uppercase font-bold tracking-widest">
                            {formData.lastName} {formData.firstName}
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {mode === "view" ? (
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/4 border-r dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/10 p-8 space-y-10 overflow-y-auto">
                        <div className="space-y-8 text-center sm:text-left">
                            <h1 className="text-3xl font-black dark:text-white leading-tight">
                                {formData.lastName}<br />
                                <span className="text-indigo-600">{formData.firstName} {formData.middleName}</span>
                            </h1>

                            <div className="grid gap-4">
                                <div className="flex items-center gap-4 p-4 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800">
                                    <Calendar className="text-indigo-500" size={20} />
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-gray-400 uppercase">Даты жизни</div>
                                        <div className="font-bold text-sm dark:text-white">
                                            {formData.birthDate || '?'} — {formData.deathDate || ''}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 text-left">
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 dark:border-gray-800">Связи</h3>
                                <div className="space-y-3">
                                    {[...(formData.relationships1 || []), ...(formData.relationships2 || [])].map((r: any) => {
                                        const isSource = r.person1Id === personId;
                                        const otherPerson = isSource ? r.person2 : r.person1;
                                        if (!otherPerson) return null;
                                        const label = getRelationLabel(r.relationType, otherPerson.gender, !isSource);
                                        return (
                                            <div
                                                key={r.id}
                                                className="group p-3 hover:bg-white dark:hover:bg-gray-800 rounded-xl transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-700 cursor-pointer"
                                                onClick={() => {
                                                    window.history.pushState({ modal: "edit" }, "");
                                                    window.location.search = `?id=${otherPerson.id}`;
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-tighter leading-none mb-1">
                                                            {label}
                                                        </span>
                                                        <span className="font-bold text-xs dark:text-gray-300 group-hover:text-indigo-600 transition-colors">
                                                            {otherPerson.lastName} {otherPerson.firstName} {otherPerson.middleName || ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="pt-6 border-t dark:border-gray-800">
                                    <button
                                        onClick={() => setShowRelManager(!showRelManager)}
                                        className="w-full py-2 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800 text-[10px] font-black uppercase text-gray-400 hover:border-indigo-500 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> {showRelManager ? 'Скрыть управление' : 'Добавить связь'}
                                    </button>

                                    {showRelManager && (
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl space-y-3">
                                            {(() => {
                                                const linkedIds = new Set([
                                                    ...(formData.relationships1 || []).map((r: any) => r.person1Id === personId ? r.person2Id : r.person1Id),
                                                    ...(formData.relationships2 || []).map((r: any) => r.person1Id === personId ? r.person2Id : r.person1Id)
                                                ]);
                                                const availablePersons = allPersons.filter(p => !linkedIds.has(p.id));

                                                return (
                                                    <select
                                                        className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-[10px] font-bold outline-none border dark:border-gray-800 focus:border-indigo-500"
                                                        value={newRel.targetId}
                                                        onChange={e => setNewRel({ ...newRel, targetId: e.target.value })}
                                                    >
                                                        <option value="">Выберите человека...</option>
                                                        {availablePersons.map(p => (
                                                            <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
                                                        ))}
                                                    </select>
                                                );
                                            })()}

                                            <select
                                                className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-[10px] font-bold outline-none border dark:border-gray-800 focus:border-indigo-500"
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
                                                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-black text-[10px] uppercase shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                            >
                                                Подтвердить
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-12">
                        <div className="max-w-5xl mx-auto space-y-16">
                            <div className="flex flex-col lg:flex-row gap-12 items-start">
                                <div className="w-full lg:w-[350px] shrink-0">
                                    <div className="aspect-[3/4] rounded-[48px] overflow-hidden shadow-2xl border-8 border-white dark:border-gray-900">
                                        {mainPhoto ? <img src={mainPhoto} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200"><ImageIcon size={64} /></div>}
                                    </div>
                                </div>
                                <div className="flex-1 space-y-8">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-indigo-600">
                                            <BookOpen size={20} />
                                            <h3 className="text-xl font-black italic">История</h3>
                                        </div>
                                        <div className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                                            {formData.biography || "История не добавлена..."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-1/4 border-r dark:border-gray-800 p-6 space-y-6 overflow-y-auto">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Фамилия</label>
                                <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold" value={formData.lastName} placeholder="Фамилия" onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase">Имя</label>
                                <input className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl font-bold" value={formData.firstName} placeholder="Имя" onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                            </div>

                            <div className="pt-6 space-y-4">
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest border-b pb-2 dark:border-gray-800">Управление связями</h3>

                                <div className="space-y-3">
                                    {(() => {
                                        const linkedIds = new Set([
                                            ...(formData.relationships1 || []).map((r: any) => r.person1Id === personId ? r.person2Id : r.person1Id),
                                            ...(formData.relationships2 || []).map((r: any) => r.person1Id === personId ? r.person2Id : r.person1Id)
                                        ]);
                                        const availablePersons = allPersons.filter(p => !linkedIds.has(p.id));

                                        return (
                                            <select
                                                className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-indigo-500"
                                                value={newRel.targetId}
                                                onChange={e => setNewRel({ ...newRel, targetId: e.target.value })}
                                            >
                                                <option value="">Выберите человека...</option>
                                                {availablePersons.map(p => (
                                                    <option key={p.id} value={p.id}>{p.lastName} {p.firstName}</option>
                                                ))}
                                            </select>
                                        );
                                    })()}

                                    <select
                                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-indigo-500"
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
                                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                                    >
                                        <Plus size={14} /> Добавить связь
                                    </button>
                                </div>

                                <div className="space-y-2 pt-4">
                                    {[...(formData.relationships1 || []), ...(formData.relationships2 || [])].map((r: any) => {
                                        const isSource = r.person1Id === personId;
                                        const otherPerson = isSource ? r.person2 : r.person1;
                                        if (!otherPerson) return null;
                                        const label = getRelationLabel(r.relationType, otherPerson.gender, !isSource);
                                        return (
                                            <div key={r.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg group">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black text-gray-400 uppercase">{label}</span>
                                                    <span className="text-[10px] font-bold dark:text-gray-300 truncate w-32">
                                                        {otherPerson.lastName} {otherPerson.firstName}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteRel(r.id)}
                                                    className="p-1.5 text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <Trash size={14} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex-1 overflow-y-auto p-8 transition-colors duration-200 ${isDragging ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                        <div className="max-w-4xl mx-auto space-y-8">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-black dark:text-white uppercase tracking-wider">Галерея и Драг-н-дроп</h3>
                                <div className="flex gap-2">
                                    <input
                                        className="px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs outline-none w-64"
                                        placeholder="URL фото..."
                                        value={newPhotoUrl}
                                        onChange={e => setNewPhotoUrl(e.target.value)}
                                    />
                                    <button onClick={handleAddPhoto} className="p-2 bg-indigo-600 text-white rounded-xl"><Camera size={18} /></button>
                                </div>
                            </div>

                            <div className="border-4 border-dashed border-gray-100 dark:border-gray-800 rounded-[48px] p-8 text-center group bg-white/50 dark:bg-gray-900/50">
                                <div className="flex flex-wrap gap-4 justify-center">
                                    {formData.photos.length === 0 && (
                                        <div className="py-12 space-y-4">
                                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl mx-auto flex items-center justify-center text-indigo-500">
                                                <Upload size={32} />
                                            </div>
                                            <p className="font-bold text-gray-400">Перетащите сюда фото или вставьте URL</p>
                                        </div>
                                    )}
                                    {formData.photos.map((url: string, idx: number) => (
                                        <div key={idx} className={`relative w-32 h-40 rounded-2xl overflow-hidden group shadow-md border-2 transition-all ${formData.mainPhotoIndex === idx ? 'border-yellow-400 scale-105' : 'border-transparent'}`}>
                                            <img src={url} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
                                                <button onClick={() => setFormData({ ...formData, mainPhotoIndex: idx })} className="p-1.5 bg-yellow-400 text-gray-900 rounded-lg"><Star size={14} fill="currentColor" /></button>
                                                <button onClick={() => handleRemovePhoto(idx)} className="p-1.5 bg-red-500 text-white rounded-lg"><Trash size={14} /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <textarea
                                className="w-full h-64 p-8 bg-gray-50 dark:bg-gray-900 rounded-[48px] border-none outline-none text-lg resize-none font-medium"
                                placeholder="Напишите историю жизни..."
                                value={formData.biography}
                                onChange={e => setFormData({ ...formData, biography: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="px-8 py-3 border-t dark:border-gray-800 flex justify-between items-center bg-white dark:bg-gray-950 shrink-0">
                <button
                    onClick={onClose}
                    className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors uppercase tracking-widest"
                >
                    Закрыть
                </button>
                <div className="flex gap-4">
                    {mode === 'view' ? (
                        <button onClick={() => setMode('edit')} className="px-8 py-2 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-indigo-700 active:scale-95"><Edit3 size={16} /> Изменить</button>
                    ) : (
                        <>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-6 py-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 border border-rose-100 disabled:opacity-50"
                            >
                                <Trash2 size={16} /> Удалить
                            </button>
                            <button onClick={() => handleSubmit()} disabled={loading} className="px-8 py-2 bg-emerald-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-emerald-700 active:scale-95 shadow-lg shadow-emerald-500/20">
                                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Сохранить
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
