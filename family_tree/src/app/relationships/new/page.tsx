"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Link as LinkIcon } from "lucide-react";
import Link from "next/link";

export default function NewRelationshipPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [persons, setPersons] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        person1Id: "",
        person2Id: "",
        relationType: "PARENT",
    });

    useEffect(() => {
        fetch("/api/persons")
            .then((res) => res.json())
            .then((data) => {
                if (Array.isArray(data)) setPersons(data);
            });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.person1Id === formData.person2Id) {
            alert("Нельзя связать человека с самим собой");
            return;
        }
        setLoading(true);

        try {
            const res = await fetch("/api/relationships", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push("/");
                router.refresh();
            } else {
                const data = await res.json();
                alert(data.error || "Ошибка");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-2xl mx-auto">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft size={18} />
                    Назад к дереву
                </Link>

                <div className="bg-white dark:bg-gray-800 p-10 rounded-[40px] shadow-2xl border border-white/20 dark:border-gray-700/50">
                    <div className="mb-10 text-center">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                            <LinkIcon size={32} />
                        </div>
                        <h2 className="text-3xl font-black dark:text-white mb-2 tracking-tight">Создать связь</h2>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">Объедините родственников в одну историю</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1 block text-center">Персона 1</label>
                                <select
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 border-none rounded-2xl dark:text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-center cursor-pointer"
                                    value={formData.person1Id}
                                    onChange={(e) => setFormData({ ...formData, person1Id: e.target.value })}
                                >
                                    <option value="">Выберите человека...</option>
                                    {persons.map(p => (
                                        <option key={p.id} value={p.id}>{p.lastName} {p.firstName} {p.middleName || ""}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4 pt-4 border-y border-gray-100 dark:border-gray-700 py-8">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] block text-center">является</label>
                                <div className="flex justify-center flex-wrap gap-4">
                                    {[
                                        { value: 'PARENT', label: 'Родителем для' },
                                        { value: 'SPOUSE', label: 'Супругом(ой) для' },
                                        { value: 'CHILD', label: 'Ребенком для' }
                                    ].map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, relationType: type.value })}
                                            className={`px-8 py-3 rounded-2xl border-2 transition-all font-bold ${formData.relationType === type.value
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                                                : 'border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-indigo-400'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))
                                    }
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] px-1 block text-center">Персона 2</label>
                                <select
                                    required
                                    className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 border-none rounded-2xl dark:text-white font-bold text-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none text-center cursor-pointer"
                                    value={formData.person2Id}
                                    onChange={(e) => setFormData({ ...formData, person2Id: e.target.value })}
                                >
                                    <option value="">Выберите человека...</option>
                                    {persons.map(p => (
                                        <option key={p.id} value={p.id}>{p.lastName} {p.firstName} {p.middleName || ""}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !formData.person1Id || !formData.person2Id}
                            className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[32px] font-black text-xl flex items-center justify-center gap-3 transition-all shadow-2xl shadow-indigo-500/40 hover:scale-[1.02] active:scale-100 disabled:opacity-50"
                        >
                            <LinkIcon size={24} />
                            {loading ? 'Создание...' : 'Создать связь'}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
