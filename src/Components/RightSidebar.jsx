import React from 'react';
import { TrendingUp, Award } from 'lucide-react';

// Removed the hardcoded 'trending' import - it now comes from Dashboard!

const RightSidebar = ({ activeTag, onTagClick, activeContributor, onContributorClick, topContributors, dynamicTrends }) => {
  return (
    <div className="space-y-6">
      
      {/* ========== TRENDING NOW SECTION ========== */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-white/30">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={20} className="text-pink-500" />
          <h2 className="font-semibold text-gray-700">Trending Now 🔥</h2>
        </div>
        <div className="space-y-3">
          {/* Check if we have dynamic trends to show */}
          {dynamicTrends.length > 0 ? (
            dynamicTrends.map((topic, i) => (
              <div 
                key={i} 
                onClick={() => onTagClick(topic)}
                className={`group cursor-pointer p-2 rounded-xl transition-colors ${activeTag === topic ? 'bg-purple-100 text-purple-700' : 'hover:bg-purple-50/50'}`}
              >
                <p className="font-medium text-sm group-hover:underline decoration-pink-400">{topic}</p>
              </div>
            ))
          ) : (
            // Empty state if no one has used a hashtag yet
            <p className="text-sm text-gray-400 italic">No trends yet. Start posting with #hashtags!</p>
          )}
        </div>
      </div>

      {/* ========== TOP CONTRIBUTORS SECTION ========== */}
      <div className="bg-white/50 backdrop-blur-xl rounded-3xl p-5 shadow-lg border border-white/30">
        <div className="flex items-center gap-2 mb-4">
          <Award size={20} className="text-yellow-500" />
          <h2 className="font-semibold text-gray-700">Top Contributors 🏆</h2>
        </div>
        <div className="space-y-4">
          {topContributors.map((user, i) => (
            <div 
              key={i} 
              onClick={() => onContributorClick(user.name)}
              className={`flex items-center justify-between group cursor-pointer p-1.5 rounded-lg transition-colors ${activeContributor === user.name ? 'bg-purple-100' : 'hover:bg-purple-50'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center text-purple-700 font-bold text-xs shadow-sm">
                  {user.name[0]}
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-purple-600 transition-colors">{user.name}</span>
              </div>
              <span className="text-xs bg-purple-100/80 text-purple-600 px-2.5 py-1 rounded-full border border-purple-200/50">
                {user.score} pts
              </span>
            </div>
          ))}
        </div>
      </div>
      
    </div>
  );
};

export default RightSidebar;