import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, EyeOff, Heart } from 'lucide-react';
import lpBg from '../assets/lpBg.png';
import RulesModal from '../Components/RulesModal';

// 1. IMPORT YOUR PICTURES HERE
import pic1 from '../assets/tired.png';
import pic2 from '../assets/idont.png';
import pic3 from '../assets/pain.png';
import pic4 from '../assets/flowers.png';
import pic5 from '../assets/some.png';
import pic6 from '../assets/survive.png';

const LandingPage = () => {
  const navigate = useNavigate();
  const [showRules, setShowRules] = useState(false);

  const handleAcceptRules = () => {
    setShowRules(false);
    navigate('/home');
  };

  return (
    <div className="min-h-screen bg-stone-900 relative flex items-center justify-center overflow-hidden">
      
      {/* Background Image with WARM Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={lpBg} alt="Cozy Background" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/60 via-rose-950/30 to-stone-900/70 backdrop-blur-[3px]"></div>
      </div>

      {/* Background Floating Emojis */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <span className="absolute top-[15%] left-[15%] text-4xl opacity-40 animate-float">🌸</span>
        <span className="absolute top-[55%] left-[8%] text-5xl opacity-30 animate-float animation-delay-4000">🕯️</span>
        <span className="absolute top-[25%] right-[15%] text-4xl opacity-40 animate-float animation-delay-2000">🍃</span>
        <span className="absolute bottom-[25%] right-[8%] text-5xl opacity-30 animate-float">✨</span>
      </div>

      {/* ========================================== */}
      {/* LEFT SIDE PICTURES                         */}
      {/* ========================================== */}
      <div className="absolute left-[300px] top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10 pointer-events-none">
        <img 
          src={pic1} 
          alt="Aesthetic 1" 
          className="relative top-[150px] w-[300px] h-[400px] object-cover  opacity-85  hover:opacity-100 transition-opacity"
        />
        <img 
        src={pic2} 
        alt="Aesthetic 2" 
        // Added: relative left-[-60px] (Minus moves it further LEFT)
        className="relative left-[-250px] w-[450px] h-[500px] object-cover opacity-85 hover:opacity-100 transition-opacity"
      />
        <img 
          src={pic3}  
          alt="Aesthetic 2" 
          className="relative bottom-[150px] w-[300px] h-[400px] object-cover  opacity-85  hover:opacity-100 transition-opacity"
        />
      </div>

      {/* ========================================== */}
      {/* RIGHT SIDE PICTURES                        */}
      {/* ========================================== */}
      <div className="absolute right-[300px] top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-6 z-10 pointer-events-none">
        <img 
          src={pic4} 
          alt="Aesthetic 3" 
          className="relative top-[150px] w-[300px] h-[400px]  object-cover  opacity-85  hover:opacity-100 transition-opacity"
        />
        <img 
          src={pic5} 
          alt="Aesthetic 4" 
          className="relative right-[-250px]  w-[450px] h-[500px] object-cover  opacity-85   hover:opacity-100 transition-opacity"
        />
        <img 
          src={pic6} 
          alt="Aesthetic 2" 
          className="relative bottom-[150px]  w-[300px] h-[400px] object-cover  opacity-85  hover:opacity-100 transition-opacity"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
        <h1 className="text-7xl md:text-8xl font-bold text-amber-50 mb-4 tracking-tight drop-shadow-lg">
          Vent<span className="bg-gradient-to-r from-rose-300 to-amber-200 text-transparent bg-clip-text">Space</span>
        </h1>
        
        <p className="text-lg md:text-xl text-rose-100/90 mb-10 leading-relaxed font-light">
          A place to vent your thoughts, feelings, and emotions without fear. <br/> Let your mind breathe.
        </p>

        {/* Core Features Grid */}
        <div className="grid grid-cols-2 gap-4 mb-12">
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-rose-200/20 flex flex-col items-center gap-2 hover:bg-white/20 transition-all">
            <EyeOff className="text-rose-300" size={24} />
            <span className="text-amber-50 font-medium">Anonymous</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-rose-200/20 flex flex-col items-center gap-2 hover:bg-white/20 transition-all">
            <Shield className="text-amber-300" size={24} />
            <span className="text-amber-50 font-medium">Safe Space</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-rose-200/20 flex flex-col items-center gap-2 hover:bg-white/20 transition-all">
            <Users className="text-pink-300" size={24} />
            <span className="text-amber-50 font-medium">Real People</span>
          </div>
          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-rose-200/20 flex flex-col items-center gap-2 hover:bg-white/20 transition-all">
            <Heart className="text-red-300" size={24} />
            <span className="text-amber-50 font-medium">No Judgment</span>
          </div>
        </div>

        {/* Continue Button */}
        <button 
          onClick={() => setShowRules(true)}
          className="bg-gradient-to-r from-rose-400 to-amber-400 hover:from-rose-500 hover:to-amber-500 text-stone-900 px-10 py-4 rounded-full text-xl font-semibold transition-all shadow-2xl hover:shadow-rose-500/30 hover:scale-105 flex items-center gap-3 mx-auto"
        >
          Continue <span className="text-2xl">→</span>
        </button>

        <p className="mt-8 text-sm text-rose-200/60 italic">
          Step into a space that's all yours.
        </p>
      </div>

      <RulesModal 
        isOpen={showRules} 
        onClose={() => setShowRules(false)} 
        onAccept={handleAcceptRules} 
      />
    </div>
  );
};

export default LandingPage;