import React, { useState, useEffect, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Onboarding } from './components/Onboarding';
import { AnimatedNumber, ShimmerSkeleton, AnimatedEN } from './components/Animations';
import { CustomCursor, FloatingOrb, ParticleSystem } from './components/VisualEffects';
import { GoogleGenAI } from "@google/genai";
import { Home, BookOpen, Trophy, Settings, Search, Flame, Zap, User, ChevronRight, Mic, Layers, Volume2, Play, CreditCard, Send, X, MicOff, Download, CheckCircle2, LogOut, LogIn, ArrowLeft, Github, Mail, Loader2 } from 'lucide-react';
import { cn } from './lib/utils';
import { auth, db, signInWithGoogle, signInWithGithub, signUpWithEmail, signInWithEmail, verifyEmail, resetPassword, reloadUser, logOut, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, getDoc } from 'firebase/firestore';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: any;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, errorInfo: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error };
  }

  render() {
    if (this.state.hasError) {
      let message = "Something went wrong. Please try refreshing the page.";
      try {
        const parsed = JSON.parse(this.state.errorInfo.message);
        if (parsed.error) message = `Error: ${parsed.error}`;
      } catch (e) {}

      return (
        <div className="min-h-screen bg-bg-deep flex items-center justify-center p-6 text-center">
          <div className="glass p-8 rounded-3xl max-w-md space-y-6">
            <div className="w-16 h-16 bg-ruby/20 rounded-full flex items-center justify-center mx-auto text-ruby">
              <X className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">Oops!</h2>
            <p className="text-text-mid">{message}</p>
            <div className="flex flex-col space-y-3">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold"
              >
                Reload App
              </button>
              <button 
                onClick={() => logOut().then(() => window.location.reload())}
                className="w-full py-3 bg-white/5 text-text-mid rounded-xl font-bold hover:bg-white/10 transition-colors"
              >
                Sign Out & Reset
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const AISession = ({ tutor, userData, onClose }: { tutor: any, userData: any, onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Hi! I'm ${tutor.name}. I'm here to help you with ${tutor.role.toLowerCase()}. How can I help you today?` }
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    setInputText('');
    setIsTyping(true);

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("Gemini API Key is missing. Please check your settings.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are ${tutor.name}, an AI English tutor. Your role is ${tutor.role}. ${tutor.desc} 
          The user's name is ${userData?.name || 'Learner'}. 
          Their current level is ${userData?.onboardingData?.level || 'Unknown'}. 
          Their goal is ${userData?.onboardingData?.goal || 'General learning'}.
          Keep your responses helpful, encouraging, and focused on English learning. Use simple to moderate English depending on the user's level. If they make a mistake, gently correct them.`
        },
        history: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.text }]
        }))
      });

      const result = await chat.sendMessage({ message: text });
      const aiText = result.text;

      setMessages(prev => [...prev, { role: 'model', text: aiText }]);
      
      // Text to speech for AI response
      const utterance = new SpeechSynthesisUtterance(aiText);
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I'm having some trouble connecting right now. Let's try again in a moment!" }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      handleSendMessage(transcript);
    };

    recognition.start();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-bg-deep flex flex-col p-4 md:p-8"
    >
      <div className="max-w-4xl mx-auto w-full flex flex-col h-full glass rounded-[40px] overflow-hidden shadow-2xl border-white/5">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img src={tutor.img} alt={tutor.name} className="w-12 h-12 rounded-2xl object-cover" />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-bg-deep bg-emerald" />
            </div>
            <div>
              <h3 className="font-bold text-lg">{tutor.name}</h3>
              <p className={`text-xs font-bold text-${tutor.color} uppercase tracking-wider`}>{tutor.role}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-text-mid"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex",
                m.role === 'user' ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed",
                m.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none shadow-lg shadow-primary/20" 
                  : "glass text-text-bright rounded-tl-none"
              )}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass p-4 rounded-3xl rounded-tl-none flex space-x-1">
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-text-mid rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-text-mid rounded-full" />
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-text-mid rounded-full" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 border-t border-white/5 bg-white/5">
          <div className="flex items-center space-x-4">
            <button 
              onClick={toggleListening}
              className={cn(
                "p-4 rounded-2xl transition-all flex-shrink-0",
                isListening 
                  ? "bg-ruby text-white animate-pulse" 
                  : "glass text-primary hover:bg-primary/10"
              )}
            >
              {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>
            <div className="flex-1 relative">
              <input 
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                placeholder="Type your message..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button 
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-primary hover:text-primary-bright disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const RECENT_WORDS = [
  { word: "Eloquent", meaning: "Fluent or persuasive", level: "Advanced" },
  { word: "Resilient", meaning: "Able to withstand or recover", level: "Intermediate" },
  { word: "Pragmatic", meaning: "Dealing with things sensibly", level: "Advanced" },
  { word: "Ephemeral", meaning: "Lasting for a very short time", level: "Advanced" },
  { word: "Luminous", meaning: "Full of or shedding light", level: "Intermediate" },
  { word: "Tenacious", meaning: "Tending to keep a firm hold", level: "Advanced" }
];

const QuizMode = ({ vocabulary, onComplete, onCancel }: { vocabulary: any[], onComplete: (score: number) => void, onCancel: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const currentWord = vocabulary[currentIndex];
  
  const options = React.useMemo(() => {
    const correct = currentWord.meaning;
    const others = vocabulary
      .filter(v => v.meaning !== correct)
      .map(v => v.meaning)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    return [correct, ...others].sort(() => Math.random() - 0.5);
  }, [currentIndex, vocabulary]);

  const handleAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);
    if (options[index] === currentWord.meaning) {
      setScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIndex < vocabulary.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-12 rounded-[40px] text-center space-y-8 border-emerald/20 bg-emerald/5"
      >
        <div className="w-24 h-24 bg-emerald/20 rounded-full flex items-center justify-center mx-auto text-emerald">
          <Trophy className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-display font-black tracking-tighter">Quiz Completed!</h2>
          <p className="text-text-mid text-lg">You scored {score} out of {vocabulary.length}</p>
        </div>
        <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20">
          <p className="text-primary font-bold text-xl">+{score * 10} XP Earned</p>
        </div>
        <button 
          onClick={() => onComplete(score)}
          className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25 hover:scale-[1.02] transition-all"
        >
          Back to Review
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="p-3 hover:bg-white/5 rounded-full text-text-mid transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center space-x-6">
          <div className="h-2 w-48 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / vocabulary.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-text-mid tracking-widest uppercase">{currentIndex + 1} / {vocabulary.length}</span>
        </div>
      </div>

      <div className="glass p-12 rounded-[40px] text-center space-y-12 border-primary/20 bg-primary/5">
        <div className="space-y-4">
          <span className="text-xs font-bold text-primary uppercase tracking-[0.2em]">What is the meaning of:</span>
          <h2 className="text-6xl font-display font-black tracking-tighter leading-none">{currentWord.word}</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={isAnswered}
              className={cn(
                "w-full p-6 rounded-2xl text-left font-bold transition-all border text-lg",
                isAnswered 
                  ? option === currentWord.meaning
                    ? "bg-emerald/10 border-emerald text-emerald"
                    : i === selectedOption
                      ? "bg-ruby/10 border-ruby text-ruby"
                      : "bg-white/5 border-white/10 opacity-50"
                  : "bg-white/5 border-white/10 hover:border-primary/50 hover:bg-primary/10"
              )}
            >
              <div className="flex items-center justify-between">
                <span>{option}</span>
                {isAnswered && option === currentWord.meaning && <CheckCircle2 className="w-6 h-6" />}
                {isAnswered && i === selectedOption && option !== currentWord.meaning && <X className="w-6 h-6" />}
              </div>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {isAnswered && (
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              onClick={nextQuestion}
              className="w-full max-w-2xl mx-auto py-5 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/25 hover:scale-[1.02] transition-all text-lg"
            >
              {currentIndex === vocabulary.length - 1 ? "Finish Quiz" : "Next Question"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const AuthForm = ({ onCancel }: { onCancel: () => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email.');
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setVerificationSent(false);
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
        await verifyEmail();
        setVerificationSent(true);
      }
    } catch (err: any) {
      console.error("Email Auth Error:", err);
      if (err.code === 'auth/admin-restricted-operation') {
        setError('This login method is disabled. Please enable "Email/Password" in your Firebase Console (Authentication > Sign-in method).');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password login is not enabled for this project.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`This domain is not authorized. Please add "${window.location.hostname}" to your Firebase Console.`);
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('This email is already in use. Try signing in instead.');
      } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (showReset) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm glass p-8 rounded-[32px] space-y-6 border-primary/20"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Reset Password</h2>
          <button onClick={() => setShowReset(false)} className="p-2 hover:bg-white/5 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-text-mid">Enter your email to receive a reset link.</p>

        {resetSent ? (
          <div className="p-4 bg-emerald/10 border border-emerald/20 rounded-2xl text-emerald text-sm font-bold">
            Reset link sent! Please check your inbox.
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-mid uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none transition-all"
                placeholder="name@example.com"
              />
            </div>
            {error && <p className="text-ruby text-xs font-bold">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
            </button>
          </form>
        )}

        <button 
          onClick={() => setShowReset(false)}
          className="w-full text-xs font-bold text-text-mid hover:text-primary transition-colors"
        >
          Back to Login
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-sm glass p-8 rounded-[32px] space-y-6 border-primary/20"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full">
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-text-mid uppercase tracking-widest">Email Address</label>
          <input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none transition-all"
            placeholder="name@example.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-text-mid uppercase tracking-widest">Password</label>
            {isLogin && (
              <button 
                type="button"
                onClick={() => setShowReset(true)}
                className="text-[10px] font-bold text-primary hover:underline"
              >
                Forgot?
              </button>
            )}
          </div>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary/50 outline-none transition-all"
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-ruby text-xs font-bold">{error}</p>}
        {verificationSent && <p className="text-emerald text-xs font-bold">Verification email sent! Please check your inbox.</p>}

        <button 
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-primary text-white rounded-xl font-bold hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isLogin ? 'Sign In' : 'Sign Up'}
        </button>
      </form>

      <button 
        onClick={() => setIsLogin(!isLogin)}
        className="w-full text-xs font-bold text-text-mid hover:text-primary transition-colors"
      >
        {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
      </button>
    </motion.div>
  );
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'learn' | 'speak' | 'review' | 'profile' | 'pricing'>('home');
  const [particles, setParticles] = useState<{ x: number, y: number, id: number }[]>([]);
  const [levelFilter, setLevelFilter] = useState('All');
  const [isAISessionActive, setIsAISessionActive] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        setAuthError(null);
      } else {
        setCurrentUser(null);
      }
      setIsAuthReady(true);
      if (!user) {
        setUserData(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sync
  useEffect(() => {
    if (!currentUser || !isAuthReady) return;

    const userDocRef = doc(db, 'users', currentUser.uid);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      } else {
        // New user, data will be created after onboarding
        setUserData(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
    });

    return () => unsubscribe();
  }, [currentUser, isAuthReady]);

  const handleSocialLogin = async (methodName: string, signInMethod: () => Promise<any>) => {
    setAuthError(null);
    setSocialLoading(methodName);
    try {
      await signInMethod();
    } catch (err: any) {
      console.error("Auth Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setAuthError(`This domain is not authorized for login. Please add "${window.location.hostname}" to your Firebase Console (Authentication > Settings > Authorized domains).`);
      } else if (err.code === 'auth/popup-blocked') {
        setAuthError('Login popup was blocked by your browser. Please allow popups for this site.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('Login was cancelled. Please try again.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setAuthError('This login method is not enabled in your Firebase project.');
      } else {
        setAuthError(err.message || 'An error occurred during login.');
      }
    } finally {
      setSocialLoading(null);
    }
  };

  // Streak Logic
  useEffect(() => {
    if (!currentUser || !userData || !userData.lastActive) return;

    const checkStreak = async () => {
      const lastActive = new Date(userData.lastActive);
      const now = new Date();
      
      const isSameDay = (d1: Date, d2: Date) => 
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate();

      if (isSameDay(lastActive, now)) return;

      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);

      const userDocRef = doc(db, 'users', currentUser.uid);
      
      try {
        if (isSameDay(lastActive, yesterday)) {
          // Increment streak
          await updateDoc(userDocRef, {
            streak: (userData.streak || 0) + 1,
            lastActive: now.toISOString()
          });
        } else {
          // Reset streak if more than 1 day missed
          await updateDoc(userDocRef, {
            streak: 1,
            lastActive: now.toISOString()
          });
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    };

    checkStreak();
  }, [currentUser?.uid, userData?.lastActive]);

  const LESSONS = [
    { title: 'English Idioms for Business', level: 'Intermediate', xp: 200, icon: <User className="w-5 h-5" /> },
    { title: 'Native English Pronunciation', level: 'Advanced', xp: 350, icon: <Settings className="w-5 h-5" /> },
    { title: 'Essential English Vocabulary', level: 'Beginner', xp: 150, icon: <Search className="w-5 h-5" /> },
    { title: 'English for Global Travel', level: 'Beginner', xp: 120, icon: <Search className="w-5 h-5" /> },
    { title: 'Advanced English Rhetoric', level: 'Advanced', xp: 400, icon: <Settings className="w-5 h-5" /> },
    { title: 'Daily Conversation Basics', level: 'Beginner', xp: 100, icon: <User className="w-5 h-5" /> },
    { title: 'Technical English for Engineers', level: 'Intermediate', xp: 250, icon: <Settings className="w-5 h-5" /> },
    { title: 'Public Speaking Mastery', level: 'Advanced', xp: 500, icon: <Trophy className="w-5 h-5" /> },
    { title: 'English Slang & Informal Speech', level: 'Intermediate', xp: 180, icon: <Zap className="w-5 h-5" /> },
    { title: 'Academic Writing Fundamentals', level: 'Beginner', xp: 220, icon: <BookOpen className="w-5 h-5" /> },
  ];

  const filteredLessons = levelFilter === 'All' 
    ? LESSONS 
    : LESSONS.filter(lesson => lesson.level === levelFilter);

  const addXP = async (amount: number, e?: React.MouseEvent) => {
    if (!userData) return;
    
    if (e) {
      setParticles(prev => [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }]);
    }
    
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        xp: (userData.xp || 0) + amount,
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const [successLessonId, setSuccessLessonId] = useState<string | null>(null);

  const completeLesson = async (title: string, xpAmount: number, e: React.MouseEvent) => {
    if (!userData) return;
    
    const completed = userData.completedLessons || [];
    if (!completed.includes(title)) {
      // Localized particle effect
      setParticles(prev => [...prev, { x: e.clientX, y: e.clientY, id: Date.now() }]);
      
      // Temporary glow state
      setSuccessLessonId(title);
      setTimeout(() => setSuccessLessonId(null), 2000);

      if (!currentUser) return;

      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, {
          completedLessons: [...completed, title],
          xp: (userData.xp || 0) + xpAmount,
          lastActive: new Date().toISOString()
        });

        // Trigger confetti celebration
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00d68f', '#4da6ff', '#ffffff', '#ffd700'],
          ticks: 200,
          gravity: 1.2,
          scalar: 1.2,
          shapes: ['circle', 'square']
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
      }
    }
  };

  const toggleDownload = async (title: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userData) return;

    const downloaded = userData.downloadedLessons || [];
    const newDownloaded = downloaded.includes(title)
      ? downloaded.filter((t: string) => t !== title)
      : [...downloaded, title];

    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userDocRef, {
        downloadedLessons: newDownloaded,
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const handleOnboardingComplete = async (onboardingData: any) => {
    if (!currentUser) return;

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      await setDoc(userDocRef, {
        uid: currentUser.uid,
        name: onboardingData.name || currentUser.displayName || 'Learner',
        email: currentUser.email || `${currentUser.uid}@placeholder.com`,
        xp: 0,
        streak: 1,
        completedLessons: [],
        downloadedLessons: [],
        onboardingData,
        createdAt: new Date().toISOString(),
        lastActive: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${currentUser.uid}`);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-text-mid font-bold">Loading Fluenta...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-bg-deep overflow-hidden selection:bg-primary selection:text-white">
        <CustomCursor />
        
        {/* Background Elements */}
        <div className="fixed inset-0 mesh-gradient pointer-events-none" />
        <FloatingOrb color="bg-primary" size="w-[600px] h-[600px]" delay={0} top="-10%" left="-10%" />
        <FloatingOrb color="bg-violet" size="w-[500px] h-[500px]" delay={5} top="40%" left="60%" />
        <FloatingOrb color="bg-emerald" size="w-[400px] h-[400px]" delay={10} top="70%" left="-5%" />
        <FloatingOrb color="bg-sapphire" size="w-[450px] h-[450px]" delay={15} top="10%" left="80%" />

        <AnimatePresence mode="wait">
          {!currentUser ? (
            <motion.div
              key="login"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-12 relative z-10"
            >
              <div className="space-y-4">
                <h1 className="text-8xl md:text-[12rem] font-display font-black tracking-tighter text-primary leading-none">
                  FLUEN<span className="text-white">TA</span>
                </h1>
                <p className="text-xl md:text-2xl font-heading text-text-mid italic">"Speak English. Own the Room."</p>
              </div>

              <div className="w-full max-w-sm space-y-4">
                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-ruby/10 border border-ruby/20 rounded-2xl text-ruby text-sm font-bold"
                  >
                    {authError}
                  </motion.div>
                )}

                {showEmailAuth ? (
                  <AuthForm onCancel={() => setShowEmailAuth(false)} />
                ) : (
                  <>
                    <button 
                      onClick={() => handleSocialLogin('google', signInWithGoogle)}
                      disabled={!!socialLoading}
                      className="w-full py-4 bg-white text-bg-deep rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50"
                    >
                      {socialLoading === 'google' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/hf/google.svg" className="w-6 h-6" alt="Google" />
                          <span>Continue with Google</span>
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => handleSocialLogin('github', signInWithGithub)}
                      disabled={!!socialLoading}
                      className="w-full py-4 bg-[#24292e] text-white rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:scale-[1.02] transition-all shadow-xl disabled:opacity-50"
                    >
                      {socialLoading === 'github' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Github className="w-6 h-6" />
                          <span>Continue with GitHub</span>
                        </>
                      )}
                    </button>

                    <button 
                      onClick={() => setShowEmailAuth(true)}
                      className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 hover:scale-[1.02] transition-all shadow-xl"
                    >
                      <Mail className="w-6 h-6" />
                      <span>Continue with Email</span>
                    </button>
                  </>
                )}
                
                <p className="text-text-dim text-xs">By continuing, you agree to our Terms & Privacy Policy</p>
              </div>
            </motion.div>
          ) : !userData ? (
            <Onboarding key="onboarding" onComplete={handleOnboardingComplete} />
          ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Top Bar */}
            <header className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center group cursor-pointer">
                <span className="text-3xl font-display font-black tracking-tighter whitespace-nowrap">
                  <span className="text-primary">FLUEN</span><span className="text-white">TA</span>
                </span>
              </div>

              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2 glass px-3 py-1 rounded-full">
                  <Flame className="w-5 h-5 text-primary flame-flicker" />
                  <span className="font-mono text-xl">
                    <AnimatedNumber value={userData.streak || 0} />
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 glass px-3 py-1 rounded-full neon-glow-gold">
                  <div className="w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                    <Zap className="w-3 h-3 text-bg-deep fill-current" />
                  </div>
                  <span className="font-mono text-xl text-gold">
                    <AnimatedNumber value={userData.xp || 0} />
                  </span>
                </div>

                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-bg-raised border-2 border-border flex items-center justify-center font-bold text-primary overflow-hidden">
                    {currentUser.photoURL ? (
                      <img src={currentUser.photoURL} alt={userData.name} className="w-full h-full object-cover" />
                    ) : (
                      userData.name?.[0] || 'U'
                    )}
                  </div>
                  <svg className="absolute -inset-1 w-12 h-12 -rotate-90 pointer-events-none">
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-primary/20"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="22"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="138"
                      strokeDashoffset="40"
                      className="text-primary"
                    />
                  </svg>
                </div>
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 pb-32 max-w-4xl mx-auto w-full">
              <AnimatePresence mode="wait">
                {activeTab === 'home' && (
                  <motion.div
                    key="home"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-8"
                  >
                    <section className="relative overflow-hidden rounded-3xl glass p-8 neon-glow-primary border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                      <div className="absolute top-1/2 -right-4 -translate-y-1/2 opacity-30 scale-150 pointer-events-none">
                        <AnimatedEN />
                      </div>
                      <div className="relative z-10 space-y-6">
                        <div className="inline-flex items-center space-x-2 bg-primary/20 px-3 py-1 rounded-full border border-primary/30">
                          <Zap className="w-4 h-4 text-primary animate-pulse" />
                          <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Powered Mastery</span>
                        </div>
                        <div className="space-y-2">
                          <h2 className="text-4xl font-heading font-extrabold tracking-tight">English Mastery AI</h2>
                          <p className="text-text-mid max-w-md text-lg leading-relaxed">
                            Unlock native-level fluency with our real-time neural feedback engine. Practice pronunciation, rhythm, and intonation.
                          </p>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setIsAISessionActive(true)}
                          className="px-10 py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all neon-glow-primary flex items-center space-x-3"
                        >
                          <span>Start AI Session</span>
                          <ChevronRight className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 space-y-8">
                        <div className="space-y-4">
                          <h2 className="text-3xl font-heading font-bold">Welcome back, {userData.name || 'Learner'}!</h2>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="glass p-6 rounded-3xl relative overflow-hidden group cursor-pointer"
                              onClick={(e) => addXP(50, e)}
                            >
                              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <BookOpen className="w-16 h-16" />
                              </div>
                              <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Daily Goal</span>
                              <h3 className="text-xl font-bold mt-1">Master 10 new idioms</h3>
                              <div className="mt-4 h-1.5 bg-bg-raised rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: '60%' }}
                                  className="h-full bg-primary neon-glow-primary"
                                />
                              </div>
                              <p className="text-[10px] text-text-mid mt-2">6/10 completed</p>
                            </motion.div>

                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="glass p-6 rounded-3xl border-gold/30 bg-gold/5 cursor-pointer"
                              onClick={(e) => addXP(100, e)}
                            >
                              <Trophy className="w-6 h-6 text-gold mb-2" />
                              <h3 className="text-xl font-bold">Weekend Challenge</h3>
                              <p className="text-xs text-text-mid mt-1">Complete 3 perfect lessons for 2x XP!</p>
                            </motion.div>
                          </div>
                        </div>

                        {/* Daily Missions */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h2 className="text-xl font-heading font-bold">Daily Missions</h2>
                            <button className="text-primary text-sm font-bold">View All</button>
                          </div>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              { title: "Speak for 5 minutes", xp: 50, progress: 60, icon: <Mic className="w-5 h-5" /> },
                              { title: "Learn 10 new words", xp: 30, progress: 30, icon: <BookOpen className="w-5 h-5" /> },
                              { title: "Complete 1 lesson", xp: 40, progress: 0, icon: <Play className="w-5 h-5" /> }
                            ].map((mission, i) => (
                              <div key={i} className="glass p-4 rounded-2xl flex items-center space-x-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                  {mission.icon}
                                </div>
                                <div className="flex-1 space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-sm">{mission.title}</span>
                                    <span className="text-xs text-gold font-bold">+{mission.xp} XP</span>
                                  </div>
                                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${mission.progress}%` }}
                                      className="h-full bg-primary"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Word of the Day */}
                        <div className="glass p-6 rounded-3xl space-y-4 border-sapphire/20">
                          <div className="flex items-center space-x-2 text-sapphire">
                            <BookOpen className="w-4 h-4" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Word of the Day</span>
                          </div>
                          <div className="space-y-1">
                            <h3 className="text-2xl font-heading font-black text-white">Eloquent</h3>
                            <p className="text-xs text-text-mid italic">/ˈel.ə.kwənt/</p>
                          </div>
                          <p className="text-xs text-text-bright">
                            Fluent or persuasive in speaking or writing.
                          </p>
                          <button className="w-full py-2 bg-sapphire/10 hover:bg-sapphire/20 text-sapphire rounded-xl text-xs font-bold transition-colors">
                            Practice Now
                          </button>
                        </div>

                        {/* AI Tutors Preview */}
                        <div className="glass p-6 rounded-3xl space-y-4 border-emerald/20">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm">AI Tutors</h4>
                            <Mic className="w-4 h-4 text-emerald" />
                          </div>
                          <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map(i => (
                              <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-8 h-8 rounded-full border-2 border-bg-deep" />
                            ))}
                          </div>
                          <button 
                            onClick={() => setActiveTab('speak')}
                            className="w-full py-2 bg-emerald/10 text-emerald rounded-xl text-xs font-bold hover:bg-emerald/20 transition-colors"
                          >
                            Meet Tutors
                          </button>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'speak' && (
                  <motion.div
                    key="speak"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 pb-24"
                  >
                    <div className="space-y-2">
                      <h1 className="text-3xl font-display font-black tracking-tighter">AI Tutors</h1>
                      <p className="text-text-mid">Practice speaking with native-like AI personalities</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[
                        { name: "Emma", role: "Casual Conversation", desc: "Friendly and patient, perfect for beginners.", img: "https://i.pravatar.cc/150?u=emma", color: "emerald" },
                        { name: "James", role: "Business English", desc: "Professional and direct, focuses on workplace vocabulary.", img: "https://i.pravatar.cc/150?u=james", color: "sapphire" },
                        { name: "Sofia", role: "Grammar & Structure", desc: "Detailed feedback on your sentence construction.", img: "https://i.pravatar.cc/150?u=sofia", color: "ruby" },
                        { name: "Liam", role: "IELTS/TOEFL Prep", desc: "Specialized in academic English and exam techniques.", img: "https://i.pravatar.cc/150?u=liam", color: "violet" }
                      ].map((tutor, i) => (
                        <motion.div 
                          key={i}
                          whileHover={{ y: -5 }}
                          className="glass p-6 rounded-3xl space-y-4 border-white/5 relative overflow-hidden group"
                        >
                          <div className={`absolute top-0 right-0 w-32 h-32 bg-${tutor.color}/10 blur-3xl -mr-16 -mt-16 group-hover:bg-${tutor.color}/20 transition-colors`} />
                          <div className="flex items-start justify-between relative z-10">
                            <div className="flex items-center space-x-4">
                              <div className="relative">
                                <img src={tutor.img} alt={tutor.name} className="w-16 h-16 rounded-2xl object-cover" />
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-bg-deep bg-emerald" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg">{tutor.name}</h3>
                                <p className={`text-xs font-bold text-${tutor.color} uppercase tracking-wider`}>{tutor.role}</p>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-text-mid relative z-10 leading-relaxed">
                            {tutor.desc}
                          </p>
                          <button 
                            onClick={() => {
                              setSelectedTutor(tutor);
                              setIsAISessionActive(true);
                            }}
                            className={`w-full py-3 bg-${tutor.color}/10 hover:bg-${tutor.color}/20 text-${tutor.color} rounded-2xl text-sm font-bold transition-all flex items-center justify-center space-x-2`}
                          >
                            <Mic className="w-4 h-4" />
                            <span>Start Conversation</span>
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'learn' && (
                  <motion.div
                    key="learn"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 pb-24"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h1 className="text-3xl font-display font-black tracking-tighter">Learning Path</h1>
                          <p className="text-text-mid">Master English step by step</p>
                        </div>
                        <button 
                          onClick={() => setIsOfflineMode(!isOfflineMode)}
                          className={cn(
                            "flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all border",
                            isOfflineMode 
                              ? "bg-emerald/10 border-emerald text-emerald neon-glow-emerald" 
                              : "bg-white/5 border-white/10 text-text-mid hover:bg-white/10"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", isOfflineMode ? "bg-emerald animate-pulse" : "bg-text-dim")} />
                          <span>{isOfflineMode ? "Offline Mode Active" : "Go Offline"}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-2">
                        {['All', 'Beginner', 'Intermediate', 'Advanced'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setLevelFilter(level)}
                            className={cn(
                              "px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap",
                              levelFilter === level 
                                ? "bg-primary text-white shadow-lg shadow-primary/25" 
                                : "glass text-text-mid hover:text-text-bright"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-6">
                      {filteredLessons.map((lesson, i) => {
                        const isCompleted = (userData.completedLessons || []).includes(lesson.title);
                        const isDownloaded = (userData.downloadedLessons || []).includes(lesson.title);
                        const isAvailable = !isOfflineMode || isDownloaded;

                        return (
                          <motion.div 
                            key={i} 
                            initial={false}
                            animate={{
                              scale: successLessonId === lesson.title ? [1, 1.05, 1] : 1,
                              boxShadow: successLessonId === lesson.title 
                                ? "0 0 40px rgba(0, 214, 143, 0.4)" 
                                : "0 0 0px rgba(0, 0, 0, 0)"
                            }}
                            transition={{ duration: 0.5 }}
                            className={cn(
                              "glass p-6 rounded-3xl space-y-4 relative overflow-hidden group transition-all",
                              isCompleted 
                                ? "opacity-90 border-emerald/30 neon-glow-emerald" 
                                : !isAvailable 
                                  ? "opacity-40 grayscale cursor-not-allowed" 
                                  : "cursor-pointer hover:scale-[1.02] hover:shadow-xl hover:shadow-primary/5",
                              successLessonId === lesson.title && "border-emerald ring-2 ring-emerald/50"
                            )} 
                            onClick={(e) => !isCompleted && isAvailable && completeLesson(lesson.title, lesson.xp, e)}
                          >
                            {!isAvailable && (
                              <div className="absolute inset-0 bg-bg-deep/40 backdrop-blur-[2px] z-30 flex items-center justify-center">
                                <div className="bg-bg-raised/90 px-4 py-2 rounded-full border border-white/10 flex items-center space-x-2">
                                  <Download className="w-4 h-4 text-text-mid" />
                                  <span className="text-xs font-bold text-text-mid">Download for Offline Access</span>
                                </div>
                              </div>
                            )}
                            {isCompleted && (
                              <motion.div 
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="absolute -top-2 -right-2 bg-emerald text-white px-3 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-tighter z-20 shadow-lg"
                              >
                                Mastered
                              </motion.div>
                            )}
                            <div className={cn(
                              "absolute top-0 left-0 w-1 h-full transition-colors",
                              isCompleted ? 'bg-emerald' : 
                              lesson.level === 'Beginner' ? 'bg-emerald' : 
                              lesson.level === 'Intermediate' ? 'bg-sapphire' : 'bg-ruby'
                            )} />
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <span className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded-full text-white transition-colors",
                                    isCompleted ? 'bg-emerald' :
                                    lesson.level === 'Beginner' ? 'bg-emerald' : 
                                    lesson.level === 'Intermediate' ? 'bg-sapphire' : 'bg-ruby'
                                  )}>{lesson.level}</span>
                                  <h3 className={cn("font-bold text-lg", isCompleted && "text-text-mid line-through decoration-emerald/50")}>
                                    {lesson.title}
                                  </h3>
                                </div>
                                <div className="flex items-center space-x-3">
                                  <p className="text-xs text-text-mid">
                                    {isCompleted ? "Lesson Completed" : `Earn ${lesson.xp} XP • Interactive Lesson`}
                                  </p>
                                  {isDownloaded && !isCompleted && (
                                    <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald">
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Offline Ready</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {!isCompleted && (
                                  <button 
                                    onClick={(e) => toggleDownload(lesson.title, e)}
                                    className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center transition-all border",
                                      isDownloaded 
                                        ? "bg-emerald/10 border-emerald text-emerald" 
                                        : "bg-white/5 border-white/10 text-text-mid hover:bg-white/10 hover:text-text-bright"
                                    )}
                                  >
                                    {isDownloaded ? <CheckCircle2 className="w-5 h-5" /> : <Download className="w-5 h-5" />}
                                  </button>
                                )}
                                <div className={cn(
                                  "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                  isCompleted 
                                    ? "bg-emerald text-white shadow-lg shadow-emerald/20" 
                                    : !isAvailable 
                                      ? "bg-white/5 text-text-dim"
                                      : "bg-white/5 group-hover:bg-primary group-hover:text-white"
                                )}>
                                  {isCompleted ? <Trophy className="w-5 h-5" /> : <Play className="w-4 h-4" />}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'review' && (
                  <motion.div
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 pb-24"
                  >
                    {isQuizActive ? (
                      <QuizMode 
                        vocabulary={RECENT_WORDS}
                        onComplete={(score) => {
                          addXP(score * 10);
                          setIsQuizActive(false);
                        }}
                        onCancel={() => setIsQuizActive(false)}
                      />
                    ) : (
                      <>
                        <div className="space-y-2">
                          <h1 className="text-3xl font-display font-black tracking-tighter">Vocabulary Review</h1>
                          <p className="text-text-mid">Strengthen your memory with spaced repetition</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="glass p-8 rounded-3xl space-y-6 flex flex-col items-center text-center border-primary/20 bg-primary/5">
                            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                              <Layers className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-2xl font-bold">Daily Flashcards</h3>
                              <p className="text-sm text-text-mid">You have 24 words ready for review today.</p>
                            </div>
                            <button 
                              onClick={() => setIsQuizActive(true)}
                              className="px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
                            >
                              Start Review
                            </button>
                          </div>

                          <div className="space-y-4">
                            <h3 className="font-bold text-lg">Recent Words</h3>
                            <div className="space-y-3">
                              {RECENT_WORDS.slice(0, 3).map((item, i) => (
                                <div key={i} className="glass p-4 rounded-2xl flex items-center justify-between">
                                  <div className="space-y-1">
                                    <p className="font-bold">{item.word}</p>
                                    <p className="text-xs text-text-mid">{item.meaning}</p>
                                  </div>
                                  <span className="text-[10px] px-2 py-1 bg-white/5 rounded-lg text-text-mid font-bold uppercase tracking-wider">
                                    {item.level}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <button className="w-full py-3 text-primary text-sm font-bold hover:bg-primary/5 rounded-2xl transition-colors">
                              View Full Dictionary
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 pb-24"
                  >
                    <div className="flex items-center space-x-6">
                      <div className="relative">
                        <img src={currentUser.photoURL || "https://i.pravatar.cc/150?u=learner"} className="w-24 h-24 rounded-[32px] object-cover border-4 border-primary/20" />
                        <div className="absolute -bottom-2 -right-2 bg-primary p-2 rounded-xl text-white shadow-lg">
                          <Zap className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h1 className="text-3xl font-display font-black tracking-tighter">{userData.name || 'Learner'}</h1>
                        <div className="flex items-center space-x-2">
                          <p className="text-text-mid">Level {Math.floor((userData.xp || 0) / 500) + 1} • Fluent Explorer</p>
                          {currentUser.emailVerified ? (
                            <div className="flex items-center space-x-1 text-emerald bg-emerald/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified</span>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 text-ruby bg-ruby/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <X className="w-3 h-3" />
                                <span>Unverified</span>
                              </div>
                              <button 
                                onClick={async () => {
                                  try {
                                    await reloadUser();
                                    window.location.reload(); // Simple way to refresh state
                                  } catch (e) {
                                    console.error(e);
                                  }
                                }}
                                className="text-[10px] font-bold text-primary hover:underline"
                              >
                                Refresh Status
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {!currentUser.emailVerified && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-6 rounded-3xl border-ruby/20 bg-ruby/5 flex items-center justify-between"
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm">Verify your email</h4>
                          <p className="text-xs text-text-mid">Unlock full access and secure your account.</p>
                        </div>
                        <button 
                          onClick={async () => {
                            try {
                              await verifyEmail();
                              alert("Verification email sent!");
                            } catch (e) {
                              alert("Error sending verification email.");
                            }
                          }}
                          className="px-4 py-2 bg-ruby text-white text-xs font-bold rounded-xl shadow-lg shadow-ruby/20"
                        >
                          Resend Email
                        </button>
                      </motion.div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: 'XP', value: userData.xp || 0, icon: <Zap className="w-4 h-4 text-primary" /> },
                        { label: 'Streak', value: `${userData.streak || 0} Days`, icon: <Trophy className="w-4 h-4 text-gold" /> },
                        { label: 'Lessons', value: (userData.completedLessons || []).length, icon: <BookOpen className="w-4 h-4 text-sapphire" /> },
                        { label: 'Rank', value: '#12', icon: <Trophy className="w-4 h-4 text-ruby" /> }
                      ].map((stat, i) => (
                        <div key={i} className="glass p-4 rounded-2xl space-y-1">
                          <div className="flex items-center space-x-2">
                            {stat.icon}
                            <span className="text-[10px] font-bold text-text-mid uppercase tracking-widest">{stat.label}</span>
                          </div>
                          <p className="text-xl font-black">{stat.value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-bold text-lg">Settings</h3>
                      <div className="glass rounded-[32px] overflow-hidden divide-y divide-white/5">
                        {[
                          { label: 'Personal Information', icon: <User className="w-4 h-4" /> },
                          { label: 'Notifications', icon: <Volume2 className="w-4 h-4" /> },
                          { label: 'Subscription', icon: <CreditCard className="w-4 h-4" />, onClick: () => setActiveTab('pricing') },
                          { label: 'Language Settings', icon: <BookOpen className="w-4 h-4" /> },
                          { label: 'Logout', icon: <LogOut className="w-4 h-4" />, onClick: logOut }
                        ].map((item, i) => (
                          <button 
                            key={i} 
                            onClick={item.onClick}
                            className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-text-mid">
                                {item.icon}
                              </div>
                              <span className="font-bold text-sm">{item.label}</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-text-dim" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'pricing' && (
                  <motion.div
                    key="pricing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8 pb-24"
                  >
                    <div className="text-center space-y-4 mb-12">
                      <h2 className="text-5xl font-heading font-black text-primary tracking-tighter">Choose Your Plan</h2>
                      <p className="text-text-mid text-lg">Join 50,000+ learners mastering English with Fluenta</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { 
                          id: 'monthly', 
                          name: 'Monthly', 
                          price: '₹499', 
                          period: 'per month',
                          features: ['Unlimited Lessons', 'Advanced AI Analysis', 'Priority Support', 'No Ads'],
                          cta: 'Go Pro',
                          popular: false,
                          current: false
                        },
                        { 
                          id: 'yearly', 
                          name: 'Yearly', 
                          price: '₹4,999', 
                          period: 'per year',
                          features: ['Everything in Pro', '2 Months Free', 'Exclusive Workshops', 'Priority Support'],
                          cta: 'Best Value',
                          popular: true,
                          current: false
                        },
                        { 
                          id: 'lifetime', 
                          name: 'Lifetime', 
                          price: '₹9,999', 
                          period: 'one-time',
                          features: ['Everything in Pro', 'Lifetime Updates', 'VIP Badge', 'One-on-One Session'],
                          cta: 'Get Lifetime',
                          popular: false,
                          current: false
                        },
                      ].map((plan) => (
                        <div 
                          key={plan.id}
                          className={cn(
                            "glass p-8 rounded-[32px] flex flex-col space-y-6 relative",
                            plan.popular ? "border-primary bg-primary/5 neon-glow-primary" : "border-border"
                          )}
                        >
                          {plan.popular && (
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">
                              Most Popular
                            </div>
                          )}
                          <div className="space-y-1">
                            <h3 className="text-2xl font-bold">{plan.name}</h3>
                            <div className="flex items-baseline space-x-1">
                              <span className="text-4xl font-black text-primary">{plan.price}</span>
                              <span className="text-sm text-text-dim">{plan.period}</span>
                            </div>
                          </div>
                          <ul className="space-y-3 flex-1">
                            {plan.features.map((f, i) => (
                              <li key={i} className="flex items-center space-x-3 text-sm text-text-bright">
                                <Zap className="w-4 h-4 text-primary fill-current" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                          <button className={cn(
                            "w-full py-4 rounded-2xl font-bold transition-all",
                            plan.current 
                              ? "bg-bg-raised text-text-dim cursor-default" 
                              : "bg-primary text-white hover:scale-105 neon-glow-primary"
                          )}>
                            {plan.cta}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="glass p-8 rounded-[32px] mt-12 text-center space-y-4">
                      <h3 className="text-2xl font-bold">Need a custom plan?</h3>
                      <p className="text-text-mid">Contact our sales team for enterprise or team subscriptions.</p>
                      <button className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all">
                        Contact Sales
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
              <div className="glass px-4 py-2 rounded-full flex items-center space-x-2 shadow-2xl">
                {[
                  { id: 'home', icon: Home, label: 'Home' },
                  { id: 'speak', icon: Mic, label: 'Speak' },
                  { id: 'learn', icon: BookOpen, label: 'Learn' },
                  { id: 'review', icon: Layers, label: 'Review' },
                  { id: 'pricing', icon: CreditCard, label: 'Pricing' },
                  { id: 'profile', icon: User, label: 'Profile' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      "relative p-3 rounded-full transition-all duration-300 group",
                      activeTab === tab.id ? "text-primary" : "text-text-mid hover:text-text-bright"
                    )}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-primary/10 rounded-full"
                        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                      />
                    )}
                    <tab.icon className={cn(
                      "w-6 h-6 relative z-10 transition-transform",
                      activeTab === tab.id && "scale-110"
                    )} />
                    <span className="sr-only">{tab.label}</span>
                  </button>
                ))}
              </div>
            </nav>
            <AnimatePresence>
              {isAISessionActive && selectedTutor && (
                <AISession 
                  tutor={selectedTutor} 
                  userData={userData}
                  onClose={() => setIsAISessionActive(false)} 
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Particle Effects */}
      {particles.map(p => (
        <ParticleSystem 
          key={p.id} 
          x={p.x} 
          y={p.y} 
          onComplete={() => setParticles(prev => prev.filter(item => item.id !== p.id))} 
        />
      ))}
      </div>
    </ErrorBoundary>
  );
}
