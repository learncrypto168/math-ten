import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Play, 
  Home, 
  Settings, 
  Trophy, 
  ArrowRight, 
  RotateCcw,
  Check,
  Zap,
  Crown,
  Star,
  User,
  LogIn
} from 'lucide-react';

import TenFrame, { DivisionGrid } from './components/TenFrame';
import Registration from './components/Registration';
import SettingsView from './components/SettingsView';
import { MathOperation, Problem, UserState, AppView, UserProfile, Language } from './types';
import { INITIAL_TASKS } from './constants';
import { generateMathStory } from './services/geminiService';
import { getCurrentUser } from './services/db';
import { TRANSLATIONS } from './translations';

// --- Helper Functions ---
const generateProblem = (op: MathOperation, difficulty: number): Problem => {
  let a = 0, b = 0, result = 0;
  
  const getRandom = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

  switch (op) {
    case MathOperation.ADDITION:
      if (difficulty === 1) {
        a = getRandom(1, 9);
        b = getRandom(1, 9);
      } else if (difficulty === 2) {
        a = getRandom(10, 99);
        b = getRandom(1, 99);
      } else if (difficulty === 3) {
        a = getRandom(100, 999);
        b = getRandom(10, 999);
      } else {
        a = getRandom(1000, 9999);
        b = getRandom(100, 9999);
      }
      result = a + b;
      break;

    case MathOperation.SUBTRACTION:
      if (difficulty === 1) {
        a = getRandom(2, 18);
        b = getRandom(1, a - 1);
      } else if (difficulty === 2) {
        a = getRandom(20, 99);
        b = getRandom(10, a - 1);
      } else if (difficulty === 3) {
        a = getRandom(100, 999);
        b = getRandom(10, a - 1);
      } else {
        a = getRandom(1000, 9999);
        b = getRandom(100, a - 1);
      }
      result = a - b;
      break;

    case MathOperation.MULTIPLICATION:
      if (difficulty === 1) {
        a = getRandom(1, 9);
        b = getRandom(1, 9);
      } else if (difficulty === 2) {
        a = getRandom(10, 99);
        b = getRandom(2, 9);
      } else if (difficulty === 3) {
        a = getRandom(100, 999);
        b = getRandom(2, 9);
      } else {
        // Harder multiplication: 2 digit * 2 digit
        a = getRandom(10, 99);
        b = getRandom(10, 99);
      }
      result = a * b;
      break;

    case MathOperation.DIVISION:
      // a / b = result  =>  result * b = a
      if (difficulty === 1) {
        b = getRandom(2, 9);
        result = getRandom(2, 9);
      } else if (difficulty === 2) {
        b = getRandom(2, 9);
        result = getRandom(10, 20);
      } else if (difficulty === 3) {
        b = getRandom(2, 9);
        result = getRandom(20, 100);
      } else {
        b = getRandom(10, 20); // 2 digit divisor
        result = getRandom(10, 50);
      }
      a = b * result; // Dividend
      break;
  }

  return {
    id: Date.now().toString(),
    operation: op,
    operandA: a,
    operandB: b,
    result: result
  };
};

const getOpSymbolDisplay = (op: MathOperation) => {
  switch (op) {
    case MathOperation.ADDITION: return '+';
    case MathOperation.SUBTRACTION: return '-';
    case MathOperation.MULTIPLICATION: return '×';
    case MathOperation.DIVISION: return '÷';
  }
};

const playRewardSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, t); 
    osc.frequency.exponentialRampToValueAtTime(523.25, t + 0.1); 
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.start(t);
    osc.stop(t + 0.5);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, t + 0.05); 
    gain2.gain.setValueAtTime(0.08, t + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    osc2.start(t + 0.05);
    osc2.stop(t + 0.6);

  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// --- Main Component ---

const App: React.FC = () => {
  const [view, setView] = useState<AppView>(AppView.LOADING);
  const [language, setLanguage] = useState<Language>('zh-TW');
  const [userState, setUserState] = useState<UserState>({
    coins: 100,
    streak: 0,
    xp: 0,
    level: 1,
    avatarId: 'unicorn',
    dailyTasks: INITIAL_TASKS
  });
  
  const [selectedOperation, setSelectedOperation] = useState<MathOperation>(MathOperation.ADDITION);
  const [difficulty, setDifficulty] = useState<number>(1);
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [storyText, setStoryText] = useState<string>("");
  const [canContinue, setCanContinue] = useState<boolean>(false);
  
  // Animation Phase logic
  const [animPhase, setAnimPhase] = useState<'idle' | 'merged' | 'division-gathered' | 'division-grouped'>('idle');

  // Helper for translations
  const t = TRANSLATIONS[language];

  useEffect(() => {
    // Check for user login/registration
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
           setUserState(prev => ({ ...prev, profile: user }));
           setView(AppView.DASHBOARD);
        } else {
           setView(AppView.REGISTRATION);
        }
      } catch (e) {
        console.error("DB Error", e);
        setView(AppView.REGISTRATION); // Fallback
      }
    };
    checkUser();
  }, []);

  const handleRegistrationComplete = (profile: UserProfile) => {
    setUserState(prev => ({ ...prev, profile }));
    setView(AppView.DASHBOARD);
  };

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setUserState(prev => ({
      ...prev,
      profile: prev.profile ? { ...prev.profile, ...updates } : undefined
    }));
  };

  const loadNewProblem = useCallback(async (op: MathOperation, diff: number) => {
    setInputValue('');
    setFeedback('idle');
    setAnimPhase('idle');
    setStoryText(""); 
    setCanContinue(false);
    
    const problem = generateProblem(op, diff);
    setCurrentProblem(problem);
    
    // Always generate story and emojis regardless of difficulty
    const storyData = await generateMathStory(problem.operation, problem.operandA, problem.operandB, problem.result, language);
    
    if (problem.id) { 
        setCurrentProblem(prev => prev ? { 
          ...prev, 
          storyContext: storyData.text,
          primaryEmoji: storyData.primaryEmoji,
          secondaryEmoji: storyData.secondaryEmoji
        } : null);
        setStoryText(storyData.text);
    }
  }, [language]);

  const handleStartGame = (op: MathOperation) => {
    setSelectedOperation(op);
    setView(AppView.GAME);
    loadNewProblem(op, difficulty);
  };

  const handleDifficultyChange = (newDiff: number) => {
    setDifficulty(newDiff);
    loadNewProblem(selectedOperation, newDiff);
  };

  const handleTaskProgress = (isCorrect: boolean, op: MathOperation) => {
    if (!isCorrect) return;

    setUserState(prev => {
      const newTasks = prev.dailyTasks.map(task => {
        if (task.completed) return task;
        
        let progress = false;
        if (task.id === '1' && op === MathOperation.ADDITION) progress = true;
        if (task.id === '2' && prev.streak >= 2) progress = true;
        if (task.id === '3' && op === MathOperation.MULTIPLICATION) progress = true;

        if (progress) {
          const newCurrent = task.current + 1;
          const completed = newCurrent >= task.target;
          return { ...task, current: newCurrent, completed };
        }
        return task;
      });
      return { ...prev, dailyTasks: newTasks };
    });
  };

  const checkAnswer = async () => {
    if (!currentProblem || feedback !== 'idle') return;
    
    const val = parseInt(inputValue);
    if (isNaN(val)) return;

    if (val === currentProblem.result) {
      setFeedback('correct');
      playRewardSound();
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#F472B6', '#34D399']
      });

      const newStreak = userState.streak + 1;

      setUserState(prev => ({
        ...prev,
        coins: prev.coins + 10,
        xp: prev.xp + 20 * difficulty, // More XP for higher difficulty
        streak: newStreak
      }));

      handleTaskProgress(true, currentProblem.operation);

      // Animation logic - Only if visuals are likely shown (Difficulty 1)
      const showVisuals = difficulty === 1;

      if (showVisuals && currentProblem.operation === MathOperation.DIVISION) {
        setAnimPhase('division-gathered');
        setTimeout(() => setAnimPhase('division-grouped'), 1000);
        setTimeout(() => setCanContinue(true), 2500);
      } else if (showVisuals && currentProblem.operation === MathOperation.ADDITION) {
        setAnimPhase('merged');
        setTimeout(() => setCanContinue(true), 2000); 
      } else if (showVisuals) {
        setAnimPhase('merged');
        setTimeout(() => setCanContinue(true), 1500);
      } else {
        // Fast transition for higher difficulties
        setTimeout(() => setCanContinue(true), 500);
      }

    } else {
      setFeedback('wrong');
      setUserState(prev => ({ ...prev, streak: 0 }));
      
      setTimeout(() => setFeedback('idle'), 1000);
    }
  };

  const handleKeypad = (num: number) => {
    // Allow more digits for higher difficulties (e.g. 4 digits + 4 digits = 5 digits)
    if (inputValue.length < 8) {
      setInputValue(prev => prev + num.toString());
    }
  };

  const handleBackspace = () => {
    setInputValue(prev => prev.slice(0, -1));
  };

  const handleLogout = () => {
    if (confirm(t.confirmLogout)) {
      setUserState(prev => ({ ...prev, profile: undefined }));
      setView(AppView.REGISTRATION);
    }
  };

  const renderDashboard = () => (
    <div className="flex flex-col h-full p-6 space-y-6 overflow-y-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-3xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-gray-200 border-2 border-sparkle-primary overflow-hidden">
             {userState.profile?.avatar ? (
               <img src={userState.profile.avatar} alt="Profile" className="w-full h-full object-cover" />
             ) : (
                <User className="w-8 h-8 text-white" />
             )}
          </div>
          <div>
            <h2 className="font-bold text-gray-700 text-lg">{t.hello}, {userState.profile?.name || t.friend}!</h2>
            <div className="text-xs text-gray-400 font-medium">{userState.profile?.grade} | {userState.profile?.school}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           {/* Settings Button */}
           <button 
             onClick={() => setView(AppView.SETTINGS)}
             className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-sparkle-primary transition-colors"
           >
              <Settings className="w-6 h-6" />
           </button>

           {/* Show Login button if guest (no ID) */}
           {!userState.profile?.id && (
             <button 
               onClick={() => setView(AppView.REGISTRATION)}
               className="bg-sparkle-primary text-white px-3 py-1.5 rounded-full text-sm font-bold flex items-center shadow-sm active:scale-95 transition-transform hover:bg-sparkle-primary/90"
             >
               <LogIn className="w-4 h-4 mr-1" />
               {t.login}
             </button>
           )}
           <div className="flex items-center space-x-2 bg-yellow-100 px-4 py-2 rounded-full">
             <Trophy className="text-yellow-500 w-5 h-5" />
             <span className="font-bold text-yellow-700">{userState.coins}</span>
           </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-white p-4 rounded-3xl shadow-sm">
         <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-bold text-gray-500">{t.level} {Math.floor(userState.xp / 100) + 1}</span>
            <span className="text-sm font-bold text-sparkle-primary">{userState.xp % 100} / 100 XP</span>
         </div>
         <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-sparkle-primary to-sparkle-secondary" 
              style={{ width: `${userState.xp % 100}%` }}
            ></div>
         </div>
      </div>

      <div className="bg-white p-6 rounded-3xl shadow-sm border-2 border-sparkle-bg">
        <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center">
          <Check className="w-6 h-6 mr-2 text-sparkle-accent" /> {t.dailyTasks}
        </h3>
        <div className="space-y-3">
          {userState.dailyTasks.map(task => {
            // Resolve translation key if exists
            const title = (task.titleKey && (t as any)[task.titleKey]) ? (t as any)[task.titleKey] : task.title;
            const desc = (task.descriptionKey && (t as any)[task.descriptionKey]) ? (t as any)[task.descriptionKey] : task.description;

            return (
              <div key={task.id} className={`flex items-center justify-between p-3 rounded-2xl ${task.completed ? 'bg-green-100 opacity-70' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${task.completed ? 'bg-green-200' : 'bg-white shadow-sm'}`}>
                    {task.icon === 'Zap' && <Zap className="w-5 h-5 text-sparkle-primary" />}
                    {task.icon === 'Star' && <Trophy className="w-5 h-5 text-sparkle-secondary" />}
                    {task.icon === 'Crown' && <Crown className="w-5 h-5 text-yellow-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-gray-700">{title}</p>
                    <p className="text-xs text-gray-500">{task.current}/{task.target} {desc}</p>
                  </div>
                </div>
                <div className="text-xs font-bold text-sparkle-primary">+{task.reward} {t.coins}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 flex-1">
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartGame(MathOperation.ADDITION)}
          className="bg-red-100 p-4 rounded-3xl flex flex-col items-center justify-center space-y-2 border-b-4 border-red-200"
        >
          <div className="bg-white p-3 rounded-full"><Play className="text-red-400 fill-current" /></div>
          <span className="font-bold text-red-500 text-lg">{t.add}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartGame(MathOperation.SUBTRACTION)}
          className="bg-blue-100 p-4 rounded-3xl flex flex-col items-center justify-center space-y-2 border-b-4 border-blue-200"
        >
          <div className="bg-white p-3 rounded-full"><Play className="text-blue-400 fill-current" /></div>
          <span className="font-bold text-blue-500 text-lg">{t.sub}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartGame(MathOperation.MULTIPLICATION)}
          className="bg-green-100 p-4 rounded-3xl flex flex-col items-center justify-center space-y-2 border-b-4 border-green-200"
        >
          <div className="bg-white p-3 rounded-full"><Play className="text-green-400 fill-current" /></div>
          <span className="font-bold text-green-500 text-lg">{t.mul}</span>
        </motion.button>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => handleStartGame(MathOperation.DIVISION)}
          className="bg-purple-100 p-4 rounded-3xl flex flex-col items-center justify-center space-y-2 border-b-4 border-purple-200"
        >
          <div className="bg-white p-3 rounded-full"><Play className="text-purple-400 fill-current" /></div>
          <span className="font-bold text-purple-500 text-lg">{t.div}</span>
        </motion.button>
      </div>
    </div>
  );

  const renderGame = () => {
    if (!currentProblem) return <div className="p-10 text-center">{t.loadingMagic}</div>;

    const showResult = feedback === 'correct';
    
    // Result Calculation
    let resultValue = 0;
    let resultSecondaryValue = 0;
    let resultColor = 'text-sparkle-primary';
    let resultSecondaryColor = 'text-sparkle-secondary';

    if (showResult) {
       if (selectedOperation === MathOperation.ADDITION) {
          resultValue = currentProblem.operandA;
          resultSecondaryValue = currentProblem.operandB;
       } else {
          resultValue = currentProblem.result;
          resultSecondaryValue = 0;
       }
    }

    // Logic for top grid visibility (for animation)
    const showSourceDots = animPhase === 'idle';
    // Hide dots for higher difficulties to prevent performance issues and clutter
    const showTenFrame = difficulty === 1; 

    return (
      <div className="flex flex-col h-full relative">
        <div className="flex justify-between items-center p-4">
          <button onClick={() => setView(AppView.DASHBOARD)} className="p-2 bg-white rounded-full shadow-sm text-gray-500">
            <Home />
          </button>
          
          {/* Difficulty Selector */}
          <div className="flex bg-white rounded-full p-1 shadow-sm border border-gray-100">
            {[1, 2, 3, 4].map(level => (
              <button
                key={level}
                onClick={() => handleDifficultyChange(level)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${difficulty === level ? 'bg-yellow-400 text-white shadow-sm' : 'text-gray-300 hover:bg-gray-50'}`}
              >
                {difficulty >= level ? <Star className="w-4 h-4 fill-current" /> : <span className="text-sm font-bold">{level}</span>}
              </button>
            ))}
          </div>

          <div className="flex space-x-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full ${i < userState.streak % 4 ? 'bg-yellow-400' : 'bg-gray-200'}`} />
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-20 flex flex-col items-center">
          <div className="mt-4 mb-6 w-full text-center min-h-[60px]">
             {storyText ? (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/80 p-4 rounded-2xl shadow-sm border border-sparkle-primary/20 inline-block"
                >
                  <p className="text-lg text-sparkle-primary font-medium font-sans">{storyText}</p>
                </motion.div>
             ) : (
                <div className="h-4"></div>
             )}
          </div>

          <div className="w-full flex flex-col items-center space-y-8 mb-8">
            
            {/* 
              Responsive Layout:
              - Mobile/Tablet (Portrait): Vertical Stack (flex-col)
              - Desktop/Tablet (Landscape): Horizontal Row (flex-row) via lg:flex-row
              This puts the operator vertically between the operands on smaller screens.
            */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 w-full transition-all duration-500">
               
               {/* Operand A / Dividend */}
               <div className="flex flex-col items-center justify-center p-2">
                  {showTenFrame ? (
                    showSourceDots ? (
                      <TenFrame 
                        value={currentProblem.operandA} 
                        color="text-sparkle-primary" 
                        iconType="circle"
                        layoutIdResolver={(i) => `dot-a-${i}`}
                        primaryEmoji={currentProblem.primaryEmoji}
                        secondaryEmoji={currentProblem.secondaryEmoji}
                      />
                    ) : (
                      <TenFrame 
                        value={0}
                        maxValue={Math.max(currentProblem.operandA, 10)}
                        color="text-sparkle-primary" 
                        iconType="circle"
                      />
                    )
                  ) : (
                    // Large Number Display for Level 2+
                    <div className="text-6xl md:text-8xl font-bold text-sparkle-primary font-sans tracking-tight">
                      {currentProblem.operandA}
                    </div>
                  )}
               </div>
               
               {/* Operator */}
               <div className="flex items-center justify-center py-2 lg:py-0">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-full shadow-sm border-2 border-gray-100 flex items-center justify-center">
                    <span className="text-3xl md:text-5xl font-bold text-gray-400 transform transition-transform hover:scale-110">
                      {getOpSymbolDisplay(selectedOperation)}
                    </span>
                  </div>
               </div>

               {/* Operand B / Divisor */}
               <div className="flex flex-col items-center justify-center p-2">
                  {selectedOperation === MathOperation.DIVISION ? (
                    <div className="text-6xl md:text-8xl font-bold text-sparkle-secondary font-sans tracking-tight">
                        {currentProblem.operandB}
                    </div>
                  ) : (
                    showTenFrame ? (
                      showSourceDots ? (
                          <TenFrame 
                          value={currentProblem.operandB} 
                          color="text-sparkle-secondary" 
                          iconType="circle" 
                          layoutIdResolver={(i) => `dot-b-${i}`}
                          primaryEmoji={currentProblem.secondaryEmoji} // For B, we use secondary emoji as its primary
                          />
                      ) : (
                          <TenFrame 
                          value={0}
                          maxValue={Math.max(currentProblem.operandB, 10)}
                          color="text-sparkle-secondary" 
                          iconType="circle"
                          />
                      )
                    ) : (
                      // Large Number Display for Level 2+
                      <div className="text-6xl md:text-8xl font-bold text-sparkle-secondary font-sans tracking-tight">
                        {currentProblem.operandB}
                      </div>
                    )
                  )}
               </div>

            </div>

            <div className="flex flex-col items-center w-full">
               <div className="w-full border-t-2 border-dashed border-gray-200 mb-4 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-sparkle-bg px-4 text-gray-400 font-bold">
                     = ?
                  </div>
               </div>

               {/* Result Area Container */}
               <div className="min-h-[100px] w-full flex justify-center items-start relative">
                 
                 {/* IDLE */}
                 {animPhase === 'idle' && showTenFrame && (
                    <TenFrame 
                      value={0} 
                      color="text-sparkle-primary" 
                      isResult={true} 
                    />
                 )}

                 {/* ADDITION / MERGED */}
                 {animPhase === 'merged' && (
                   showTenFrame ? (
                     <TenFrame 
                        value={resultValue}
                        secondaryValue={resultSecondaryValue}
                        maxValue={0} 
                        color={resultColor}
                        secondaryColor={resultSecondaryColor}
                        iconType="circle"
                        isResult={true}
                        layoutIdResolver={(i, type) => {
                          if (type === 'primary') return `dot-a-${i}`;
                          if (type === 'secondary') {
                             return `dot-b-${i - resultValue}`;
                          }
                          return undefined;
                        }}
                        motionTransition={(type) => ({
                          duration: 0.2,
                          ease: "easeIn",
                          delay: type === 'secondary' ? 0.5 : 0
                        })}
                        primaryEmoji={currentProblem.primaryEmoji}
                        secondaryEmoji={currentProblem.secondaryEmoji}
                     />
                   ) : (
                     <motion.div 
                       initial={{ scale: 0.5, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="text-6xl md:text-8xl font-bold text-sparkle-accent font-sans"
                     >
                       {currentProblem.result}
                     </motion.div>
                   )
                 )}

                 {/* DIVISION PHASE 1: GATHERED */}
                 {animPhase === 'division-gathered' && showTenFrame && (
                    <TenFrame 
                       value={currentProblem.operandA} 
                       color="text-sparkle-primary"
                       iconType="circle"
                       isResult={true}
                       layoutIdResolver={(i) => `dot-a-${i}`}
                       primaryEmoji={currentProblem.primaryEmoji} 
                    />
                 )}

                 {/* DIVISION PHASE 2: GROUPED */}
                 {animPhase === 'division-grouped' && showTenFrame && (
                    <DivisionGrid 
                       total={currentProblem.operandA}
                       groupCount={currentProblem.operandB}
                       color="text-sparkle-primary"
                       iconType="circle"
                       layoutIdResolver={(i) => `dot-a-${i}`} 
                       emoji={currentProblem.primaryEmoji}
                    />
                 )}
               </div>
            </div>
          </div>

          <div className="w-full max-w-md bg-white rounded-t-3xl shadow-[0_-5px_20px_rgba(0,0,0,0.05)] p-6 mt-auto">
            <div className="flex justify-center items-center gap-4 mb-6">
              <span className="text-3xl md:text-4xl font-bold text-gray-700">{currentProblem.operandA}</span>
              <span className="text-3xl md:text-4xl font-bold text-sparkle-primary">
                {getOpSymbolDisplay(selectedOperation)}
              </span>
              <span className="text-3xl md:text-4xl font-bold text-gray-700">{currentProblem.operandB}</span>
              <span className="text-3xl md:text-4xl font-bold text-gray-400">=</span>
              <motion.div 
                animate={feedback === 'wrong' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
                className={`
                h-16 min-w-[100px] rounded-2xl border-4 flex items-center justify-center text-3xl font-bold px-4
                ${feedback === 'wrong' ? 'border-red-400 bg-red-50 text-red-500' : 
                  feedback === 'correct' ? 'border-green-400 bg-green-50 text-green-600' : 
                  'border-sparkle-primary bg-gray-50 text-gray-800'}
              `}>
                {inputValue}
                {feedback === 'idle' && !inputValue && <span className="animate-pulse text-gray-300">?</span>}
              </motion.div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeypad(num)}
                  className="h-14 bg-gray-100 rounded-2xl font-bold text-xl text-gray-600 shadow-sm active:scale-95 transition-transform"
                >
                  {num}
                </button>
              ))}
              <button onClick={handleBackspace} className="h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-500 active:scale-95">
                <RotateCcw className="w-6 h-6" />
              </button>
              <button
                onClick={() => handleKeypad(0)}
                className="h-14 bg-gray-100 rounded-2xl font-bold text-xl text-gray-600 shadow-sm active:scale-95"
              >
                0
              </button>
              <button 
                onClick={feedback === 'correct' && canContinue ? () => loadNewProblem(selectedOperation, difficulty) : checkAnswer}
                disabled={(!inputValue && feedback === 'idle') || (feedback !== 'idle' && !canContinue)}
                className={`h-14 rounded-2xl flex items-center justify-center text-white shadow-md active:scale-95 disabled:opacity-50 transition-all duration-300
                  ${feedback === 'correct' && canContinue ? 'bg-blue-500' : 'bg-green-500'}
                `}
              >
                {feedback === 'correct' && canContinue ? <ArrowRight className="w-8 h-8" /> : <Check className="w-8 h-8" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-sparkle-bg font-sans overflow-hidden">
      {view === AppView.LOADING && (
         <div className="h-full w-full flex items-center justify-center">
            <span className="text-sparkle-primary font-bold text-xl animate-bounce">{t.loading}</span>
         </div>
      )}
      {view === AppView.REGISTRATION && <Registration onComplete={handleRegistrationComplete} lang={language} />}
      {view === AppView.DASHBOARD && renderDashboard()}
      {view === AppView.GAME && renderGame()}
      {view === AppView.SETTINGS && (
        <SettingsView
          onBack={() => setView(AppView.DASHBOARD)}
          onLogout={handleLogout}
          profile={userState.profile}
          onUpdateProfile={handleProfileUpdate}
          language={language}
          setLanguage={setLanguage}
        />
      )}
    </div>
  );
};

export default App;