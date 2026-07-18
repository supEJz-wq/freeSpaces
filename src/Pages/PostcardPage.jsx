import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';
import { ArrowLeft, Download, RotateCcw, Palette, Type, AlignLeft, AlignCenter, AlignRight, Globe, CheckCircle } from 'lucide-react';
import { sharePostcardDB } from '../lib/api';

// ── PRESET COLORS ────────────────────────────────────────────────────────────
const BG_PRESETS = [
  { label: 'Rose Blush',   value: '#fce7f3' },
  { label: 'Lavender',     value: '#ede9fe' },
  { label: 'Sky Blue',     value: '#e0f2fe' },
  { label: 'Mint',         value: '#d1fae5' },
  { label: 'Peach',        value: '#ffedd5' },
  { label: 'Lemon',        value: '#fef9c3' },
  { label: 'Slate',        value: '#1e293b' },
  { label: 'Night Purple', value: '#2e1065' },
  { label: 'Deep Rose',    value: '#881337' },
  { label: 'Forest',       value: '#14532d' },
  { label: 'White',        value: '#ffffff' },
  { label: 'Cream',        value: '#fdf6e3' },
];

const TEXT_PRESETS = [
  { label: 'Charcoal',  value: '#1f2937' },
  { label: 'White',     value: '#ffffff' },
  { label: 'Rose',      value: '#e11d48' },
  { label: 'Purple',    value: '#7c3aed' },
  { label: 'Sky',       value: '#0284c7' },
  { label: 'Amber',     value: '#d97706' },
  { label: 'Emerald',   value: '#059669' },
  { label: 'Pink',      value: '#db2777' },
];

const GRADIENT_PRESETS = [
  { label: 'Sunset',     value: 'linear-gradient(135deg, #f9a8d4, #fbbf24)' },
  { label: 'Ocean',      value: 'linear-gradient(135deg, #bae6fd, #6d28d9)' },
  { label: 'Aurora',     value: 'linear-gradient(135deg, #6ee7b7, #818cf8)' },
  { label: 'Flamingo',   value: 'linear-gradient(135deg, #fda4af, #c084fc)' },
  { label: 'Midnight',   value: 'linear-gradient(135deg, #0f172a, #4f46e5)' },
  { label: 'Golden',     value: 'linear-gradient(135deg, #fef3c7, #f59e0b)' },
  { label: 'Cherry',     value: 'linear-gradient(135deg, #fce7f3, #be185d)' },
  { label: 'Forest',     value: 'linear-gradient(135deg, #d1fae5, #065f46)' },
];

const FONTS = [
  { label: 'Elegant',    value: "'Georgia', serif" },
  { label: 'Modern',     value: "'Inter', sans-serif" },
  { label: 'Playful',    value: "'Comic Sans MS', cursive" },
  { label: 'Classic',    value: "'Times New Roman', serif" },
];

const STICKERS = ['🌸', '💌', '✨', '🌹', '🦋', '🌙', '❤️', '🌿', '🍃', '🕊️', '🌼', '💫', '🎀', '🌺', '🫶'];

const DEFAULT_STATE = {
  to: '',
  from: '',
  message: '',
  bgType: 'solid',         // 'solid' | 'gradient'
  bgColor: '#fce7f3',
  bgGradient: 'linear-gradient(135deg, #f9a8d4, #fbbf24)',
  textColor: '#1f2937',
  font: "'Georgia', serif",
  align: 'center',
  stickers: [],            // placed sticker emojis
  borderStyle: 'elegant',  // 'elegant' | 'none' | 'dashed'
};

export default function PostcardPage() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const [card, setCard] = useState(DEFAULT_STATE);
  const [activeTab, setActiveTab] = useState('content');
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState(null); // { type: 'success'|'error', msg }

  const set = (key, val) => setCard(prev => ({ ...prev, [key]: val }));

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `postcard-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  // ── SHARE TO WALL ─────────────────────────────────────────────────────────
  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleShare = async () => {
    if (!card.to.trim() || !card.from.trim()) {
      showToast('error', 'Please fill in both To and From fields before sharing.');
      return;
    }
    
    // Get or create device ID
    let deviceId = localStorage.getItem('freespace_device_id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('freespace_device_id', deviceId);
    }

    setSharing(true);
    try {
      const result = await sharePostcardDB({ ...card, deviceId });
      
      if (result.error === 'LIMIT_REACHED') {
        showToast('error', 'Limit reached! You can share 5 postcards per 24 hours.');
      } else if (result.error) {
        showToast('error', 'Failed to share. Please try again.');
      } else {
        showToast('success', 'Postcard shared to the Wall! 🎉');
      }
    } finally {
      setSharing(false);
    }
  };

  // ── BACKGROUND STYLE ─────────────────────────────────────────────────────
  const bgStyle = card.bgType === 'gradient'
    ? { background: card.bgGradient }
    : { background: card.bgColor };

  const borderClass = {
    elegant: 'ring-4 ring-white/60 shadow-2xl',
    none: 'shadow-lg',
    dashed: 'border-4 border-dashed border-white/70 shadow-xl',
  }[card.borderStyle];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 font-sans">

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl text-sm font-semibold transition-all
          ${ toast.type === 'success'
            ? 'bg-emerald-500 text-white'
            : 'bg-red-500 text-white'}`}
        >
          {toast.type === 'success' && <CheckCircle size={16} />}
          {toast.msg}
          {toast.type === 'success' && (
            <button
              onClick={() => navigate('/postcard-wall')}
              className="ml-2 underline font-bold opacity-90 hover:opacity-100"
            >
              View Wall →
            </button>
          )}
        </div>
      )}

      {/* ── HEADER ── */}
      <header className="bg-white/60 backdrop-blur-md shadow-sm border-b border-white/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-800 font-medium transition-colors"
          >
            <ArrowLeft size={18} /> Back to Feed
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 text-transparent bg-clip-text">
            💌 Postcard Creator
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCard(DEFAULT_STATE)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 border border-gray-200 transition-all"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60"
            >
              <Globe size={16} />
              {sharing ? 'Sharing…' : 'Share to Wall'}
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-60"
            >
              <Download size={16} />
              {downloading ? 'Saving…' : 'Download'}
            </button>
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 items-start">

        {/* ══ LEFT: EDITOR ══ */}
        <div className="w-full lg:w-[420px] flex-shrink-0">
          <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-lg border border-white/60 overflow-hidden">

            {/* Tab switcher */}
            <div className="flex border-b border-purple-100">
              {[
                { id: 'content', icon: <AlignLeft size={15}/>, label: 'Content' },
                { id: 'style',   icon: <Palette   size={15}/>, label: 'Style'   },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-all
                    ${activeTab === tab.id
                      ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-purple-500'}`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">

              {/* ── CONTENT TAB ── */}
              {activeTab === 'content' && (
                <>
                  {/* To */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">To</label>
                    <input
                      type="text"
                      placeholder="e.g. My dearest friend…"
                      value={card.to}
                      onChange={e => set('to', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:ring-2 focus:ring-purple-300 outline-none text-sm transition-all"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Message</label>
                    <textarea
                      placeholder="Write your heartfelt message here…"
                      value={card.message}
                      onChange={e => set('message', e.target.value)}
                      rows={6}
                      className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:ring-2 focus:ring-purple-300 outline-none text-sm resize-none transition-all"
                    />
                  </div>

                  {/* From */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">From</label>
                    <input
                      type="text"
                      placeholder="e.g. With love, Alex"
                      value={card.from}
                      onChange={e => set('from', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-purple-100 focus:ring-2 focus:ring-purple-300 outline-none text-sm transition-all"
                    />
                  </div>

                  {/* Stickers */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Add Stickers</label>
                    <div className="flex flex-wrap gap-2">
                      {STICKERS.map(s => (
                        <button
                          key={s}
                          onClick={() => set('stickers', [...card.stickers, s])}
                          className="text-2xl hover:scale-125 transition-transform"
                          title="Add sticker"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {card.stickers.length > 0 && (
                      <button
                        onClick={() => set('stickers', [])}
                        className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
                      >
                        Clear stickers ✕
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* ── STYLE TAB ── */}
              {activeTab === 'style' && (
                <>
                  {/* Bg type toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Background</label>
                    <div className="flex gap-2 mb-3">
                      {['solid', 'gradient'].map(t => (
                        <button
                          key={t}
                          onClick={() => set('bgType', t)}
                          className={`flex-1 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize
                            ${card.bgType === t
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {card.bgType === 'solid' ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {BG_PRESETS.map(c => (
                            <button
                              key={c.value}
                              onClick={() => set('bgColor', c.value)}
                              title={c.label}
                              className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110
                                ${card.bgColor === c.value ? 'border-purple-500 scale-110 ring-2 ring-purple-300' : 'border-white shadow-md'}`}
                              style={{ background: c.value }}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <label className="text-xs text-gray-400">Custom:</label>
                          <input
                            type="color"
                            value={card.bgColor}
                            onChange={e => set('bgColor', e.target.value)}
                            className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0"
                          />
                          <span className="text-xs font-mono text-gray-400">{card.bgColor}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {GRADIENT_PRESETS.map(g => (
                          <button
                            key={g.value}
                            onClick={() => set('bgGradient', g.value)}
                            title={g.label}
                            className={`w-10 h-10 rounded-xl transition-all hover:scale-110 shadow-md
                              ${card.bgGradient === g.value ? 'ring-2 ring-purple-500 scale-110' : ''}`}
                            style={{ background: g.value }}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Text Color */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      <span className="flex items-center gap-1"><Type size={13}/> Text Color</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {TEXT_PRESETS.map(c => (
                        <button
                          key={c.value}
                          onClick={() => set('textColor', c.value)}
                          title={c.label}
                          className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110
                            ${card.textColor === c.value ? 'border-purple-500 scale-110 ring-2 ring-purple-300' : 'border-gray-200 shadow-sm'}`}
                          style={{ background: c.value }}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <label className="text-xs text-gray-400">Custom:</label>
                      <input
                        type="color"
                        value={card.textColor}
                        onChange={e => set('textColor', e.target.value)}
                        className="w-10 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <span className="text-xs font-mono text-gray-400">{card.textColor}</span>
                    </div>
                  </div>

                  {/* Font */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Font Style</label>
                    <div className="grid grid-cols-2 gap-2">
                      {FONTS.map(f => (
                        <button
                          key={f.value}
                          onClick={() => set('font', f.value)}
                          className={`py-2 px-3 rounded-xl text-sm border transition-all
                            ${card.font === f.value
                              ? 'bg-purple-100 border-purple-400 text-purple-700 font-semibold'
                              : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'}`}
                          style={{ fontFamily: f.value }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Align */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Text Alignment</label>
                    <div className="flex gap-2">
                      {[
                        { val: 'left',   icon: <AlignLeft   size={16}/> },
                        { val: 'center', icon: <AlignCenter size={16}/> },
                        { val: 'right',  icon: <AlignRight  size={16}/> },
                      ].map(a => (
                        <button
                          key={a.val}
                          onClick={() => set('align', a.val)}
                          className={`flex-1 flex items-center justify-center py-2 rounded-xl border transition-all
                            ${card.align === a.val
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}
                        >
                          {a.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Border */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Border Style</label>
                    <div className="flex gap-2">
                      {['none', 'elegant', 'dashed'].map(b => (
                        <button
                          key={b}
                          onClick={() => set('borderStyle', b)}
                          className={`flex-1 py-1.5 rounded-xl text-sm border capitalize transition-all
                            ${card.borderStyle === b
                              ? 'bg-purple-500 text-white border-purple-500'
                              : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ══ RIGHT: LIVE PREVIEW ══ */}
        <div className="flex-1 flex flex-col items-center">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Live Preview</p>

          {/* Postcard card */}
          <div
            ref={cardRef}
            className={`relative w-full max-w-[600px] rounded-3xl overflow-hidden transition-all duration-300 ${borderClass}`}
            style={{
              ...bgStyle,
              minHeight: '380px',
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
              className="relative z-10 flex flex-col justify-between px-12 py-10"
              style={{ minHeight: '380px', textAlign: card.align }}
            >
              {/* TO */}
              <div>
                {card.to ? (
                  <p className="text-lg font-semibold mb-1 opacity-90 italic">
                    To: <span className="not-italic font-bold">{card.to}</span>
                  </p>
                ) : (
                  <p className="text-lg opacity-30 italic">To: …</p>
                )}
              </div>

              {/* DIVIDER */}
              <div className="my-4 flex items-center gap-3 justify-center opacity-40">
                <div className="flex-1 h-px" style={{ background: card.textColor }} />
                <span className="text-lg">💌</span>
                <div className="flex-1 h-px" style={{ background: card.textColor }} />
              </div>

              {/* MESSAGE */}
              <div className="flex-1 flex items-center justify-center my-2">
                {card.message ? (
                  <p className="text-xl leading-relaxed whitespace-pre-wrap">
                    {card.message}
                  </p>
                ) : (
                  <p className="text-xl opacity-30 italic">Your message appears here…</p>
                )}
              </div>

              {/* STICKERS ROW */}
              {card.stickers.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center my-3 text-2xl">
                  {card.stickers.map((s, i) => <span key={i}>{s}</span>)}
                </div>
              )}

              {/* DIVIDER */}
              <div className="my-4 flex items-center gap-3 justify-center opacity-40">
                <div className="flex-1 h-px" style={{ background: card.textColor }} />
                <span className="text-lg">✨</span>
                <div className="flex-1 h-px" style={{ background: card.textColor }} />
              </div>

              {/* FROM */}
              <div>
                {card.from ? (
                  <p className="text-base font-semibold opacity-90 italic">
                    — <span className="font-bold">{card.from}</span>
                  </p>
                ) : (
                  <p className="text-base opacity-30 italic">— From: …</p>
                )}
              </div>
            </div>
          </div>

          {/* Download hint */}
          <p className="mt-4 text-xs text-gray-400 text-center">
            Click <strong>Download</strong> to save your postcard as an image 🖼️
          </p>
        </div>

      </div>
    </div>
  );
}
