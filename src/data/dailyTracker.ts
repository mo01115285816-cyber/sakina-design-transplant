export type DailyTask = {
  id: number;
  text: string;
};

const defaultTasks: DailyTask[] = [
  { id: 1, text: "صلاة الفجر في وقتها" },
  { id: 2, text: "الاستماع لوجه قرآن أو قراءته" },
  { id: 3, text: "المحافظة على أذكار الصباح" },
  { id: 4, text: "صلاة الضحى (ركعتين على الأقل)" },
  { id: 5, text: "صلاة الظهر في وقتها" },
  { id: 6, text: "صلاة العصر في وقتها" },
  { id: 7, text: "المحافظة على أذكار المساء" },
  { id: 8, text: "صلاة المغرب في وقتها" },
  { id: 9, text: "صلاة العشاء في وقتها" },
  { id: 10, text: "قراءة سورة الملك قبل النوم" },
  { id: 11, text: "المحافظة على أذكار النوم" },
  { id: 12, text: "صلاة الوتر (ولو ركعة واحدة)" }
];

export const dailyTracker = {
  tasks: defaultTasks,

  getStorageKey(): string {
    const today = new Date();
    // Unique key per day (e.g. "sakinah_tasks_2023_10_27")
    return `sakinah_tasks_${today.getFullYear()}_${today.getMonth() + 1}_${today.getDate()}`;
  },

  // Get raw records from localStorage
  getTodayRecords(): Record<number, boolean> {
    if (typeof window === "undefined") return {};
    const key = this.getStorageKey();
    const data = localStorage.getItem(key);
    if (!data) return {};
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  },

  // Save records to localStorage
  saveTodayRecords(records: Record<number, boolean>) {
    if (typeof window === "undefined") return;
    const key = this.getStorageKey();
    localStorage.setItem(key, JSON.stringify(records));
  },

  // Check if specific task is done
  isTaskDone(taskId: number): boolean {
    const records = this.getTodayRecords();
    return !!records[taskId];
  },

  // Toggle task done/undone
  toggleTask(taskId: number) {
    const records = this.getTodayRecords();
    records[taskId] = !records[taskId];
    this.saveTodayRecords(records);
  },

  // Get completed count
  getCompletedCount(): number {
    const records = this.getTodayRecords();
    return Object.values(records).filter(Boolean).length;
  },

  // Get progress as float [0, 1]
  getTodayProgress(): number {
    const completed = this.getCompletedCount();
    const total = this.tasks.length;
    if (total === 0) return 0;
    return completed / total;
  }
};
