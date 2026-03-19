import { useState, useEffect, useCallback, useRef } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar as CalendarIcon,
    CheckCircle2,
    Circle,
    Plus,
    Trash2,
    Edit2,
    RotateCcw,
    X,
    Clock,
    Sparkles,
    Cloud,
    CloudOff,
    Loader2
} from 'lucide-react';
import { supabase } from './lib/supabase';

// --- PLANTILLAS PREDETERMINADAS ---
const defaultTemplates: Record<number, { startTime: string; endTime: string; title: string }[]> = {
    1: [
        { startTime: "07:00", endTime: "08:00", title: "Debug n8n" },
        { startTime: "08:00", endTime: "09:40", title: "Habilidades" },
        { startTime: "09:45", endTime: "11:25", title: "Mate | n8n" },
        { startTime: "11:55", endTime: "13:35", title: "Expresión" },
        { startTime: "13:40", endTime: "15:20", title: "Química | n8n" },
        { startTime: "15:40", endTime: "17:00", title: "News" },
        { startTime: "17:00", endTime: "18:00", title: "Proyecto social" },
        { startTime: "18:10", endTime: "18:40", title: "Ordenar" },
        { startTime: "18:40", endTime: "20:30", title: "Óseo" },
        { startTime: "20:30", endTime: "21:00", title: "Cena | baño" }
    ],
    2: [
        { startTime: "07:00", endTime: "08:00", title: "Debug n8n" },
        { startTime: "08:00", endTime: "09:30", title: "Ciencias" },
        { startTime: "09:35", endTime: "11:05", title: "Antropología" },
        { startTime: "11:35", endTime: "13:05", title: "Inglés" },
        { startTime: "13:10", endTime: "14:50", title: "Química | n8n" },
        { startTime: "15:20", endTime: "16:00", title: "Hacer comida" },
        { startTime: "16:10", endTime: "17:00", title: "News" },
        { startTime: "17:00", endTime: "18:00", title: "Examen PAA" },
        { startTime: "18:00", endTime: "19:00", title: "Inglés" },
        { startTime: "19:00", endTime: "20:00", title: "Óseo" },
        { startTime: "20:30", endTime: "21:00", title: "Cena | Baño" }
    ],
    3: [
        { startTime: "07:00", endTime: "08:00", title: "Webflow | Klaviyo | Debug n8n" },
        { startTime: "08:00", endTime: "09:40", title: "Habilidades" },
        { startTime: "09:45", endTime: "11:25", title: "Mate n8n" },
        { startTime: "11:55", endTime: "13:35", title: "Inglés" },
        { startTime: "13:40", endTime: "15:20", title: "Química n8n" },
        { startTime: "15:40", endTime: "17:00", title: "News" },
        { startTime: "17:00", endTime: "18:00", title: "Proyecto social" },
        { startTime: "18:10", endTime: "18:40", title: "Ordenar" },
        { startTime: "18:40", endTime: "20:30", title: "Óseo" },
        { startTime: "20:30", endTime: "21:00", title: "Cena | baño" }
    ],
    4: [
        { startTime: "07:00", endTime: "08:00", title: "Debug n8n" },
        { startTime: "08:00", endTime: "09:30", title: "Ciencias" },
        { startTime: "09:35", endTime: "11:05", title: "Antropología" },
        { startTime: "11:35", endTime: "13:05", title: "Química | n8n" },
        { startTime: "13:30", endTime: "14:00", title: "News" },
        { startTime: "14:00", endTime: "15:00", title: "Proyecto social" },
        { startTime: "15:00", endTime: "15:40", title: "Ordenar" },
        { startTime: "15:50", endTime: "18:00", title: "Examen PAA" },
        { startTime: "18:00", endTime: "20:00", title: "Óseo" },
        { startTime: "20:00", endTime: "20:30", title: "Cena | baño" }
    ],
    5: [
        { startTime: "07:00", endTime: "08:00", title: "Debug n8n" },
        { startTime: "08:00", endTime: "09:40", title: "Habilidades" },
        { startTime: "09:45", endTime: "11:25", title: "Mate" },
        { startTime: "12:45", endTime: "14:25", title: "Inglés" },
        { startTime: "14:40", endTime: "16:00", title: "News" },
        { startTime: "16:00", endTime: "17:00", title: "Proyecto social" },
        { startTime: "18:00", endTime: "20:00", title: "Óseo" },
        { startTime: "20:00", endTime: "20:30", title: "Cena | baño" }
    ]
};

// --- TIPOS ---
interface Task {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    completed: boolean;
}

// --- FUNCIONES DE AYUDA ---
const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getDaysForCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days: { date: Date; isCurrentMonth: boolean }[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ date: new Date(year, month, 1 - (startingDayOfWeek - i)), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
        days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
};

const isThirdThursday = (date: Date): boolean => {
    return date.getDay() === 4 && date.getDate() > 14 && date.getDate() <= 21;
};

const getBaseSchedule = (date: Date): Task[] => {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];

    const template: Task[] = defaultTemplates[dayOfWeek].map((t, idx) => ({
        ...t,
        id: `default-${idx}`,
        completed: false
    }));

    if (dayOfWeek === 4 && isThirdThursday(date)) {
        if (template[0]) {
            template[0] = { ...template[0], title: "Debug n8n | Klaviyo (Tercer Jueves)" };
        }
    }
    return template;
};

const formatTimeDisplay = (timeStr: string): string => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${hours}:${m} ${ampm}`;
};

const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// --- SISTEMA DE COLORES ---
const getTaskStyle = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('debug') || lowerTitle.includes('n8n') || lowerTitle.includes('webflow') || lowerTitle.includes('klaviyo'))
        return { bg: 'bg-orange-500', text: 'text-orange-700', lightBg: 'bg-orange-50', border: 'border-orange-200' };
    if (lowerTitle.includes('mate') || lowerTitle.includes('química') || lowerTitle.includes('ciencias'))
        return { bg: 'bg-blue-950', text: 'text-blue-950', lightBg: 'bg-blue-50', border: 'border-blue-200' };
    if (lowerTitle.includes('inglés') || lowerTitle.includes('expresión'))
        return { bg: 'bg-slate-600', text: 'text-slate-700', lightBg: 'bg-slate-100', border: 'border-slate-300' };
    if (lowerTitle.includes('óseo') || lowerTitle.includes('habilidades') || lowerTitle.includes('antropología') || lowerTitle.includes('paa'))
        return { bg: 'bg-red-700', text: 'text-red-700', lightBg: 'bg-red-50', border: 'border-red-200' };
    if (lowerTitle.includes('news') || lowerTitle.includes('proyecto'))
        return { bg: 'bg-black', text: 'text-black', lightBg: 'bg-gray-100', border: 'border-gray-300' };
    return { bg: 'bg-slate-400', text: 'text-slate-600', lightBg: 'bg-slate-50', border: 'border-slate-200' };
};

export default function CalendarApp() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarMonth, setCalendarMonth] = useState(new Date());
    const [userSchedules, setUserSchedules] = useState<Record<string, Task[]>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [currentTask, setCurrentTask] = useState<Task>({ id: '', title: '', startTime: '12:00', endTime: '13:00', completed: false });

    // --- SUPABASE SYNC ---
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isInitialLoad = useRef(true);

    // Load all schedules from Supabase on mount
    useEffect(() => {
        const loadFromSupabase = async () => {
            setSyncStatus('syncing');
            try {
                const { data, error } = await supabase
                    .from('day_schedules')
                    .select('date, tasks');
                if (error) throw error;

                const schedules: Record<string, Task[]> = {};
                for (const row of data || []) {
                    schedules[row.date] = row.tasks as Task[];
                }
                setUserSchedules(schedules);
                localStorage.setItem('myCustomCalendar', JSON.stringify(schedules));
                setSyncStatus('synced');
            } catch (e) {
                console.warn('Supabase load failed, using localStorage fallback', e);
                const saved = localStorage.getItem('myCustomCalendar');
                if (saved) {
                    try { setUserSchedules(JSON.parse(saved)); } catch { /* ignore */ }
                }
                setSyncStatus('offline');
            }
            isInitialLoad.current = false;
        };
        loadFromSupabase();
    }, []);

    // Debounced save to Supabase when userSchedules changes
    const syncToSupabase = useCallback(async (schedules: Record<string, Task[]>) => {
        setSyncStatus('syncing');
        try {
            // Upsert all changed dates
            const rows = Object.entries(schedules).map(([date, tasks]) => ({
                date,
                tasks,
            }));

            if (rows.length > 0) {
                const { error } = await supabase
                    .from('day_schedules')
                    .upsert(rows, { onConflict: 'date' });
                if (error) throw error;
            }
            setSyncStatus('synced');
        } catch (e) {
            console.warn('Supabase save failed', e);
            setSyncStatus('offline');
        }
    }, []);

    useEffect(() => {
        if (isInitialLoad.current) return;
        // Always save to localStorage immediately
        localStorage.setItem('myCustomCalendar', JSON.stringify(userSchedules));

        // Debounced Supabase sync (500ms)
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            syncToSupabase(userSchedules);
        }, 500);
    }, [userSchedules, syncToSupabase]);

    const dateKey = formatDate(selectedDate);
    const activeSchedule = userSchedules[dateKey] || getBaseSchedule(selectedDate);
    const isEditedDay = !!userSchedules[dateKey];

    const handleDayClick = (date: Date) => {
        setSelectedDate(date);
        if (date.getMonth() !== calendarMonth.getMonth()) {
            setCalendarMonth(new Date(date.getFullYear(), date.getMonth(), 1));
        }
    };

    const changeMonth = (offset: number) => {
        setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + offset, 1));
    };

    const goToToday = () => {
        const today = new Date();
        setSelectedDate(today);
        setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    };

    const toggleTask = (taskId: string) => {
        const currentDaySchedule = (userSchedules[dateKey] || getBaseSchedule(selectedDate)).map(t =>
            t.id === taskId ? { ...t, completed: !t.completed } : t
        );
        setUserSchedules(prev => ({ ...prev, [dateKey]: currentDaySchedule }));
    };

    const openAddModal = () => {
        setModalMode('add');
        setCurrentTask({ id: '', title: '', startTime: '12:00', endTime: '13:00', completed: false });
        setIsModalOpen(true);
    };

    const openEditModal = (task: Task) => {
        setModalMode('edit');
        setCurrentTask({ ...task });
        setIsModalOpen(true);
    };

    const saveTask = () => {
        if (!currentTask.title.trim()) return;
        let currentDaySchedule = userSchedules[dateKey] || getBaseSchedule(selectedDate);

        if (modalMode === 'add') {
            currentDaySchedule = [...currentDaySchedule, { ...currentTask, id: `custom-${Date.now()}`, completed: false }];
        } else {
            currentDaySchedule = currentDaySchedule.map(t => t.id === currentTask.id ? { ...currentTask } : t);
        }

        currentDaySchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setUserSchedules(prev => ({ ...prev, [dateKey]: currentDaySchedule }));
        setIsModalOpen(false);
    };

    const deleteTask = (taskId: string) => {
        const currentDaySchedule = (userSchedules[dateKey] || getBaseSchedule(selectedDate)).filter(t => t.id !== taskId);
        setUserSchedules(prev => ({ ...prev, [dateKey]: currentDaySchedule }));
    };

    const resetToDefault = () => {
        if (window.confirm("¿Seguro que quieres restaurar este día? Se perderán las tareas personalizadas y marcas de completado de hoy.")) {
            setUserSchedules(prev => {
                const copy = { ...prev };
                delete copy[dateKey];
                localStorage.setItem('myCustomCalendar', JSON.stringify(copy));
                return copy;
            });
            // Also delete from Supabase
            supabase.from('day_schedules').delete().eq('date', dateKey).then();
        }
    };

    const calendarDays = getDaysForCalendar(calendarMonth.getFullYear(), calendarMonth.getMonth());

    return (
        <div className="min-h-[100dvh] bg-slate-100 text-slate-800 font-sans flex justify-center py-2 px-2 sm:py-6 sm:px-6 md:py-10">
            <div className="max-w-6xl w-full flex flex-col md:flex-row gap-4 md:gap-8">

                {/* PANEL IZQUIERDO: CALENDARIO MENSUAL */}
                <div className="w-full md:w-[340px] shrink-0 bg-white shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-[2rem] border border-slate-200 p-4 sm:p-7 h-fit relative">
                    <div className="flex items-center justify-between mb-8">
                        <button onClick={goToToday} className="flex items-center gap-2 text-sm font-bold text-red-700 bg-red-50 hover:bg-red-100 py-1.5 px-4 rounded-full transition-all">
                            <CalendarIcon size={16} /> Hoy
                        </button>
                        <div className="flex gap-1.5 bg-slate-50 rounded-full p-1 border border-slate-100">
                            <button onClick={() => changeMonth(-1)} className="p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all text-slate-600">
                                <ChevronLeft size={18} />
                            </button>
                            <button onClick={() => changeMonth(1)} className="p-1.5 rounded-full hover:bg-white hover:shadow-sm transition-all text-slate-600">
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 mb-6 text-center capitalize tracking-tight">
                        {monthNames[calendarMonth.getMonth()]} <span className="text-slate-400 font-medium">{calendarMonth.getFullYear()}</span>
                    </h2>

                    <div className="grid grid-cols-7 gap-1 mb-3">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                        {calendarDays.map((d, i) => {
                            const isSelected = formatDate(d.date) === formatDate(selectedDate);
                            const isToday = formatDate(d.date) === formatDate(new Date());
                            const hasCustomData = !!userSchedules[formatDate(d.date)];

                            return (
                                <button
                                    key={i}
                                    onClick={() => handleDayClick(d.date)}
                                    className={`
                                        relative aspect-square flex items-center justify-center text-sm rounded-2xl transition-all duration-300 font-bold
                                        ${!d.isCurrentMonth ? 'text-slate-300' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'}
                                        ${isSelected ? 'bg-slate-900 text-white hover:bg-black shadow-lg shadow-slate-900/30 scale-105 z-10' : ''}
                                        ${isToday && !isSelected ? 'ring-2 ring-red-700 text-red-700 bg-red-50' : ''}
                                    `}
                                >
                                    {d.date.getDate()}
                                    {hasCustomData && d.isCurrentMonth && !isSelected && (
                                        <div className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-orange-500 shadow-sm"></div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* PANEL DERECHO: HORARIO DEL DÍA */}
                <div className="flex-1 bg-white shadow-xl shadow-slate-200/50 rounded-2xl md:rounded-[2rem] border border-slate-200 overflow-hidden flex flex-col min-h-[60dvh] md:h-[calc(100vh-5rem)] md:max-h-[850px]">

                    {/* Cabecera del día */}
                    <div className="bg-slate-900 text-white p-5 sm:p-8 pb-6 sm:pb-8 relative shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-4xl font-black mb-1 sm:mb-2 tracking-tight">
                                    {dayNames[selectedDate.getDay()]}, {selectedDate.getDate()} de {monthNames[selectedDate.getMonth()]}
                                </h1>
                                <p className="text-slate-400 font-medium flex items-center gap-2 text-sm sm:text-lg">
                                    <CalendarIcon size={16} className="text-orange-500" />
                                    {activeSchedule.length} actividades
                                    <span className="ml-1" title={syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'offline' ? 'Sin conexión' : ''}>
                                        {syncStatus === 'syncing' && <Loader2 size={14} className="animate-spin text-orange-400" />}
                                        {syncStatus === 'synced' && <Cloud size={14} className="text-green-400" />}
                                        {syncStatus === 'offline' && <CloudOff size={14} className="text-red-400" />}
                                    </span>
                                </p>
                            </div>

                            <div className="flex gap-2 shrink-0">
                                {isEditedDay && (
                                    <button
                                        onClick={resetToDefault}
                                        title="Restaurar horario original"
                                        className="bg-white/10 text-white p-3 rounded-xl hover:bg-white/20 transition-all"
                                    >
                                        <RotateCcw size={20} />
                                    </button>
                                )}
                                <button
                                    onClick={openAddModal}
                                    className="bg-red-600 text-white p-3 rounded-xl shadow-lg hover:bg-red-700 transition-all"
                                >
                                    <Plus size={24} strokeWidth={3} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Lista de Tareas */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
                        {activeSchedule.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <div className="bg-slate-50 p-6 rounded-[2rem] mb-6 shadow-inner border border-slate-100">
                                    <Sparkles size={48} className="text-slate-900" />
                                </div>
                                <p className="text-2xl font-black text-slate-900 mb-2">¡Día libre!</p>
                                <p className="text-slate-500 text-center max-w-xs">No hay actividades programadas. Descansa o añade algo nuevo.</p>
                                <button onClick={openAddModal} className="mt-6 px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg shadow-slate-900/20">
                                    Añadir actividad
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {activeSchedule.map(task => {
                                    const style = getTaskStyle(task.title);
                                    return (
                                        <div
                                            key={task.id}
                                            className={`group relative flex items-center justify-between p-3 sm:p-5 rounded-xl sm:rounded-2xl transition-all duration-300 ${
                                                task.completed
                                                ? 'bg-slate-50 opacity-50 grayscale border-transparent'
                                                : 'bg-white border-slate-200 hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 hover:border-slate-300'
                                            } border-2`}
                                        >
                                            <div className={`absolute left-0 top-3 bottom-3 w-1.5 sm:w-2 rounded-r-full transition-all duration-300 ${task.completed ? 'bg-slate-300' : style.bg}`} />

                                            <div className="flex items-center gap-3 sm:gap-5 flex-1 pl-3 sm:pl-4">
                                                <button
                                                    onClick={() => toggleTask(task.id)}
                                                    className={`shrink-0 transition-all duration-300 active:scale-95 ${task.completed ? 'text-black' : 'text-slate-300 hover:text-slate-900'}`}
                                                >
                                                    {task.completed ? <CheckCircle2 size={26} className="sm:w-8 sm:h-8" /> : <Circle size={26} strokeWidth={2.5} className="sm:w-8 sm:h-8" />}
                                                </button>

                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-black text-base sm:text-lg truncate transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                                        <span className={`flex items-center gap-1 text-xs sm:text-sm font-bold px-2 py-0.5 rounded-md ${task.completed ? 'bg-slate-200 text-slate-500' : `${style.lightBg} ${style.text}`}`}>
                                                            <Clock size={12} />
                                                            {formatTimeDisplay(task.startTime)} - {formatTimeDisplay(task.endTime)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-1 sm:gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all duration-300 ml-2 sm:ml-4">
                                                <button onClick={() => openEditModal(task)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg sm:rounded-xl transition-colors">
                                                    <Edit2 size={16} strokeWidth={2.5} />
                                                </button>
                                                <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-white hover:bg-red-700 rounded-lg sm:rounded-xl transition-colors">
                                                    <Trash2 size={16} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 z-50">
                    <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-black/50 w-full sm:max-w-md overflow-hidden border border-slate-100">
                        <div className="flex justify-between items-center p-6 border-b border-slate-100">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                {modalMode === 'add' ? 'Nueva Actividad' : 'Editar Actividad'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-all">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-900 mb-2">Nombre de la actividad</label>
                                <input
                                    type="text"
                                    autoFocus
                                    value={currentTask.title}
                                    onChange={e => setCurrentTask({ ...currentTask, title: e.target.value })}
                                    className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold"
                                    placeholder="Ej. Leer un libro, Debug n8n..."
                                />
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Hora Inicio</label>
                                    <input
                                        type="time"
                                        value={currentTask.startTime}
                                        onChange={e => setCurrentTask({ ...currentTask, startTime: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Hora Fin</label>
                                    <input
                                        type="time"
                                        value={currentTask.endTime}
                                        onChange={e => setCurrentTask({ ...currentTask, endTime: e.target.value })}
                                        className="w-full bg-slate-50 border-2 border-slate-200 text-slate-900 rounded-xl px-4 py-3 focus:ring-4 focus:ring-slate-900/10 focus:border-slate-900 focus:bg-white outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={saveTask}
                                disabled={!currentTask.title.trim()}
                                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold hover:bg-black shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:-translate-y-0.5"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
