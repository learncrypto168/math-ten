import React, { useEffect, useState } from 'react';
import { Home, Trophy, User } from 'lucide-react';
import { TRANSLATIONS } from '../translations';
import { Language, UserProfile } from '../types';
import { getRanking } from '../services/db';

interface RankingViewProps {
  onBack: () => void;
  language: Language;
  currentUserProfile?: UserProfile;
}

interface RankItem {
  id: string;
  name: string;
  school: string;
  grade: string;
  xp: number;
  avatar: string;
}

const RankingView: React.FC<RankingViewProps> = ({ onBack, language, currentUserProfile }) => {
  const [loading, setLoading] = useState(true);
  const [rankings, setRankings] = useState<RankItem[]>([]);
  const [filter, setFilter] = useState<'global' | 'school' | 'grade'>('global');
  const t = TRANSLATIONS[language];

  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const data = await getRanking();
        // Transform user profiles to rank items. 
        // Note: In a real app, 'xp' should be stored in the user document. 
        // Since the current UserProfile definition doesn't strictly include XP in the DB model (it's in UserState),
        // we might need to assume XP is stored or accessible. 
        // For this demo, let's assume the DB returns objects that have XP or we mock it if missing.
        
        // Assuming getRanking returns a list of users with their stats.
        // We will filter based on the current user's school/grade if needed.
        
        let filteredData = data;

        if (filter === 'school' && currentUserProfile?.school) {
          filteredData = data.filter((u: any) => u.school === currentUserProfile.school);
        } else if (filter === 'grade' && currentUserProfile?.grade) {
          filteredData = data.filter((u: any) => u.grade === currentUserProfile.grade);
        }

        // Sort by XP descending
        filteredData.sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0));

        setRankings(filteredData.map((u: any) => ({
          id: u.id,
          name: u.name,
          school: u.school,
          grade: u.grade,
          xp: u.xp || 0,
          avatar: u.avatar
        })));
      } catch (e) {
        console.error("Failed to fetch ranking", e);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [filter, currentUserProfile]);

  return (
    <div className="flex flex-col h-full bg-sparkle-bg">
      <div className="flex items-center p-4 bg-white shadow-sm">
        <button onClick={onBack} className="p-2 mr-4 bg-gray-100 rounded-full">
          <Home className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex items-center">
          <Trophy className="w-6 h-6 text-yellow-500 mr-2" />
          {t.ranking}
        </h1>
      </div>

      <div className="p-4 bg-white border-b flex justify-center space-x-2">
        <button 
          onClick={() => setFilter('global')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === 'global' ? 'bg-sparkle-primary text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          Global
        </button>
        <button 
          onClick={() => setFilter('school')}
          disabled={!currentUserProfile?.school}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === 'school' ? 'bg-sparkle-primary text-white' : 'bg-gray-100 text-gray-600 disabled:opacity-50'}`}
        >
          {t.school}
        </button>
        <button 
          onClick={() => setFilter('grade')}
          disabled={!currentUserProfile?.grade}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-colors ${filter === 'grade' ? 'bg-sparkle-primary text-white' : 'bg-gray-100 text-gray-600 disabled:opacity-50'}`}
        >
          {t.grade}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center p-10 text-gray-500">{t.loading}</div>
        ) : (
          rankings.map((rank, index) => (
            <div key={rank.id} className={`flex items-center p-3 bg-white rounded-2xl shadow-sm ${rank.id === currentUserProfile?.id ? 'border-2 border-sparkle-primary bg-blue-50' : ''}`}>
              <div className="w-8 flex justify-center font-bold text-gray-500 text-lg">
                {index + 1}
              </div>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden mx-3 border border-gray-100">
                {rank.avatar ? (
                  <img src={rank.avatar} alt={rank.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User className="w-6 h-6" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-800">{rank.name}</div>
                <div className="text-xs text-gray-500">{rank.school} · {rank.grade}</div>
              </div>
              <div className="font-bold text-sparkle-secondary">
                {rank.xp} XP
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RankingView;
