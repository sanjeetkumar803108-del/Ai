import { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

export const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingRedirect, setIsCheckingRedirect] = useState(true);

  // Check for redirect result on mount
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const checkRedirectResult = async () => {
      try {
        console.log('🔍 Checking Firebase redirect result...');
        
        // Set max 3 second timeout for redirect check
        timeoutId = setTimeout(() => {
          console.warn('⏱️ Redirect check timeout');
          if (mounted) setIsCheckingRedirect(false);
        }, 3000);

        const result = await getRedirectResult(auth);
        clearTimeout(timeoutId);
        
        if (mounted) {
          if (result) {
            console.log('✅ Redirect auth successful:', result.user.email);
            setError('');
          } else {
            console.log('✅ No redirect result (first load)');
          }
          setIsCheckingRedirect(false);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.error('❌ Redirect result error:', err.code || err?.message);
        if (mounted) {
          // Silently fail for cancelled/popup issues
          if (err.code !== 'auth/cancelled-popup-request' && 
              err.code !== 'auth/popup-closed-by-user') {
            // Don't set error - just continue
          }
          setIsCheckingRedirect(false);
        }
      }
    };

    // Wrap everything in try-catch
    try {
      checkRedirectResult();
    } catch (e) {
      console.error('❌ Critical error in auth check:', e);
      setIsCheckingRedirect(false);
    }

    // Enable persistence
    setPersistence(auth, browserLocalPersistence).catch(err => 
      console.warn('Persistence error (non-critical):', err)
    );

    // Cleanup
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      console.log('🔐 Starting auth with email:', email);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      console.log('✅ Auth successful');
    } catch (err: any) {
      const errorCode = err.code || 'UNKNOWN_ERROR';
      const errorMsg = err.message || 'Authentication failed';
      console.error('❌ Auth error:', { code: errorCode, message: errorMsg });
      
      // Map Firebase error codes to user messages
      let displayError = errorMsg;
      
      switch(errorCode) {
        case 'auth/invalid-email':
          displayError = '❌ Email sahi nahi hai';
          break;
        case 'auth/weak-password':
          displayError = '❌ Password kam se kam 6 characters ka hona chahiye';
          break;
        case 'auth/user-not-found':
          displayError = '❌ Ye email register nahi hai';
          break;
        case 'auth/wrong-password':
          displayError = '❌ Password galat hai';
          break;
        case 'auth/email-already-in-use':
          displayError = '❌ Ye email pehle se register hai';
          break;
        case 'auth/operation-not-allowed':
          displayError = '⚠️ Firebase mein Email/Password auth disable hai! Admin se contact karo. Error: ' + errorCode;
          break;
        case 'auth/too-many-requests':
          displayError = '❌ Bahut zyada attempts. Baad mein try karo.';
          break;
        default:
          displayError = `❌ ${errorMsg} (${errorCode})`;
      }
      
      setError(displayError);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      console.log('🌐 Starting Google redirect auth...');
      await signInWithRedirect(auth, googleProvider);
      // User will be redirected to Google, then back here
    } catch (err: any) {
      const errorMsg = err.message || 'Google Sign-In failed';
      console.error('❌ Google auth error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
    }
  };

  if (isCheckingRedirect) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#F3F4F6',
        padding: '24px',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#008069',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            margin: '0 auto 16px',
          }}>
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Mitra" alt="Logo" style={{ width: '48px', height: '48px' }} />
          </div>
          <p style={{ fontSize: '14px', color: '#666', margin: '0' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      backgroundColor: '#F3F4F6',
      padding: '24px',
      justifyContent: 'center',
      alignItems: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '400px',
        backgroundColor: 'white',
        borderRadius: '40px',
        padding: '32px',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        border: '1px solid #f3f4f6',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#008069',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(0,128,105,0.2)',
            overflow: 'hidden',
          }}>
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Mitra" alt="Logo" style={{ width: '48px', height: '48px' }} />
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '900',
            color: '#008069',
            letterSpacing: '-0.02em',
            margin: '0',
          }}>Form Mitra AI</h1>
          <p style={{
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#999',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            textAlign: 'center',
            margin: '0',
          }}>Aapka Digital Sarkari Sahayak</p>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#999',
              textTransform: 'uppercase',
              paddingLeft: '4px',
            }}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{
                width: '100%',
                backgroundColor: '#f9fafb',
                border: '1px solid #f3f4f6',
                borderRadius: '16px',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              required
              disabled={loading || isCheckingRedirect}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{
              fontSize: '10px',
              fontWeight: 'bold',
              color: '#999',
              textTransform: 'uppercase',
              paddingLeft: '4px',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                backgroundColor: '#f9fafb',
                border: '1px solid #f3f4f6',
                borderRadius: '16px',
                padding: '12px 16px',
                fontSize: '14px',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
              required
              disabled={loading || isCheckingRedirect}
            />
          </div>

          {error && (
            <div style={{
              display: 'flex',
              gap: '8px',
              fontSize: '10px',
              fontWeight: 'bold',
              backgroundColor: '#fee2e2',
              padding: '12px',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              color: '#dc2626',
            }}>
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || isCheckingRedirect}
            style={{
              width: '100%',
              backgroundColor: '#008069',
              color: 'white',
              border: 'none',
              padding: '16px',
              borderRadius: '16px',
              fontSize: '12px',
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '0 10px 15px -3px rgba(0,128,105,0.1)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                <span>Processing...</span>
              </>
            ) : (
              <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
            )}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '16px 0',
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#f3f4f6' }} />
          <span style={{
            padding: '0 12px',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#ccc',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>Or continue with</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#f3f4f6' }} />
        </div>

        <button
          onClick={signInWithGoogle}
          disabled={loading || isCheckingRedirect}
          style={{
            width: '100%',
            backgroundColor: 'white',
            border: '1px solid #f3f4f6',
            padding: '16px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid #ccc',
                borderTop: '2px solid #666',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>Redirecting...</span>
            </>
          ) : (
            <>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#333' }}>Google Sign-In</span>
            </>
          )}
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#999',
          fontWeight: '500',
          margin: '16px 0 0',
        }}>
          {isLogin ? 'Naye user hain? ' : 'Pehle se account hai? '}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            disabled={loading}
            style={{
              color: '#008069',
              fontWeight: 'bold',
              textDecoration: 'underline',
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 'inherit',
              padding: '0',
            }}
          >
            {isLogin ? 'Sign Up karein' : 'Sign In karein'}
          </button>
        </p>

        <div style={{
          marginTop: '16px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '9px',
            color: '#ccc',
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: '1.4',
            margin: '0',
          }}>
            🔒 Secure & Private
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
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
