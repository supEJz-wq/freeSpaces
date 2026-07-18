import React from 'react';
import { Search, PenLine, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ openModal, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  return (
    <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text tracking-tight">
          VentSpace ✨
        </h1>
        
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative group">
            <Search className="absolute left-3 top-2.5 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
            <input 
              type="text" 
              placeholder="Search thoughts, moods, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm transition-all placeholder-purple-300"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/postcard')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-pink-200 text-pink-500 hover:bg-pink-50 hover:scale-105 transition-all"
          >
            <Mail size={16} /> Postcard
          </button>
          <button
            onClick={() => navigate('/postcard-wall')}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-purple-200 text-purple-500 hover:bg-purple-50 hover:scale-105 transition-all"
          >
            🖼️ Wall
          </button>
          <button 
            onClick={openModal}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-5 py-2 rounded-full flex items-center gap-2 font-medium transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            <PenLine size={18} /> Post Something
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;