import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, X, Clock } from 'lucide-react';
import { fetchPostcards } from '../lib/api';
import { supabase } from '../lib/supabase';

// ── HELPERS ──────────────────────────────────────────────────────────────────
const timeAgo = (ts) => {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

const borderClass = {
  elegant: 'ring-4 ring-white/60',
  none: '',
  dashed: 'border-4 border-dashed border-white/60',
};

// ── MINI POSTCARD ─────────────────────────────────────────────────────────────
const MiniPostcard = ({ card, onClick }) => {
  const bgStyle = card.bgType === 'gradient'
    ? { background: card.bgGradient }
    : { background: card.bgColor };

  return (
    <div
      onClick={() => onClick(card)}
      className={`relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 cursor-pointer ${borderClass[card.borderStyle] || ''}`}
      style={{ ...bgStyle, fontFamily: card.font, color: card.textColor }}
    >
      {/* Corner ornaments */}
      <span className="absolute top-2 left-2 text-sm opacity-30 select-none">✦</span>
      <span className="absolute top-2 right-2 text-sm opacity-30 select-none">✦</span>

      <div className="px-6 py-5" style={{ textAlign: card.align }}>
        {/* TO */}
        <p className="text-xs font-bold opacity-70 mb-1 uppercase tracking-widest">To</p>
        <p className="text-base font-bold mb-3">{card.to}</p>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-3 opacity-40">
          <div className="flex-1 h-px" style={{ background: card.textColor }} />
          <span className="text-sm">💌</span>
          <div className="flex-1 h-px" style={{ background: card.textColor }} />
        </div>

        {/* MESSAGE */}
        {card.message && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap mb-3 opacity-90">
            {card.message.length > 160 ? card.message.slice(0, 160) + '…' : card.message}
          </p>
        )}

        {/* STICKERS */}
        {card.stickers?.length > 0 && (
          <div className="flex flex-wrap gap-0.5 justify-center text-lg mb-3">
            {card.stickers.slice(0, 8).map((s, i) => <span key={i}>{s}</span>)}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-2 mb-3 opacity-40">
          <div className="flex-1 h-px" style={{ background: card.textColor }} />
          <span className="text-sm">✨</span>
          <div className="flex-1 h-px" style={{ background: card.textColor }} />
        </div>

        {/* FROM */}
        <p className="text-xs font-bold opacity-70 mb-0.5 uppercase tracking-widest">From</p>
        <p className="text-sm font-bold italic">— {card.from}</p>
      </div>

      {/* Timestamp */}
      <div className="px-4 pb-3 flex items-center gap-1 justify-end opacity-50">
        <Clock size={11} />
        <span className="text-xs" style={{ color: card.textColor }}>{timeAgo(card.createdAt)}</span>
      </div>
    </div>
  );
};

// ── FULL POSTCARD MODAL ───────────────────────────────────────────────────────
const FullPostcardModal = ({ card, onClose }) => {
  if (!card) return null;

  const bgStyle = card.bgType === 'gradient'
    ? { background: card.bgGradient }
    : { background: card.bgColor };

  const fullBorderClass = {
    elegant: 'ring-8 ring-white/60 shadow-2xl',
    none: 'shadow-2xl',
    dashed: 'border-8 border-dashed border-white/70 shadow-2xl',
  }[card.borderStyle] || '';

  const postedDate = new Date(card.createdAt).toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const postedTime = new Date(card.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric', minute: '2-digit'
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-md bg-black/40" onClick={onClose}>
      
      {/* Container */}
      <div 
        className="relative w-full max-w-[600px] flex flex-col items-center"
        onClick={e => e.stopPropagation()}
      >
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-red-300 hover:scale-110 transition-all bg-black/20 hover:bg-black/40 rounded-full p-2"
        >
          <X size={24} />
        </button>

        {/* The Card */}
        <div
          className={`relative w-full rounded-3xl overflow-hidden transition-all duration-300 ${fullBorderClass}`}
          style={{
            ...bgStyle,
            minHeight: '420px',
            fontFamily: card.font,
            color: card.textColor,
          }}
        >
          {/* Decorative corner ornaments */}
          <div className="absolute top-4 left-4 text-2xl opacity-40 select-none">✦</div>
          <div className="absolute top-4 right-4 text-2xl opacity-40 select-none">✦</div>
          <div className="absolute bottom-4 left-4 text-2xl opacity-40 select-none">✦</div>
          <div className="absolute bottom-4 right-4 text-2xl opacity-40 select-none">✦</div>

          <div
            className="relative z-10 flex flex-col justify-between px-8 sm:px-12 py-10"
            style={{ minHeight: '420px', textAlign: card.align }}
          >
            {/* TO */}
            <div>
              <p className="text-lg font-semibold mb-1 opacity-90 italic">
                To: <span className="not-italic font-bold">{card.to}</span>
              </p>
            </div>

            {/* DIVIDER */}
            <div className="my-4 flex items-center gap-3 justify-center opacity-40">
              <div className="flex-1 h-px" style={{ background: card.textColor }} />
              <span className="text-xl">💌</span>
              <div className="flex-1 h-px" style={{ background: card.textColor }} />
            </div>

            {/* MESSAGE */}
            <div className="flex-1 flex items-center justify-center my-2">
              <p className="text-xl leading-relaxed whitespace-pre-wrap">
                {card.message}
              </p>
            </div>

            {/* STICKERS ROW */}
            {card.stickers?.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-center my-4 text-3xl">
                {card.stickers.map((s, i) => <span key={i}>{s}</span>)}
              </div>
            )}

            {/* DIVIDER */}
            <div className="my-4 flex items-center gap-3 justify-center opacity-40">
              <div className="flex-1 h-px" style={{ background: card.textColor }} />
              <span className="text-xl">✨</span>
              <div className="flex-1 h-px" style={{ background: card.textColor }} />
            </div>

            {/* FROM */}
            <div>
              <p className="text-base font-semibold opacity-90 italic">
                — <span className="font-bold">{card.from}</span>
              </p>
            </div>
          </div>
        </div>
        
        {/* Timestamp Below Card */}
        <div className="mt-4 text-white/90 bg-black/40 px-6 py-2 rounded-full backdrop-blur-sm text-sm font-medium flex items-center gap-2 shadow-lg">
          <Clock size={14} />
          Posted on {postedDate} at {postedTime}
        </div>

      </div>
    </div>
  );
};

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function PostcardWallPage() {
  const navigate = useNavigate();
  const [postcards, setPostcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await fetchPostcards();
      setPostcards(data);
      setLoading(false);
    };
    load();

    const channel = supabase
      .channel('postcard-wall-realtime')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'postcards' },
        async () => {
          const data = await fetchPostcards();
          setPostcards(data);
        })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = postcards.filter(c => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return c.to.toLowerCase().includes(q) || c.from.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 font-sans">

      {/* ── HEADER ── */}
      <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors flex-shrink-0"
          >
            <ArrowLeft size={18} /> Back to Feed
          </button>

          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-purple-300" size={16} />
              <input
                type="text"
                placeholder="Search by name (To or From)…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-full bg-white/80 border border-purple-100 focus:ring-2 focus:ring-purple-300 outline-none text-sm transition-all placeholder-purple-300"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/postcard')}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-semibold shadow hover:shadow-lg hover:scale-105 transition-all"
          >
            + Create Postcard
          </button>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text mb-2">
            💌 Postcard Wall
          </h1>
          <p className="text-gray-500 text-sm">
            {loading ? 'Loading postcards…' : `${filtered.length} postcard${filtered.length !== 1 ? 's' : ''}${query ? ` matching "${query}"` : ''}`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-purple-300 border-t-purple-600 animate-spin" />
            <p className="text-gray-400 font-medium">Loading postcards…</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-16 text-center shadow-sm border border-white/50 max-w-md mx-auto mt-8">
            <p className="text-5xl mb-4">💌</p>
            {query ? (
              <>
                <p className="text-gray-600 font-semibold text-lg mb-1">No postcards found</p>
                <p className="text-gray-400 text-sm">No results for "<strong>{query}</strong>". Try a different name.</p>
              </>
            ) : (
              <>
                <p className="text-gray-600 font-semibold text-lg mb-1">No postcards yet!</p>
                <p className="text-gray-400 text-sm mb-5">Be the first to share a heartfelt postcard.</p>
                <button
                  onClick={() => navigate('/postcard')}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-semibold text-sm hover:scale-105 transition-all shadow-lg"
                >
                  Create a Postcard
                </button>
              </>
            )}
          </div>
        )}

        {/* Postcard grid */}
        {!loading && filtered.length > 0 && (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-5 space-y-5">
            {filtered.map(card => (
              <div key={card.id} className="break-inside-avoid">
                <MiniPostcard card={card} onClick={setSelectedCard} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {selectedCard && (
        <FullPostcardModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
        />
      )}
    </div>
  );
}
