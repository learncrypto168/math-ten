import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, School, Calendar, BookOpen, ArrowRight, UserCheck, Gamepad2 } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { registerUser, loginUser } from '../services/db.ts';
import { TRANSLATIONS } from '../translations';

interface RegistrationProps {
  onComplete: (profile: UserProfile) => void;
  lang: Language;
}

const GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

const Registration: React.FC<RegistrationProps> = ({ onComplete, lang }) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const t = TRANSLATIONS[lang];
  
  const SCHOOLS = [
    "宣道會 台山陳元喜小學",
    t.otherSchool
  ];

  // Defaults
  // Default birthday: Current year - 9
  const getDefaultDate = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 9);
    return d.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState<{
    name: string;
    birthdayDate: string; // YYYY-MM-DD for input
    grade: string;
    school: string;
    avatar: string;
  }>({
    name: '',
    birthdayDate: getDefaultDate(),
    grade: 'P3',
    school: SCHOOLS[0],
    avatar: ''
  });

  const [preview, setPreview] = useState<string>('');
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setPreview(base64);
        setFormData(prev => ({ ...prev, avatar: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const formatBirthdayForDB = (dateStr: string) => {
    // YYYY-MM-DD -> YYYYMMDD
    return dateStr.replace(/-/g, '');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.birthdayDate || !formData.school) return;

    const profile: UserProfile = {
      name: formData.name,
      birthday: formatBirthdayForDB(formData.birthdayDate),
      grade: formData.grade,
      school: formData.school,
      avatar: formData.avatar
    };

    try {
      await registerUser(profile);
      onComplete(profile);
    } catch (err) {
      console.error("Failed to save user", err);
      setError(t.saveFailed);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const birthdayDB = formatBirthdayForDB(formData.birthdayDate);
      const user = await loginUser(formData.name, birthdayDB);
      
      if (user) {
        onComplete(user);
      } else {
        setError(t.userNotFound);
      }
    } catch (err) {
      console.error("Login failed", err);
      setError(t.loginError);
    }
  };

  const handleGuestMode = () => {
    const guestProfile: UserProfile = {
      name: t.guest,
      birthday: '20000101',
      grade: 'P1',
      school: 'Guest School',
      avatar: '' 
    };
    // Do not save to DB, just proceed
    onComplete(guestProfile);
  };

  const isRegisterValid = formData.name && formData.birthdayDate && formData.school;
  const isLoginValid = formData.name && formData.birthdayDate;

  return (
    <div className="min-h-full flex items-center justify-center p-6 bg-sparkle-bg overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-xl p-8 border-4 border-sparkle-primary/20 my-auto"
      >
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-sparkle-primary mb-2">{t.welcome}</h1>
          <p className="text-gray-500">
            {mode === 'register' ? t.letsKnowYou : t.welcomeBack}
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
          <button 
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'register' ? 'bg-white text-sparkle-primary shadow-sm' : 'text-gray-400'}`}
          >
            {t.register}
          </button>
          <button 
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${mode === 'login' ? 'bg-white text-sparkle-primary shadow-sm' : 'text-gray-400'}`}
          >
            {t.login}
          </button>
        </div>

        <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-5">
          
          {mode === 'register' && (
            /* Avatar Upload */
            <div className="flex flex-col items-center justify-center">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="relative w-28 h-28 rounded-full bg-gray-100 border-4 border-dashed border-sparkle-secondary cursor-pointer hover:bg-gray-50 transition-colors overflow-hidden flex items-center justify-center group"
              >
                {preview ? (
                  <img src={preview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-gray-400 group-hover:text-sparkle-secondary" />
                )}
                <div className="absolute bottom-0 w-full bg-black/40 text-white text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {t.uploadPhoto}
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          )}

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-600 pl-1">{t.yourName}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t.namePlaceholder}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-sparkle-primary focus:outline-none transition-colors"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          {/* Birthday Date Picker */}
          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-600 pl-1">{t.birthday}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-sparkle-primary focus:outline-none transition-colors"
                value={formData.birthdayDate}
                onChange={e => setFormData({...formData, birthdayDate: e.target.value})}
              />
            </div>
          </div>

          <AnimatePresence>
            {mode === 'register' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-5 overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-4">
                  {/* Grade */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600 pl-1">{t.grade}</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-sparkle-primary focus:outline-none transition-colors appearance-none"
                        value={formData.grade}
                        onChange={e => setFormData({...formData, grade: e.target.value})}
                      >
                        {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* School Dropdown */}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-600 pl-1">{t.school}</label>
                    <div className="relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <select
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border-2 border-gray-100 focus:border-sparkle-primary focus:outline-none transition-colors appearance-none text-sm"
                        value={formData.school}
                        onChange={e => setFormData({...formData, school: e.target.value})}
                      >
                        {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="text-red-500 text-sm text-center font-bold bg-red-50 p-2 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={mode === 'register' ? !isRegisterValid : !isLoginValid}
              className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center space-x-2 transition-all transform active:scale-95 shadow-md
                ${(mode === 'register' ? isRegisterValid : isLoginValid)
                  ? 'bg-gradient-to-r from-sparkle-primary to-sparkle-secondary text-white shadow-sparkle-primary/30' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
              `}
            >
              {mode === 'register' ? (
                <><span>{t.startAdventure}</span><ArrowRight className="w-5 h-5" /></>
              ) : (
                <><span>{t.login}</span><UserCheck className="w-5 h-5" /></>
              )}
            </button>

            <button
              type="button"
              onClick={handleGuestMode}
              className="w-full py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-center space-x-2 border border-gray-200"
            >
              <span>{t.guestMode}</span>
              <Gamepad2 className="w-4 h-4" />
            </button>
          </div>

        </form>
      </motion.div>
    </div>
  );
};

export default Registration;