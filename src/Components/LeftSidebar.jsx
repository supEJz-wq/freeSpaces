import React from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { moods } from '../Data/mockData';

const COLORS = { Happy: "#FFD700", Sad: "#6CA6CD", Hopeful: "#77DD77", Anxious: "#B19CD9", Angry: "#FF6961" };

const LeftSidebar = ({ activeMood, setActiveMood, moodData }) => {
  return (
    <div className="space-y-6">
      {/* Mood Filter */}
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-5 shadow-sm border border-white/50">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">Mood Filter:</h2>
        <div className="space-y-2">
          {moods.map((mood) => (
            <button 
              key={mood.name}
              onClick={() => setActiveMood(mood.name)}
              className={`w-full text-left px-4 py-3 rounded-2xl flex items-center justify-between gap-3 transition-all duration-300 group ${
                activeMood === mood.name
                  ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 font-medium shadow-sm' 
                  : 'hover:bg-white/60 text-gray-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">{mood.icon}</span> 
                <span className="text-sm">{mood.name}</span>
              </div>
              {/* Show count next to mood */}
              {moodData.find(m => m.name === mood.name) && (
                <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full">
                  {moodData.find(m => m.name === mood.name).count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Mood Pie Chart */}
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-5 shadow-sm border border-white/50">
        <h2 className="font-semibold text-gray-700 mb-2">Today's Vibe </h2>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={moodData.filter(m => m.count > 0)} innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value" nameKey="name">
                {moodData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name]} className="stroke-white stroke-2" />
                ))}
              </Pie>
              <Tooltip formatter={(value, name) => [`${value}%`, name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
          {moodData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 bg-white/50 rounded-lg p-1.5">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[entry.name] }}></span>
              <span className="text-gray-600 font-medium">{entry.name} {entry.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeftSidebar;