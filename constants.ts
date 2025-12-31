import { DailyTask } from "./types";

export const LEVELS = [
  { level: 1, xp: 0, name: "數學探險家" },
  { level: 2, xp: 100, name: "數字忍者" },
  { level: 3, xp: 300, name: "邏輯傳奇" },
  { level: 4, xp: 600, name: "銀河天才" },
];

export const INITIAL_TASKS: DailyTask[] = [
  {
    id: '1',
    title: '暖身運動',
    description: '解決 5 道加法題',
    titleKey: 'task_warmup_title',
    descriptionKey: 'task_warmup_desc',
    target: 5,
    current: 0,
    completed: false,
    reward: 20,
    icon: 'Zap'
  },
  {
    id: '2',
    title: '星星收集者',
    description: '連續答對 3 題',
    titleKey: 'task_streak_title',
    descriptionKey: 'task_streak_desc',
    target: 3,
    current: 0,
    completed: false,
    reward: 50,
    icon: 'Star'
  },
  {
    id: '3',
    title: '最強大腦',
    description: '解決 1 道乘法題',
    titleKey: 'task_brain_title',
    descriptionKey: 'task_brain_desc',
    target: 1,
    current: 0,
    completed: false,
    reward: 30,
    icon: 'Crown'
  }
];