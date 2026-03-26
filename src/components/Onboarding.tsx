import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Zap, User, Home, BookOpen, Trophy, Settings, Search, ChevronRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import confetti from 'canvas-confetti';

interface OnboardingData {
  nativeLanguage: string;
  targetLanguage: string;
  explanationLanguage: string;
  interests: string[];
  level: string;
  areas: string[];
  goal: string;
  practiceTime: string;
  name: string;
}

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { id: 'bn', name: 'Bengali', native: 'বাংলা', flag: '🇮🇳' },
  { id: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { id: 'mr', name: 'Marathi', native: 'मराठी', flag: '🇮🇳' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati', native: 'ગુજરાતી', flag: '🇮🇳' },
];

const LEVELS = [
  { id: 'beginner', title: 'Beginner', desc: 'Starting from scratch', duration: '3 months' },
  { id: 'intermediate', title: 'Intermediate', desc: 'Can hold basic conversations', duration: '6 months' },
  { id: 'advanced', title: 'Advanced', desc: 'Fluent & professional', duration: '12 months' },
];

const INTERESTS = [
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'culture', name: 'Culture', icon: '🎨' },
  { id: 'tech', name: 'Technology', icon: '💻' },
  { id: 'food', name: 'Food', icon: '🍳' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'movies', name: 'Movies', icon: '🎬' },
  { id: 'gaming', name: 'Gaming', icon: '🎮' },
  { id: 'fashion', name: 'Fashion', icon: '👗' },
  { id: 'photography', name: 'Photography', icon: '📷' },
  { id: 'art', name: 'Art', icon: '🖌️' },
  { id: 'science', name: 'Science', icon: '🔬' },
  { id: 'history', name: 'History', icon: '📜' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
  { id: 'fitness', name: 'Fitness', icon: '🏋️' },
  { id: 'reading', name: 'Reading', icon: '📚' },
  { id: 'writing', name: 'Writing', icon: '✍️' },
  { id: 'politics', name: 'Politics', icon: '🏛️' },
  { id: 'finance', name: 'Finance', icon: '💰' },
];

const AREAS = [
  { id: 'speaking', title: 'Speaking', name: 'Speaking', icon: '🗣️' },
  { id: 'listening', title: 'Listening', name: 'Listening', icon: '👂' },
  { id: 'writing', title: 'Writing', name: 'Writing', icon: '✍️' },
  { id: 'reading', title: 'Reading', name: 'Reading', icon: '📖' },
  { id: 'vocabulary', title: 'Vocabulary', name: 'Vocabulary', icon: '📚' },
  { id: 'grammar', title: 'Grammar', name: 'Grammar', icon: '📝' },
];

const GOALS = [
  { id: 'casual', title: 'Casual (5m/day)', duration: 5 },
  { id: 'regular', title: 'Regular (15m/day)', duration: 15 },
  { id: 'serious', title: 'Serious (30m/day)', duration: 30 },
  { id: 'intense', title: 'Intense (60m/day)', duration: 60 },
];

const RobotAvatar = () => (
  <motion.div 
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center relative mb-4"
  >
    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center neon-glow-primary">
      <Zap className="w-8 h-8 text-white" />
    </div>
    <motion.div 
      animate={{ scale: [1, 1.2, 1] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute -top-1 -right-1 w-6 h-6 bg-emerald rounded-full border-4 border-bg-deep"
    />
  </motion.div>
);

const ChatBubble = ({ children, isUser = false, delay = 0 }: { children: React.ReactNode, isUser?: boolean, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, x: isUser ? 20 : -20, scale: 0.8 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    transition={{ delay }}
    className={cn(
      "max-w-[85%] p-4 rounded-2xl text-sm font-medium mb-2",
      isUser 
        ? "bg-primary text-white self-end rounded-tr-none" 
        : "bg-bg-surface text-text-bright self-start rounded-tl-none border border-border/50"
    )}
  >
    {children}
  </motion.div>
);

export const Onboarding = ({ onComplete }: { onComplete: (data: OnboardingData) => void, key?: string }) => {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({ 
    nativeLanguage: '', 
    targetLanguage: '', 
    explanationLanguage: '',
    interests: [],
    level: '',
    areas: [],
    goal: '',
    practiceTime: '19:30',
    name: '' 
  });
  const [showMoreInterests, setShowMoreInterests] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [personalizingProgress, setPersonalizingProgress] = useState(0);

  const nextStep = () => {
    setStep(s => s + 1);
  };

  useEffect(() => {
    if (step === 11) {
      const interval = setInterval(() => {
        setPersonalizingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 1;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const finishOnboarding = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff6b35', '#ffd166', '#00d68f']
    });
    onComplete(data);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-6 relative overflow-hidden bg-bg-deep">
      {/* Progress Bar */}
      {step > 0 && step < 12 && (
        <div className="fixed top-0 left-0 w-full h-1 bg-bg-surface z-50">
          <motion.div 
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 11) * 100}%` }}
          />
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center justify-center min-h-screen text-center space-y-8 z-10"
          >
            <div className="flex flex-col items-center justify-center relative">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 15, stiffness: 150 }}
                className="flex flex-col items-center"
              >
                <h1 className="text-8xl md:text-[12rem] font-display font-black tracking-tighter text-primary leading-none">
                  FLUEN
                </h1>
                <h1 className="text-8xl md:text-[12rem] font-display font-black tracking-tighter text-white leading-none -mt-4 md:-mt-8">
                  TA
                </h1>
              </motion.div>
              
              {/* Shockwave Ripple */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 4], opacity: [0.5, 0] }}
                transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
                className="absolute inset-0 m-auto w-24 h-24 border-4 border-primary rounded-full pointer-events-none"
              />
            </div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl md:text-2xl font-heading text-text-mid italic"
            >
              "Speak English. Own the Room."
            </motion.p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextStep}
              className="px-12 py-4 bg-primary rounded-full font-bold text-lg neon-glow-primary relative overflow-hidden group"
            >
              <span className="relative z-10">Begin Your Journey →</span>
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </motion.div>
        )}

        {step >= 1 && step <= 10 && (
          <motion.div
            key="chat-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg flex flex-col h-full pt-12"
          >
            <div className="flex flex-col items-center mb-8">
              <RobotAvatar />
              <ChatBubble delay={0.2}>
                Great to meet you! I'm your AI tutor. I'd love to ask some questions to know you better.
              </ChatBubble>
            </div>

            <div className="flex flex-col space-y-4 flex-1 overflow-y-auto pb-32 no-scrollbar">
              {/* Step 1: Name */}
              {step >= 1 && (
                <>
                  <ChatBubble delay={0.4}>What's your name?</ChatBubble>
                  {data.name && <ChatBubble isUser>{data.name}</ChatBubble>}
                </>
              )}

              {/* Step 2: Native Language */}
              {step >= 2 && (
                <>
                  <ChatBubble delay={0.2}>What's your native language?</ChatBubble>
                  {data.nativeLanguage && <ChatBubble isUser>{LANGUAGES.find(l => l.id === data.nativeLanguage)?.name}</ChatBubble>}
                </>
              )}

              {/* Step 3: Target Language */}
              {step >= 3 && (
                <>
                  <ChatBubble delay={0.2}>Which language would you like to learn?</ChatBubble>
                  {data.targetLanguage && <ChatBubble isUser>{LANGUAGES.find(l => l.id === data.targetLanguage)?.name}</ChatBubble>}
                </>
              )}

              {/* Step 4: Explanation Language */}
              {step >= 4 && (
                <>
                  <ChatBubble delay={0.2}>
                    Do you want to learn {LANGUAGES.find(l => l.id === data.targetLanguage)?.name} with explanations in {LANGUAGES.find(l => l.id === data.nativeLanguage)?.name} or in {LANGUAGES.find(l => l.id === data.targetLanguage)?.name}?
                  </ChatBubble>
                  {data.explanationLanguage && <ChatBubble isUser>{LANGUAGES.find(l => l.id === data.explanationLanguage)?.name}</ChatBubble>}
                </>
              )}

              {/* Step 5: Interests */}
              {step >= 5 && (
                <>
                  <ChatBubble delay={0.2}>Please select your interests. You can choose up to 4 options.</ChatBubble>
                  {data.interests.length > 0 && (
                    <ChatBubble isUser>
                      {data.interests.map(id => INTERESTS.find(i => i.id === id)?.icon).join(' ')} {data.interests.map(id => INTERESTS.find(i => i.id === id)?.name).join(', ')}
                    </ChatBubble>
                  )}
                </>
              )}

              {/* Step 6: Level */}
              {step >= 6 && (
                <>
                  <ChatBubble delay={0.2}>What is your level of English?</ChatBubble>
                  {data.level && <ChatBubble isUser>{LEVELS.find(l => l.id === data.level)?.title}</ChatBubble>}
                </>
              )}

              {/* Step 7: Areas */}
              {step >= 7 && (
                <>
                  <ChatBubble delay={0.2}>In which areas would you like to improve your English?</ChatBubble>
                  {data.areas.length > 0 && (
                    <ChatBubble isUser>
                      {data.areas.map(id => AREAS.find(a => a.id === id)?.name).join(', ')}
                    </ChatBubble>
                  )}
                </>
              )}

              {/* Step 8: Goal */}
              {step >= 8 && (
                <>
                  <ChatBubble delay={0.2}>What's your daily practice goal?</ChatBubble>
                  {data.goal && <ChatBubble isUser>{GOALS.find(g => g.id === data.goal)?.title}</ChatBubble>}
                </>
              )}

              {/* Step 9: Time */}
              {step >= 9 && (
                <>
                  <ChatBubble delay={0.2}>Pick a time of the day to start your practice everyday.</ChatBubble>
                  {data.practiceTime && <ChatBubble isUser>{data.practiceTime}</ChatBubble>}
                </>
              )}

              {/* Step 10: Final Confirmation */}
              {step >= 10 && (
                <>
                  <ChatBubble delay={0.2}>I will remind your training time everyday. Allow notifications not to miss your practice time!</ChatBubble>
                </>
              )}
            </div>

            {/* Input Options */}
            <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-bg-deep via-bg-deep to-transparent">
              <div className="max-w-lg mx-auto">
                {step === 1 && (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Enter your name"
                      value={data.name}
                      onChange={(e) => setData({ ...data, name: e.target.value })}
                      className="w-full glass px-6 py-4 rounded-2xl text-xl focus:outline-none focus:border-primary transition-all"
                      onKeyDown={(e) => e.key === 'Enter' && data.name && nextStep()}
                    />
                    {data.name && (
                      <button 
                        onClick={nextStep}
                        className="w-full py-3 bg-primary rounded-xl font-bold neon-glow-primary"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {LANGUAGES.filter(l => l.id !== 'en').map(lang => (
                      <button
                        key={lang.id}
                        onClick={() => { setData({ ...data, nativeLanguage: lang.id }); nextStep(); }}
                        className="glass px-4 py-2 rounded-xl flex items-center space-x-2 hover:border-primary transition-all"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 3 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    <button
                      onClick={() => { setData({ ...data, targetLanguage: 'en' }); nextStep(); }}
                      className="glass px-4 py-2 rounded-xl flex items-center space-x-2 hover:border-primary transition-all"
                    >
                      <span>🇺🇸</span>
                      <span>English</span>
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div className="flex gap-4 justify-center">
                    {[data.nativeLanguage, data.targetLanguage].map(id => (
                      <button
                        key={id}
                        onClick={() => { setData({ ...data, explanationLanguage: id }); nextStep(); }}
                        className="glass px-6 py-3 rounded-xl flex items-center space-x-2 hover:border-primary transition-all"
                      >
                        <span>{LANGUAGES.find(l => l.id === id)?.flag}</span>
                        <span>{LANGUAGES.find(l => l.id === id)?.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {step === 5 && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {INTERESTS.slice(0, 8).map(interest => (
                        <button
                          key={interest.id}
                          onClick={() => {
                            const newInterests = data.interests.includes(interest.id)
                              ? data.interests.filter(id => id !== interest.id)
                              : [...data.interests, interest.id].slice(0, 4);
                            setData({ ...data, interests: newInterests });
                          }}
                          className={cn(
                            "glass px-4 py-2 rounded-xl flex items-center space-x-2 transition-all",
                            data.interests.includes(interest.id) ? "border-primary bg-primary/10" : "hover:border-primary/30"
                          )}
                        >
                          <span>{interest.icon}</span>
                          <span>{interest.name}</span>
                        </button>
                      ))}
                      <button 
                        onClick={() => setShowMoreInterests(true)}
                        className="glass px-4 py-2 rounded-xl flex items-center space-x-2 hover:border-primary transition-all text-primary font-bold"
                      >
                        <span>+ More</span>
                      </button>
                    </div>
                    {data.interests.length > 0 && (
                      <button 
                        onClick={nextStep}
                        className="w-full py-3 bg-primary rounded-xl font-bold neon-glow-primary"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                )}

                {step === 6 && (
                  <div className="grid grid-cols-2 gap-2">
                    {LEVELS.map(level => (
                      <button
                        key={level.id}
                        onClick={() => { setData({ ...data, level: level.id }); nextStep(); }}
                        className="glass px-4 py-3 rounded-xl text-sm font-bold hover:border-primary transition-all"
                      >
                        {level.title}
                      </button>
                    ))}
                  </div>
                )}

                {step === 7 && (
                  <div className="grid grid-cols-2 gap-2">
                    {AREAS.map(area => (
                      <button
                        key={area.id}
                        onClick={() => {
                          const newAreas = data.areas.includes(area.id)
                            ? data.areas.filter(id => id !== area.id)
                            : [...data.areas, area.id];
                          setData({ ...data, areas: newAreas });
                        }}
                        className={cn(
                          "glass px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all",
                          data.areas.includes(area.id) ? "border-primary bg-primary/10" : "hover:border-primary/30"
                        )}
                      >
                        <span>{area.icon}</span>
                        <span className="text-left">{area.title}</span>
                      </button>
                    ))}
                    {data.areas.length > 0 && (
                      <button 
                        onClick={nextStep}
                        className="col-span-2 py-3 bg-primary rounded-xl font-bold neon-glow-primary mt-2"
                      >
                        Continue
                      </button>
                    )}
                  </div>
                )}

                {step === 8 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {GOALS.map(goal => (
                      <button
                        key={goal.id}
                        onClick={() => { setData({ ...data, goal: goal.id }); nextStep(); }}
                        className="glass px-4 py-2 rounded-xl text-sm font-bold hover:border-primary transition-all"
                      >
                        {goal.title}
                      </button>
                    ))}
                  </div>
                )}

                {step === 9 && (
                  <div className="flex flex-col items-center space-y-6">
                    <div className="flex items-center space-x-4 glass p-6 rounded-3xl neon-glow-primary">
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => {
                            const [h, m] = data.practiceTime.split(':').map(Number);
                            const newH = (h + 1) % 24;
                            setData({ ...data, practiceTime: `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` });
                          }}
                          className="p-2 hover:text-primary transition-colors"
                        >
                          <ChevronRight className="w-6 h-6 -rotate-90" />
                        </button>
                        <span className="text-5xl font-mono font-black text-primary">
                          {data.practiceTime.split(':')[0]}
                        </span>
                        <button 
                          onClick={() => {
                            const [h, m] = data.practiceTime.split(':').map(Number);
                            const newH = (h - 1 + 24) % 24;
                            setData({ ...data, practiceTime: `${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}` });
                          }}
                          className="p-2 hover:text-primary transition-colors"
                        >
                          <ChevronRight className="w-6 h-6 rotate-90" />
                        </button>
                      </div>
                      <span className="text-4xl font-mono font-black text-text-dim">:</span>
                      <div className="flex flex-col items-center">
                        <button 
                          onClick={() => {
                            const [h, m] = data.practiceTime.split(':').map(Number);
                            const newM = (m + 5) % 60;
                            setData({ ...data, practiceTime: `${h.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}` });
                          }}
                          className="p-2 hover:text-primary transition-colors"
                        >
                          <ChevronRight className="w-6 h-6 -rotate-90" />
                        </button>
                        <span className="text-5xl font-mono font-black text-primary">
                          {data.practiceTime.split(':')[1]}
                        </span>
                        <button 
                          onClick={() => {
                            const [h, m] = data.practiceTime.split(':').map(Number);
                            const newM = (m - 5 + 60) % 60;
                            setData({ ...data, practiceTime: `${h.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}` });
                          }}
                          className="p-2 hover:text-primary transition-colors"
                        >
                          <ChevronRight className="w-6 h-6 rotate-90" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={nextStep}
                      className="w-full py-4 bg-primary rounded-2xl font-bold text-xl neon-glow-primary shadow-lg shadow-primary/20"
                    >
                      Set Daily Reminder
                    </button>
                  </div>
                )}

                {step === 10 && (
                  <button 
                    onClick={nextStep}
                    className="w-full py-4 bg-primary rounded-2xl font-bold text-xl neon-glow-primary"
                  >
                    Continue
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === 11 && (
          <motion.div
            key="personalizing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center min-h-screen w-full max-w-md space-y-12"
          >
            <div className="relative w-48 h-48">
              <svg className="w-full h-full -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-primary/10"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="88"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray="553"
                  animate={{ strokeDashoffset: 553 - (553 * personalizingProgress) / 100 }}
                  className="text-primary"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <RobotAvatar />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-heading font-bold">Personalizing your learning plan...</h2>
            </div>

            <div className="w-full space-y-4">
              {[
                { label: 'Creating diverse topics', threshold: 20 },
                { label: 'Preparing interactive dialogues', threshold: 40 },
                { label: 'Optimizing your learning path', threshold: 60 },
                { label: 'Finalizing your plan', threshold: 80 },
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                    personalizingProgress >= item.threshold ? "bg-emerald border-emerald" : "border-border"
                  )}>
                    {personalizingProgress >= item.threshold && <ChevronRight className="w-4 h-4 text-white rotate-90" />}
                  </div>
                  <span className={cn(
                    "text-sm transition-colors",
                    personalizingProgress >= item.threshold ? "text-text-bright" : "text-text-dim"
                  )}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            {personalizingProgress === 100 && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={nextStep}
                className="w-full py-4 bg-primary rounded-2xl font-bold text-xl neon-glow-primary"
              >
                Get My Plan
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 12 && (
          <motion.div
            key="paywall"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-start min-h-screen w-full max-w-md pt-8 space-y-6 pb-12"
          >
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-heading font-black text-primary tracking-tighter">FLUEN<span className="text-white">TA</span> PRO</h2>
              <p className="text-text-mid font-medium">Unlock your full potential today</p>
            </div>

            <div className="glass p-6 rounded-3xl w-full space-y-4 relative overflow-hidden border-primary/20">
              <div className="absolute -top-4 -right-4 p-4 opacity-10">
                <Zap className="w-24 h-24 text-primary" />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {[
                  { icon: BookOpen, title: 'Unlimited Lessons', desc: 'Access 500+ topics' },
                  { icon: Zap, title: 'AI Speech Analysis', desc: 'Real-time neural feedback' },
                  { icon: Trophy, title: 'Exclusive Challenges', desc: 'Earn limited edition badges' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-center space-x-4 p-3 rounded-2xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{feature.title}</h4>
                      <p className="text-xs text-text-dim">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4">
                {[
                  { id: 'monthly', title: 'Monthly', price: '₹999', period: '/mo', desc: 'Billed monthly' },
                  { id: 'yearly', title: 'Yearly', price: '₹4,999', period: '/yr', desc: 'Save 58% • Best Value', popular: true },
                  { id: 'lifetime', title: 'Lifetime', price: '₹12,999', period: '', desc: 'One-time payment' },
                ].map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden group",
                      selectedPlan === plan.id 
                        ? "border-primary bg-primary/10" 
                        : "border-border hover:border-primary/30 bg-white/5"
                    )}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                        Best Value
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-bold">{plan.title}</h4>
                        <p className="text-xs text-text-dim">{plan.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-black text-primary">{plan.price}</span>
                        <span className="text-xs text-text-dim">{plan.period}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="w-full space-y-4">
              <button 
                onClick={finishOnboarding}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-xl neon-glow-primary shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {selectedPlan === 'lifetime' ? 'Get Lifetime Access' : 'Start 7-Day Free Trial'}
              </button>
              
              <button 
                onClick={finishOnboarding}
                className="w-full text-text-dim text-sm font-medium hover:text-text-mid transition-colors py-2"
              >
                Continue with limited version
              </button>
            </div>
            
            <p className="text-[10px] text-text-dim text-center px-8 leading-relaxed">
              By subscribing, you agree to our Terms of Service and Privacy Policy. Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* More Interests Modal */}
      <AnimatePresence>
        {showMoreInterests && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-bg-deep/80 backdrop-blur-md" onClick={() => setShowMoreInterests(false)} />
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass w-full max-w-md p-8 rounded-3xl relative z-10 space-y-6"
            >
              <h3 className="text-2xl font-heading font-bold">All Interests</h3>
              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map(interest => (
                  <button
                    key={interest.id}
                    onClick={() => {
                      const newInterests = data.interests.includes(interest.id)
                        ? data.interests.filter(id => id !== interest.id)
                        : [...data.interests, interest.id].slice(0, 4);
                      setData({ ...data, interests: newInterests });
                    }}
                    className={cn(
                      "glass px-4 py-3 rounded-xl flex items-center space-x-2 transition-all text-sm",
                      data.interests.includes(interest.id) ? "border-primary bg-primary/10" : "hover:border-primary/30"
                    )}
                  >
                    <span>{interest.icon}</span>
                    <span>{interest.name}</span>
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setShowMoreInterests(false)}
                className="w-full py-3 bg-primary rounded-xl font-bold"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
