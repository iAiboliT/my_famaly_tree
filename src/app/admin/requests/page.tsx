"use client";

import { useState, useEffect } from "react";
import { Check, X, UserCheck, Trash2, Clock, Info } from "lucide-react";
import Link from "next/link";

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/requests")
            .then(res => res.json())
            .then(data => {
                setRequests(data);
                setLoading(false);
            });
    }, []);

    const handleAction = async (requestId: string, approve: boolean) => {
        try {
            const res = await fetch("/api/admin/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ requestId, approve }),
            });
            if (res.ok) {
                setRequests(requests.filter(r => r.id !== requestId));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="p-20 text-center font-bold">Загрузка запросов...</div>;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black dark:text-white uppercase tracking-tight">Запросы на одобрение</h1>
                        <p className="text-gray-500 font-medium">Управление изменениями в вашем семейном древе</p>
                    </div>
                    <Link href="/" className="px-6 py-2 bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl font-bold text-xs">
                        Вернуться к дереву
                    </Link>
                </header>

                <div className="grid gap-4">
                    {requests.length === 0 ? (
                        <div className="p-20 bg-white dark:bg-gray-900 rounded-[32px] border dark:border-gray-800 text-center">
                            <UserCheck size={48} className="mx-auto mb-4 text-gray-300" />
                            <h3 className="text-xl font-bold dark:text-white">Все изменения проверены</h3>
                            <p className="text-gray-500">Новых запросов пока нет.</p>
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="p-6 bg-white dark:bg-gray-900 rounded-[32px] border dark:border-gray-800 shadow-sm flex items-center justify-between group">
                                <div className="flex items-center gap-6">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.type === 'CREATE' ? 'bg-emerald-50 text-emerald-600' :
                                            req.type === 'UPDATE' ? 'bg-indigo-50 text-indigo-600' :
                                                'bg-rose-50 text-rose-600'
                                        }`}>
                                        {req.type === 'CREATE' ? <Check /> : req.type === 'UPDATE' ? <Info /> : <Trash2 />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{req.targetModel}</span>
                                            <span className="w-1 h-1 bg-gray-300 rounded-full" />
                                            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{req.type}</span>
                                        </div>
                                        <h4 className="font-bold dark:text-white">
                                            {req.requester.email} предложил(а) {req.type === 'CREATE' ? 'создать' : req.type === 'UPDATE' ? 'изменить' : 'удалить'} запись
                                        </h4>
                                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                                            <Clock size={12} /> {new Date(req.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleAction(req.id, false)} className="px-5 py-2.5 bg-gray-50 dark:bg-gray-800 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl font-bold text-xs transition-all">
                                        Отклонить
                                    </button>
                                    <button onClick={() => handleAction(req.id, true)} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all">
                                        Одобрить
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
