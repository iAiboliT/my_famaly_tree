"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Save, Camera, Star, Trash, Upload, FileText, Plus, X, Trash2, BookOpen } from "lucide-react";
import Link from "next/link";
import StatusModal from "@/components/ui/StatusModal";

export default function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const searchParams = useSearchParams();
    const treeIdFromUrl = searchParams.get('treeId');

    const [statusModal, setStatusModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "error" | "success";
        code?: string;
    }>({ isOpen: false, title: "", message: "", type: "error" });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        documents: [],
    });

    const [newDoc, setNewDoc] = useState({ title: "", url: "" });
    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (id && id !== "new") {
            fetch(`/api/persons/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (data && !data.error) {
                        setFormData({
                            ...data,
                            birthDate: data.birthDate ? new Date(data.birthDate).toLocaleDateString('sv-SE') : "",
                            deathDate: data.deathDate ? new Date(data.deathDate).toLocaleDateString('sv-SE') : "",
                            photos: data.photos || [],
                            documents: data.documents || [],
                            mainPhotoIndex: data.mainPhotoIndex || 0,
                        });
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [id]);

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        if (saving) return;
        setSaving(true);

        try {
            const res = await fetch(`/api/persons/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                const targetUrl = treeIdFromUrl ? `/?treeId=${treeIdFromUrl}&u=${Date.now()}` : `/?u=${Date.now()}`;
                window.location.assign(targetUrl);
            } else {
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка сохранения",
                    message: data.error || "Неизвестная ошибка",
                    type: "error",
                    code: JSON.stringify(data, null, 2)
                });
                setSaving(false);
            }
        } catch (err) {
            console.error("Connection error:", err);
            setStatusModal({
                isOpen: true,
                title: "Ошибка соединения",
                message: "Не удалось связаться с сервером.",
                type: "error"
            });
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Вы уверены, что хотите удалить этот профиль? Это действие нельзя отменить.")) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/persons/${id}`, { method: "DELETE" });
            if (res.ok) {
                const targetUrl = treeIdFromUrl ? `/?treeId=${treeIdFromUrl}&u=${Date.now()}` : `/?u=${Date.now()}`;
                window.location.assign(targetUrl);
            } else {
                const data = await res.json();
                setStatusModal({
                    isOpen: true,
                    title: "Ошибка удаления",
                    message: data.error || "Неизвестная ошибка",
                    type: "error",
                    code: JSON.stringify(data, null, 2)
                });
                setSaving(false);
            }
        } catch (err) {
            console.error(err);
            setStatusModal({
                isOpen: true,
                title: "Ошибка соединения",
                message: "Не удалось выполнить запрос на удаление.",
                type: "error"
            });
            setSaving(false);
        }
    };

    const handleAddPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        const url = newPhotoUrl.trim();
        if (!url) return;
        setFormData((prev: any) => ({
            ...prev,
            photos: [...(prev.photos || []), url]
        }));
        setNewPhotoUrl("");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const url = event.target?.result as string;
                    setFormData((prev: any) => ({
                        ...prev,
                        photos: [...(prev.photos || []), url]
                    }));
                };
                reader.readAsDataURL(file);
            }
        });
        if (e.target) e.target.value = "";
    };

    const handleRemovePhoto = (index: number) => {
        setFormData((prev: any) => {
            const newPhotos = prev.photos.filter((_: any, i: number) => i !== index);
            let newMain = prev.mainPhotoIndex;
            if (newMain >= newPhotos.length) newMain = 0;
            return { ...prev, photos: newPhotos, mainPhotoIndex: newMain };
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 border-8 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="font-black text-2xl uppercase tracking-widest text-indigo-600 animate-pulse">Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    const mainPhoto = formData.photos[formData.mainPhotoIndex] || null;

    return (
        <main className="min-h-screen bg-transparent p-0">
            <div className="w-full flex flex-col gap-0 text-left">
                <div className="px-10 py-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl border-b border-white/50 dark:border-white/10 shadow-sm z-10 flex justify-between items-center">
                    <Link
                        href="/"
                        onClick={(e) => {
                            e.preventDefault();
                            const params = new URLSearchParams(window.location.search);
                            const treeId = params.get('treeId');
                            router.push(treeId ? `/?treeId=${treeId}` : "/trees");
                        }}
                        className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 dark:hover:text-white transition-all font-black text-lg uppercase tracking-widest group"
                    >
                        <div className="w-12 h-12 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            <ArrowLeft size={24} strokeWidth={3} />
                        </div>
                        Вернуться к древу
                    </Link>

                    <button
                        onClick={handleDelete}
                        className="flex items-center gap-3 text-rose-500 hover:text-rose-600 transition-all font-black text-sm uppercase tracking-widest group px-6 py-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100"
                    >
                        <Trash2 size={20} />
                        Удалить профиль
                    </button>
                </div>

                <div className="bg-white/30 dark:bg-gray-900/40 backdrop-blur-2xl overflow-hidden flex flex-col md:flex-row min-h-[calc(100vh-100px)]">
                    <div className="w-full md:w-1/3 p-12 border-r border-white/40 dark:border-white/5 space-y-12 bg-white/20 dark:bg-gray-950/20 shadow-[20px_0_40px_-20px_rgba(0,0,0,0.05)]">
                        <div>
                            <h2 className="text-5xl font-black dark:text-white mb-4 tracking-tighter uppercase">Изменение профиля</h2>
                            <p className="text-gray-500 text-lg font-bold">Обновите сведения о человеке</p>
                        </div>

                        <div className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] px-2">Фамилия</label>
                                <input
                                    className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[24px] text-indigo-950 dark:text-white font-black text-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-sm transition-all placeholder:text-indigo-200 dark:placeholder:text-gray-600"
                                    value={formData.lastName}
                                    placeholder="Введите фамилию..."
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, lastName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] px-2">Имя</label>
                                <input
                                    required
                                    className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[24px] text-indigo-950 dark:text-white font-black text-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-sm transition-all placeholder:text-indigo-200 dark:placeholder:text-gray-600"
                                    value={formData.firstName}
                                    placeholder="Введите имя..."
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, firstName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] px-2">Отчество</label>
                                <input
                                    className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[24px] text-indigo-950 dark:text-white font-black text-2xl focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-sm transition-all placeholder:text-indigo-200 dark:placeholder:text-gray-600"
                                    value={formData.middleName}
                                    placeholder="Введите отчество..."
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, middleName: e.target.value }))}
                                />
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] px-2">Рождение</label>
                                    <input
                                        type="date"
                                        className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[24px] dark:text-white font-black text-xl focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-sm transition-all"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, birthDate: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] px-2">Смерть</label>
                                    <input
                                        type="date"
                                        className="w-full p-6 bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-[24px] dark:text-white font-black text-xl focus:ring-4 focus:ring-indigo-500/20 outline-none shadow-sm transition-all"
                                        value={formData.deathDate}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, deathDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="space-y-4">
                                    <label className="text-sm font-black text-indigo-600 uppercase tracking-[0.3em] px-2">Пол</label>
                                    <div className="flex gap-6">
                                        {['MALE', 'FEMALE'].map((g) => (
                                            <button
                                                key={g}
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    setFormData((prev: any) => ({ ...prev, gender: g }));
                                                }}
                                                className={`flex-1 py-5 rounded-[24px] border-4 transition-all font-black text-xl uppercase tracking-widest ${formData.gender === g
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-500/40'
                                                    : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 text-gray-400 hover:border-indigo-200'
                                                    }`}
                                            >
                                                {g === 'MALE' ? 'Мужской' : 'Женский'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`flex-1 flex flex-col transition-colors duration-200 ${isDragging ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
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
                                const url = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('text/uri-list');
                                if (url && (url.startsWith('http') || url.startsWith('data:image'))) {
                                    setFormData((prev: any) => ({ ...prev, photos: [...prev.photos, url] }));
                                }
                            }
                        }}
                    >
                        <div className="p-12 space-y-16 flex-1 overflow-y-auto">
                            <section className="space-y-10">
                                <header className="flex flex-col xl:flex-row justify-between items-center gap-8 bg-white/40 dark:bg-gray-800/40 p-8 rounded-[40px] border border-white/60 dark:border-white/10 shadow-xl shadow-indigo-500/5">
                                    <div className="flex items-center gap-3 text-indigo-600">
                                        <Camera size={24} />
                                        <h3 className="text-xl font-black uppercase tracking-tight">Фотоархив и Галерея</h3>
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileUpload}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); fileInputRef.current?.click(); }}
                                            className="px-8 py-5 bg-white dark:bg-gray-800 text-indigo-600 border-2 border-indigo-50 dark:border-gray-700 rounded-[20px] font-black text-sm uppercase flex items-center gap-3 shadow-lg hover:border-indigo-500 transition-all active:scale-95 whitespace-nowrap"
                                        >
                                            <Upload size={20} />
                                            С компьютера
                                        </button>
                                        <div className="hidden xl:block w-px h-12 bg-gray-100 dark:bg-gray-800 mx-2" />
                                        <input
                                            placeholder="Вставьте ссылку на фото..."
                                            className="min-w-[300px] p-5 bg-gray-100 dark:bg-gray-800 border-2 border-transparent focus:border-indigo-500 rounded-[20px] text-base font-bold outline-none shadow-inner"
                                            value={newPhotoUrl}
                                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddPhoto}
                                            className="px-8 py-5 bg-indigo-600 text-white rounded-[20px] font-black text-sm uppercase flex items-center gap-3 shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
                                        >
                                            <Camera size={20} />
                                            Добавить
                                        </button>
                                    </div>
                                </header>

                                <div className="flex flex-col xl:flex-row gap-12">
                                    <div className="w-full xl:w-[450px] shrink-0">
                                        <div className="aspect-[4/3] xl:aspect-[4/5] bg-gray-100 dark:bg-gray-950 rounded-[48px] border-8 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center relative overflow-hidden group shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)]">
                                            {mainPhoto ? (
                                                <img src={mainPhoto} alt="Main" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-300">
                                                    <Camera size={80} className="mb-4 opacity-10" />
                                                    <span className="text-sm font-black uppercase tracking-[0.4em] opacity-30">Основное фото</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 bg-gray-50/50 dark:bg-gray-950/30 rounded-[48px] p-8 border-4 border-dashed border-gray-100 dark:border-gray-800/50 min-h-[400px]">
                                        {formData.photos.length <= 1 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-4">
                                                <Plus size={48} className="opacity-20" />
                                                <p className="font-bold text-lg opacity-40 uppercase tracking-widest text-center">Перетащите сюда<br />фотографии для галереи</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 text-left">
                                                {formData.photos.map((url: string, idx: number) => {
                                                    if (idx === formData.mainPhotoIndex) return null;
                                                    return (
                                                        <div key={idx} className="relative aspect-square rounded-[32px] overflow-hidden group shadow-lg border-4 border-white dark:border-gray-800 hover:border-indigo-500 transition-all">
                                                            <img src={url} className="w-full h-full object-cover" alt={`Thumb ${idx}`} />
                                                            <div className="absolute inset-0 bg-indigo-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, mainPhotoIndex: idx })}
                                                                    className="p-3 bg-white text-indigo-600 rounded-2xl hover:scale-110 transition-transform"
                                                                    title="Сделать главным"
                                                                >
                                                                    <Star size={20} fill="currentColor" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemovePhoto(idx)}
                                                                    className="p-3 bg-rose-500 text-white rounded-2xl hover:scale-110 transition-transform"
                                                                >
                                                                    <Trash size={20} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6 pt-12 border-t border-indigo-100/40 dark:border-white/5">
                                <div className="flex items-center gap-3 text-indigo-600 mb-2">
                                    <BookOpen size={24} className="shrink-0" />
                                    <h3 className="text-xl font-black uppercase tracking-tight">Жизнеописание и воспоминания</h3>
                                </div>
                                <textarea
                                    placeholder="Напишите здесь историю жизни этого человека..."
                                    className="w-full p-10 bg-white/50 dark:bg-gray-800 border border-white dark:border-white/10 rounded-[48px] h-64 dark:text-white font-bold text-2xl leading-relaxed focus:ring-8 focus:ring-indigo-500/10 outline-none shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] resize-none mb-8 transition-all"
                                    value={formData.biography}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, biography: e.target.value }))}
                                />
                            </section>

                            <section className="space-y-8 pt-12 border-t border-indigo-100/40 dark:border-white/5">
                                <div className="flex items-center gap-3 text-indigo-600">
                                    <Plus size={24} />
                                    <h3 className="text-xl font-black uppercase tracking-tight">Медиа-архив (Документы)</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        className="p-4 bg-gray-50/50 dark:bg-gray-800 border-none rounded-2xl text-sm font-bold outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
                                        placeholder="Название документа"
                                        value={newDoc.title}
                                        onChange={e => setNewDoc({ ...newDoc, title: e.target.value })}
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="file"
                                            id="doc-upload-edit"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;
                                                const reader = new FileReader();
                                                reader.onload = (ev) => {
                                                    const url = ev.target?.result as string;
                                                    setFormData((prev: any) => ({
                                                        ...prev,
                                                        documents: [...(prev.documents || []), { title: newDoc.title || file.name, url, type: "Документ" }]
                                                    }));
                                                    setNewDoc({ title: "", url: "" });
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                        <label
                                            htmlFor="doc-upload-edit"
                                            className="px-8 py-5 bg-indigo-600 text-white rounded-[20px] font-black text-sm uppercase flex items-center gap-3 shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                                        >
                                            <Upload size={20} />
                                            Выбрать файл
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(formData.documents || []).map((doc: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-white/40 dark:bg-gray-800/40 rounded-2xl border border-indigo-50/50 group">
                                            <div className="flex items-center gap-4 truncate">
                                                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="flex flex-col truncate text-left">
                                                    <span className="font-bold text-sm truncate dark:text-white mb-0.5">{doc.title}</span>
                                                    <span className="text-[10px] text-gray-400 uppercase font-black">Документ</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData((prev: any) => ({ ...prev, documents: prev.documents.filter((_: any, i: number) => i !== idx) }))}
                                                className="p-2 text-gray-400 hover:text-rose-500 transition-colors"
                                            >
                                                <Trash size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="p-10 border-t border-white/50 dark:border-white/10 flex justify-end gap-8 bg-white/60 dark:bg-gray-900/80 sticky bottom-0 backdrop-blur-3xl shadow-[0_-20px_50px_rgba(0,0,0,0.05)]">
                            <button
                                onClick={() => router.back()}
                                className="px-12 py-5 bg-white/50 dark:bg-gray-800/50 text-gray-400 font-black text-sm uppercase hover:text-rose-500 rounded-[24px] border border-white dark:border-white/10 shadow-lg flex items-center gap-3 transition-all active:scale-95"
                            >
                                <X size={20} strokeWidth={3} />
                                Отмена
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={saving || !formData.firstName}
                                className="px-16 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center gap-4 transition-all shadow-[0_20px_40px_-5px_rgba(79,70,229,0.4)] hover:shadow-[0_25px_60px_-5px_rgba(79,70,229,0.5)] active:scale-95 disabled:opacity-50 ring-4 ring-indigo-500/10"
                            >
                                {saving ? <Plus className="animate-spin" size={24} /> : <Save size={24} />}
                                {saving ? 'Сохранение...' : 'Сохранить изменения'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <StatusModal
                {...statusModal}
                onClose={() => setStatusModal(prev => ({ ...prev, isOpen: false }))}
            />
        </main>
    );
}
