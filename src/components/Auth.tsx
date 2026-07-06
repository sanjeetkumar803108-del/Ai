import { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Globe } from 'lucide-react';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F3F4F6] p-6 justify-center items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col gap-6"
      >
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-16 h-16 bg-[#008069] rounded-2xl flex items-center justify-center text-white shadow-lg overflow-hidden">
             <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Mitra" alt="Logo" className="w-12 h-12" />
          </div>
          <h1 className="text-2xl font-black text-[#008069] tracking-tight">Future Mitra</h1>
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest text-center">Aapka Bada Bhai & Career Strategist</p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-4">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 px-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#008069] transition-all"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-gray-400 px-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-[#008069] transition-all"
              required
            />
          </div>

          {error && <p className="text-red-500 text-[10px] font-bold text-center bg-red-50 p-2 rounded-xl border border-red-100">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#008069] text-white py-4 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-[#005c4b] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isLogin ? (
              <>Sign In <LogIn className="w-4 h-4" /></>
            ) : (
              <>Sign Up <UserPlus className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
          <span className="relative bg-white px-3 text-[10px] font-bold text-gray-300 uppercase tracking-widest">Or continue with</span>
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full bg-white border border-gray-100 py-4 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-all transition-transform active:scale-[0.98]"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Google Sign-In</span>
        </button>

        <p className="text-center text-[11px] text-gray-500 font-medium">
          {isLogin ? "Naye user hain?" : "Pehle se account hai?"}{' '}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-[#008069] font-black hover:underline"
          >
            {isLogin ? "Sign Up karein" : "Sign In karein"}
          </button>
        </p>

        <div className="mt-4 text-center">
          <p className="text-[9px] text-gray-300 font-medium uppercase tracking-tighter leading-tight flex items-center justify-center gap-1">
            <Globe className="w-3 h-3" /> Secure AI Authentication
          </p>
        </div>
      </motion.div>
    </div>
  );
};
