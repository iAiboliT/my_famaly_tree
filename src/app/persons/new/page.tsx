"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Camera, Star, Trash, Upload } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function NewPersonPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
    });

    const [newPhotoUrl, setNewPhotoUrl] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            // Add a small random offset so new people don't overlap at 0,0
            const finalData = {
                ...formData,
                positionX: Math.random() * 100,
                positionY: Math.random() * 100,
            };

            const res = await fetch("/api/persons", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(finalData),
            });

            if (res.ok) {
                // Success - hard redirect to home to ensure everything is fresh
                window.location.assign("/?v=" + Date.now());
            } else {
                const errorData = await res.json();
                alert(`Ошибка: ${errorData.error}`);
            }
        } catch (err) {
            console.error(err);
            alert("Произошла ошибка при сохранении");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPhoto = (e: React.MouseEvent) => {
        e.preventDefault();
        const url = newPhotoUrl.trim();
        if (!url) return;

        console.log("Adding photo from URL:", url);
        setFormData((prev: any) => ({
            ...prev,
            photos: [...(prev.photos || []), url]
        }));
        setNewPhotoUrl("");
        alert("Фото добавлено из ссылки!");
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
        if (e.target) e.target.value = ""; // Reset input
    };

    const handleRemovePhoto = (index: number) => {
        setFormData((prev: any) => {
            const newPhotos = prev.photos.filter((_: any, i: number) => i !== index);
            let newMain = prev.mainPhotoIndex;
            if (newMain >= newPhotos.length) newMain = 0;
            return { ...prev, photos: newPhotos, mainPhotoIndex: newMain };
        });
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => setIsDragging(false);

    const onDrop = (e: React.DragEvent) => {
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
    };

    const mainPhoto = formData.photos[formData.mainPhotoIndex] || null;

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-6">
            <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors font-bold text-sm"
                >
                    <ArrowLeft size={16} />
                    Назад к семейному древу
                </Link>

                <div className="bg-white dark:bg-gray-900 rounded-[40px] shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden flex flex-col md:flex-row min-h-[85vh]">
                    {/* Left Column: Info (1/4) */}
                    <div className="w-full md:w-1/4 p-8 border-r dark:border-gray-800 space-y-10 bg-gray-50/30 dark:bg-gray-950/20">
                        <div>
                            <h2 className="text-2xl font-black dark:text-white mb-2 tracking-tight">Новый профиль</h2>
                            <p className="text-gray-500 text-xs font-medium">Введите основные данные человека</p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Фамилия</label>
                                <input
                                    className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl dark:text-white font-bold text-base focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, lastName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Имя</label>
                                <input
                                    required
                                    className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl dark:text-white font-bold text-base focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, firstName: e.target.value }))}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Отчество</label>
                                <input
                                    className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl dark:text-white font-bold text-base focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                                    value={formData.middleName}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, middleName: e.target.value }))}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Рождение</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl dark:text-white font-bold text-xs focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                                        value={formData.birthDate}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, birthDate: e.target.value }))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Смерть</label>
                                    <input
                                        type="date"
                                        className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl dark:text-white font-bold text-xs focus:ring-1 focus:ring-indigo-500 outline-none shadow-sm"
                                        value={formData.deathDate}
                                        onChange={(e) => setFormData((prev: any) => ({ ...prev, deathDate: e.target.value }))}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Пол</label>
                                <div className="flex gap-4">
                                    {['MALE', 'FEMALE'].map((g) => (
                                        <button
                                            key={g}
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setFormData((prev: any) => ({ ...prev, gender: g }));
                                            }}
                                            className={`flex-1 p-3.5 rounded-2xl border-2 transition-all font-bold text-sm ${formData.gender === g
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/10'
                                                : 'bg-white dark:bg-gray-800 border-gray-50 dark:border-gray-700 text-gray-400'
                                                }`}
                                        >
                                            {g === 'MALE' ? 'Мужской' : 'Женский'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Photos & Bio (3/4) */}
                    <div
                        className={`flex-1 flex flex-col transition-colors duration-200 ${isDragging ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                    >
                        <div className="p-8 space-y-10 flex-1 overflow-y-auto">
                            <section className="space-y-8">
                                <header className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Фотогалерея</h3>
                                        <p className="text-gray-400 text-[11px] font-medium">Добавьте снимки для семейного архива</p>
                                    </div>
                                    <div className="flex gap-2">
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
                                            className="px-5 py-3 bg-white dark:bg-gray-800 text-indigo-600 border-2 border-indigo-50 dark:border-gray-700 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm hover:border-indigo-500 transition-all"
                                        >
                                            <Upload size={14} />
                                            С компьютера
                                        </button>
                                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-800 mx-1" />
                                        <input
                                            placeholder="Ссылка..."
                                            className="w-48 p-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-xs focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner"
                                            value={newPhotoUrl}
                                            onChange={(e) => setNewPhotoUrl(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddPhoto}
                                            className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-md hover:bg-indigo-700 transition-all"
                                        >
                                            <Camera size={14} />
                                            По ссылке
                                        </button>
                                    </div>
                                </header>

                                <div className="flex gap-10">
                                    {/* Main Preview */}
                                    <div className="w-[280px] shrink-0">
                                        <div className="aspect-[4/5] bg-gray-50 dark:bg-gray-950 rounded-[32px] border-4 border-dashed border-gray-200 dark:border-gray-800 flex flex-col items-center justify-center relative overflow-hidden group shadow-xl">
                                            {mainPhoto ? (
                                                <img src={mainPhoto} alt="Main" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex flex-col items-center text-gray-300">
                                                    <Camera size={48} className="mb-2 opacity-10" />
                                                    <span className="text-[8px] font-black uppercase tracking-widest opacity-30">Предпросмотр</span>
                                                </div>
                                            )}
                                            {mainPhoto && <div className="absolute top-6 left-6 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">Главное</div>}
                                        </div>
                                    </div>

                                    {/* Thumbnails */}
                                    <div className="flex-1">
                                        <div className="grid grid-cols-5 lg:grid-cols-6 gap-3">
                                            {formData.photos.map((url: string, idx: number) => (
                                                <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-transparent hover:border-indigo-500 transition-all shadow-sm">
                                                    <img src={url} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, mainPhotoIndex: idx })}
                                                            className={`p-1.5 rounded-lg ${formData.mainPhotoIndex === idx ? 'bg-yellow-400 text-gray-900' : 'bg-white/20 text-white'}`}
                                                        >
                                                            <Star size={12} fill={formData.mainPhotoIndex === idx ? "currentColor" : "none"} />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemovePhoto(idx)}
                                                            className="p-1.5 bg-red-500/80 text-white rounded-lg"
                                                        >
                                                            <Trash size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4 pt-10 border-t dark:border-gray-800">
                                <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Биография и история</h3>
                                <textarea
                                    placeholder="Напишите всё, что считаете важным о жизни этого человека..."
                                    className="w-full p-8 bg-gray-50/50 dark:bg-gray-800 border-none rounded-[32px] h-48 dark:text-white font-medium text-sm focus:ring-1 focus:ring-indigo-500 outline-none shadow-inner resize-none"
                                    value={formData.biography}
                                    onChange={(e) => setFormData((prev: any) => ({ ...prev, biography: e.target.value }))}
                                />
                            </section>
                        </div>

                        <div className="p-8 border-t dark:border-gray-800 flex justify-end gap-6 bg-white dark:bg-gray-900">
                            <Link
                                href="/"
                                className="px-8 py-3 text-gray-400 font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                                Отмена
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || !formData.firstName}
                                onClick={handleSubmit}
                                className="px-12 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base flex items-center gap-3 transition-all shadow-xl shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                            >
                                <Save size={20} />
                                {loading ? 'Создание...' : 'Добавить в древо'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
