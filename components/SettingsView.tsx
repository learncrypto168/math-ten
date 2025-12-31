import React, { useRef, useState } from 'react';
import { ArrowLeft, Languages, User, Camera, Save, LogOut } from 'lucide-react';
import { UserProfile, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { updateUser, logoutUser } from '../services/db';

interface SettingsViewProps {
  onBack: () => void;
  onLogout: () => void;
  profile?: UserProfile;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onLogout,
  profile,
  onUpdateProfile,
  language,
  setLanguage
}) => {
  const t = TRANSLATIONS[language];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editAvatar, setEditAvatar] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    if (profile && profile.id && editAvatar) {
      await updateUser(profile.id, { avatar: editAvatar });
      onUpdateProfile({ avatar: editAvatar });
    }
    onBack();
  };
  
  const handleLogoutClick = () => {
    logoutUser();
    onLogout();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100">
          <ArrowLeft className="w-6 h-6 text-gray-500" />
        </button>
        <h2 className="text-xl font-bold text-gray-700">{t.settings}</h2>
        <div className="w-10"></div>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto">
        {/* Language Switcher */}
        <div className="space-y-3">
           <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
              <Languages className="w-4 h-4" />
              {t.language}
           </label>
           <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
               onClick={() => setLanguage('zh-TW')}
               className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${language === 'zh-TW' ? 'bg-white text-sparkle-primary shadow-sm' : 'text-gray-400'}`}
             >
               中文
             </button>
             <button 
               onClick={() => setLanguage('en')}
               className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${language === 'en' ? 'bg-white text-sparkle-primary shadow-sm' : 'text-gray-400'}`}
             >
               English
             </button>
           </div>
        </div>

        {/* Edit Profile */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-gray-500 flex items-center gap-2">
              <User className="w-4 h-4" />
              {t.editProfile}
          </label>
          <div className="flex flex-col items-center">
             <div 
               onClick={() => profile?.id && fileInputRef.current?.click()}
               className={`relative w-28 h-28 rounded-full border-4 border-dashed border-gray-200 overflow-hidden flex items-center justify-center group ${profile?.id ? 'cursor-pointer hover:border-sparkle-primary' : 'opacity-50'}`}
             >
               {editAvatar || profile?.avatar ? (
                 <img src={editAvatar || profile?.avatar} alt="Avatar" className="w-full h-full object-cover" />
               ) : (
                 <User className="w-10 h-10 text-gray-300" />
               )}
               {profile?.id && (
                  <div className="absolute bottom-0 w-full bg-black/50 text-white text-[10px] text-center py-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                     <Camera className="w-3 h-3 mr-1" />
                  </div>
               )}
             </div>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                accept="image/*" 
                className="hidden" 
             />
             {profile?.id ? (
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-sm text-sparkle-primary font-bold"
               >
                 {t.changeAvatar}
               </button>
             ) : (
               <p className="mt-2 text-xs text-gray-400">Guest accounts cannot change avatar</p>
             )}
          </div>
        </div>

        <button 
          onClick={saveSettings}
          className="w-full bg-sparkle-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-sparkle-primary/30 active:scale-95 transition-transform"
        >
           <Save className="w-5 h-5" />
           {t.save}
        </button>
        
        <div className="pt-8 border-t border-gray-100">
           <button 
             onClick={handleLogoutClick}
             className="w-full bg-red-50 text-red-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
           >
             <LogOut className="w-5 h-5" />
             {t.logout}
           </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;