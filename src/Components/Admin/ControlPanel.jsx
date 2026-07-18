import React, { useState } from 'react';
import { Settings, Timer, Lock, ShieldAlert, Plus, X } from 'lucide-react'; // Added ShieldAlert, Plus, X

const ControlPanel = ({ settings, onSettingsChange, isDarkMode, blacklistedWords, onAddWord, onRemoveWord }) => {
  const [newWord, setNewWord] = useState("");

  const handleAutoDeleteChange = (e) => {
    onSettingsChange({ ...settings, autoDeleteHours: Number(e.target.value) });
  };


  // NEW: Handle adding a bad word
  const handleAddBadWord = (e) => {
    e.preventDefault();
    if (newWord.trim()) {
      onAddWord(newWord.trim());
      setNewWord("");
    }
  };

  // Theme helpers for buttons and inputs
  const btnBase = isDarkMode ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-gray-100 text-gray-800 hover:bg-gray-200';
  const inputBase = isDarkMode ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-50 border-gray-400 text-gray-900';

  return (
    <div className={`rounded-2xl p-6 h-fit transition-colors duration-300 border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-gray-300 shadow-sm'}`}>
      <div className="flex items-center gap-2 mb-6">
        <Settings size={20} className={`${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`} />
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Control Panel</h2>
      </div>

      <div className="space-y-8">

        {/* Auto-Delete Timer */}
        <div>
          <label className={`flex items-center gap-2 text-sm font-extrabold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
            <Timer size={16} className={isDarkMode ? "text-blue-400" : "text-blue-600"} />
            Auto-Delete Timer (Hours)
          </label>
          <input
            type="number"
            min="1"
            max="72"
            value={settings.autoDeleteHours}
            onChange={handleAutoDeleteChange}
            className={`w-full px-4 py-2 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors font-bold ${inputBase}`}
          />
          <p className={`text-xs mt-1 font-semibold ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>Currently: Posts delete after {settings.autoDeleteHours} hours.</p>
        </div>

        {/* ========== NEW: BLACKLISTED WORDS MANAGER ========== */}
        <div>
          <label className={`flex items-center gap-2 text-sm font-extrabold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-800'}`}>
            <ShieldAlert size={16} className={isDarkMode ? "text-orange-400" : "text-orange-600"} />
            Blacklisted Words
          </label>
          <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Posts containing these words will be automatically hidden from the feed.</p>

          {/* Add Word Form */}
          <form onSubmit={handleAddBadWord} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Add bad word..."
              className={`flex-1 px-3 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${inputBase}`}
            />
            <button type="submit" className={`p-2 rounded-lg transition-colors ${btnBase}`}>
              <Plus size={18} />
            </button>
          </form>

          {/* List of Bad Words */}
          <div className="flex flex-wrap gap-2">
            {blacklistedWords.map(word => (
              <span key={word} className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-orange-900/30 text-orange-400 border border-orange-800/50' : 'bg-orange-100 text-orange-700 border border-orange-300'}`}>
                {word}
                <button onClick={() => onRemoveWord(word)} className="hover:text-red-500 transition-colors"><X size={14} /></button>
              </span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ControlPanel;