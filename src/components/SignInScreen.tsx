import React, { useState, useEffect } from 'react';
import AuraLogo from './AuraLogo';
import { 
  User, Lock, Eye, EyeOff, ShieldCheck, HelpCircle, Key, 
  ArrowRight, Loader, Mail, ShieldAlert, Cpu, CheckCircle, AtSign
} from 'lucide-react';
import { UserSession } from '../types';

interface SignInScreenProps {
  onLoginSuccess: (session: UserSession) => void;
}

interface SavedUser {
  username: string;
  fullName: string;
  email: string;
  role: string;
  clearanceLevel: string;
  passwordHash: string; // simulated
}

export default function SignInScreen({ onLoginSuccess }: SignInScreenProps) {
  // Toggle between 'login' and 'signup' modes
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  
  // Login form states
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Signup form states
  const [signupFullName, setSignupFullName] = useState('');
  const [signupUsername, setSignupUsername] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupRole, setSignupRole] = useState('GRID DEFENSE ANALYST');
  const [signupClearance, setSignupClearance] = useState('LEVEL 3 (SIGMA)');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupCode, setSignupCode] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UI state managers
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [registrationSteps, setRegistrationSteps] = useState<string[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);

  // Recovery Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  
  // Hardware/SSO Device Token Simulation Modal states
  const [showSsoModal, setShowSsoModal] = useState(false);
  const [ssoStep, setSsoStep] = useState<'scan' | 'verifying' | 'success'>('scan');
  const [ssoProgress, setSsoProgress] = useState(0);

  // Initialize DB with standard default credentials on mount
  useEffect(() => {
    const existingUsers = localStorage.getItem('aura_registered_users');
    if (!existingUsers) {
      const defaultUsers: SavedUser[] = [
        {
          username: 'admin_nexus',
          fullName: 'Commander Nexus Peak',
          email: 'admin.nexus@aura.mil',
          role: 'NEXUS COMMANDER',
          clearanceLevel: 'LEVEL 5 (OMEGA)',
          passwordHash: 'aura-protocol-9'
        }
      ];
      localStorage.setItem('aura_registered_users', JSON.stringify(defaultUsers));
    }
  }, []);

  // Preset role to clearance mappings
  const handleRoleChange = (role: string) => {
    setSignupRole(role);
    if (role === 'NEXUS COMMANDER') {
      setSignupClearance('LEVEL 5 (OMEGA)');
    } else if (role === 'JOINT COMMAND SECURITY') {
      setSignupClearance('LEVEL 4 (ALPHA)');
    } else if (role === 'GRID DEFENSE ANALYST') {
      setSignupClearance('LEVEL 3 (SIGMA)');
    } else {
      setSignupClearance('LEVEL 2 (BETA)');
    }
  };

  // Quick fill function for quick assessment/debugging
  const handleQuickFill = () => {
    if (authMode === 'login') {
      setLoginUsername('admin_nexus');
      setLoginPassword('aura-protocol-9');
      setStatusMessage(null);
    } else {
      setSignupFullName('Aura Strategic Operator');
      setSignupUsername('operator_alpha');
      setSignupEmail('alpha.operator@aura.mil');
      handleRoleChange('GRID DEFENSE ANALYST');
      setSignupPassword('operator-pass-2026');
      setSignupConfirmPassword('operator-pass-2026');
      setSignupCode('AURA-SECURE-9');
      setTermsAccepted(true);
      setStatusMessage(null);
    }
  };

  // Submit sign in credentials
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!loginUsername.trim()) {
      setStatusMessage({ text: "Authentication rejected: operator username is required.", type: 'error' });
      return;
    }
    if (!loginPassword) {
      setStatusMessage({ text: "Authentication rejected: hardware passkey is required.", type: 'error' });
      return;
    }

    setIsSubmitting(true);

    // Simulate cryptographic handshake authentication sequence
    setTimeout(() => {
      setIsSubmitting(false);

      // Fetch saved users in localStorage
      const usersRaw = localStorage.getItem('aura_registered_users');
      const users: SavedUser[] = usersRaw ? JSON.parse(usersRaw) : [];

      const targetUser = users.find(
        u => u.username.toLowerCase() === loginUsername.trim().toLowerCase() && 
             u.passwordHash === loginPassword
      );

      if (targetUser) {
        const session: UserSession = {
          username: targetUser.username,
          role: targetUser.role,
          clearanceLevel: targetUser.clearanceLevel,
          isAuthenticated: true
        };
        onLoginSuccess(session);
      } else {
        setStatusMessage({ 
          text: "CRYPTO_KEY_MISMATCH: The credentials submitted do not match our authorized neural registry.", 
          type: 'error' 
        });
      }
    }, 1500);
  };

  // Process and simulate Secure Sign Up / Registration Sequence
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validation
    if (!signupFullName.trim()) {
      setStatusMessage({ text: "Registration failure: full officer name is required.", type: 'error' });
      return;
    }
    if (!signupUsername.trim()) {
      setStatusMessage({ text: "Registration failure: security Operator ID is required.", type: 'error' });
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setStatusMessage({ text: "Registration failure: valid military/gov email identifier is required.", type: 'error' });
      return;
    }
    if (signupPassword.length < 6) {
      setStatusMessage({ text: "Registration failure: passkey must be at least 6 cybernetic character units.", type: 'error' });
      return;
    }
    if (signupPassword !== signupConfirmPassword) {
      setStatusMessage({ text: "Registration failure: passkey confirmation mismatch.", type: 'error' });
      return;
    }
    if (!termsAccepted) {
      setStatusMessage({ text: "Registration failure: core security protocol guidelines must be accepted.", type: 'error' });
      return;
    }

    setIsSubmitting(true);
    setRegistrationSteps([
      "Establishing localized secure quantum handshake...",
      "Hashing security passkeys through SHA-512 crypt-core...",
      "Validating regional authorization clearance protocols...",
      "Writing operator signature block to global neural ledger...",
      "Registration Approved. Discharging credentials!"
    ]);
    setActiveStepIndex(0);

    // Dynamic countdown/progress sequence for the Registration Steps
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      setActiveStepIndex(currentStep);

      if (currentStep >= 5) {
        clearInterval(interval);
        
        // Save user into simulated persistent database
        const usersRaw = localStorage.getItem('aura_registered_users');
        const users: SavedUser[] = usersRaw ? JSON.parse(usersRaw) : [];

        // Check for duplicates
        const exists = users.some(u => u.username.toLowerCase() === signupUsername.trim().toLowerCase());
        if (exists) {
          setIsSubmitting(false);
          setActiveStepIndex(-1);
          setStatusMessage({ 
            text: `REGISTRY_CONFLICT: Operator ID '${signupUsername}' is already active in the AURA neural directory.`, 
            type: 'error' 
          });
          return;
        }

        const newUser: SavedUser = {
          username: signupUsername.trim(),
          fullName: signupFullName.trim(),
          email: signupEmail.trim(),
          role: signupRole,
          clearanceLevel: signupClearance,
          passwordHash: signupPassword
        };

        users.push(newUser);
        localStorage.setItem('aura_registered_users', JSON.stringify(users));

        // Let registration step finish with success
        setTimeout(() => {
          setIsSubmitting(false);
          setActiveStepIndex(-1);
          setStatusMessage({ 
            text: "Profile Registered Successfully! Log in using your credentials.", 
            type: 'success' 
          });
          
          // Pre-populate login form and switch to login view for smooth UX
          setLoginUsername(signupUsername.trim());
          setLoginPassword(signupPassword);
          setAuthMode('login');

          // Reset signup states
          setSignupFullName('');
          setSignupUsername('');
          setSignupEmail('');
          setSignupPassword('');
          setSignupConfirmPassword('');
          setSignupCode('');
        }, 1000);
      }
    }, 800);
  };

  // SSO device handshake flow
  const startSsoLogin = () => {
    setShowSsoModal(true);
    setSsoStep('scan');
    setSsoProgress(0);
  };

  const handleSsoAuthenticate = () => {
    setSsoStep('verifying');
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setSsoProgress(currentProgress);
      if (currentProgress >= 100) {
        clearInterval(interval);
        setSsoStep('success');
        setTimeout(() => {
          setShowSsoModal(false);
          onLoginSuccess({
            username: 'sso_authorized_commander',
            role: 'JOINT COMMAND SECURITY',
            clearanceLevel: 'LEVEL 4 (ALPHA)',
            isAuthenticated: true
          });
        }, 1000);
      }
    }, 150);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;

    setForgotSuccess(true);
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#080B11] text-white flex items-center justify-center p-4 relative overflow-y-auto no-scrollbar cyber-grid animate-scan"
      id="signin-screen-root"
    >
      {/* Background shadow & atmospheric elements */}
      <div className="absolute inset-0 bg-[#080B11]/50 backdrop-blur-[1px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full border border-brand-gold/5 animate-pulse-slow pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-120 h-120 rounded-full border border-brand-gold/5 animate-pulse-slow pointer-events-none" />

      {/* Main card box */}
      <div 
        className="w-full max-w-[440px] bg-[#0F131C]/95 border border-[#1A2130] rounded-xl p-8 shadow-2xl relative z-10 animate-fade-in my-8"
        id="login-card-container"
      >
        {/* Glowing Top Frame Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-gold to-transparent rounded-t-xl" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3 mb-6" id="login-brand-header">
          <AuraLogo size={90} animate={isSubmitting} />
          
          <div className="space-y-0.5">
            <h1 className="text-3xl font-bold tracking-[0.25em] text-white">
              AURA
            </h1>
            <p className="text-[10px] font-semibold tracking-[0.4em] text-brand-gold">
              ENERGY RESPONSE SYSTEM
            </p>
            <p className="text-[8px] text-gray-500 tracking-[0.25em] uppercase font-mono">
              PREDICT • SIMULATE • PROTECT
            </p>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs */}
        {!isSubmitting && (
          <div className="grid grid-cols-2 bg-[#080B11] p-1 rounded-lg border border-[#252E3E] mb-5 font-mono text-[10px] uppercase font-bold tracking-wider">
            <button
              onClick={() => {
                setAuthMode('login');
                setStatusMessage(null);
              }}
              className={`py-2 px-3 rounded text-center transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-brand-gold text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Sign In Terminal
            </button>
            <button
              onClick={() => {
                setAuthMode('signup');
                setStatusMessage(null);
              }}
              className={`py-2 px-3 rounded text-center transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-brand-gold text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Register Profile
            </button>
          </div>
        )}

        {/* Quick fill helper block */}
        {!isSubmitting && (
          <div className="mb-5 p-2.5 bg-brand-gold/[0.03] border border-brand-gold/10 rounded-lg text-left flex items-center justify-between">
            <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest flex items-center gap-1">
              <span className="h-1 w-1 rounded-full bg-brand-gold animate-ping" />
              Developer Assist tool
            </span>
            <button 
              onClick={handleQuickFill}
              className="text-[9px] font-mono text-brand-gold hover:underline bg-brand-gold/10 hover:bg-brand-gold/20 px-2 py-0.5 rounded transition-all font-bold"
            >
              Autofill {authMode === 'login' ? 'Nexus Login' : 'New Officer Form'}
            </button>
          </div>
        )}

        {/* Alerts / Error Indicators */}
        {statusMessage && !isSubmitting && (
          <div className={`mb-5 p-3 rounded-lg text-left border font-mono text-[11px] leading-relaxed ${
            statusMessage.type === 'error' 
              ? 'bg-red-950/25 border-red-900/40 text-red-400' 
              : 'bg-green-950/25 border-green-900/40 text-tactical-green'
          }`} id="auth-status-alert">
            <span className="font-bold mr-1">[{statusMessage.type === 'error' ? 'REJECTED' : 'APPROVED'}]</span>
            {statusMessage.text}
          </div>
        )}

        {/* Simulated Handshake Loading screen during registration or sign in */}
        {isSubmitting && (
          <div className="py-6 space-y-4 font-mono text-left" id="cybernetic-processing-state">
            <div className="flex items-center gap-2.5 text-brand-gold">
              <Loader className="h-4 w-4 animate-spin" />
              <span className="text-xs font-bold tracking-wider uppercase">
                {authMode === 'login' ? "UPLINKING CRITICAL HANDSHAKE..." : "RESERVED SIGNATURE REGISTRATION..."}
              </span>
            </div>

            {authMode === 'signup' && activeStepIndex >= 0 ? (
              <div className="space-y-2 bg-[#080B11] border border-[#252E3E] rounded-lg p-4 text-[10px] text-gray-400">
                {registrationSteps.map((step, idx) => {
                  const isPast = idx < activeStepIndex;
                  const isActive = idx === activeStepIndex;
                  return (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={isPast ? "text-tactical-green" : isActive ? "text-brand-gold" : "text-gray-700"}>
                        {isPast ? "✓" : isActive ? "▶" : "○"}
                      </span>
                      <span className={`${isActive ? 'text-white font-bold' : isPast ? 'text-gray-500' : 'text-gray-600'}`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-[#080B11] border border-[#252E3E] rounded-lg p-3 text-[10px] text-gray-500">
                &gt; Security handshake packet dispatched to 0.0.0.0:3000...<br />
                &gt; Synchronizing clearance levels with core directory ledger...
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Sign In form */}
        {!isSubmitting && authMode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono text-gray-400 tracking-wider uppercase font-medium">
                Authorized Operator ID
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <User className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin_nexus"
                  className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2.5 pl-10 pr-4 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60 focus:ring-1 focus:ring-brand-gold/20 transition-all"
                  id="input-username"
                />
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-mono text-gray-400 tracking-wider uppercase font-medium">
                Security Passkey (Password)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="aura-protocol-9"
                  className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2.5 pl-10 pr-10 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60 focus:ring-1 focus:ring-brand-gold/20 transition-all"
                  id="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-brand-gold transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot options */}
            <div className="flex items-center justify-between text-xs font-mono pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-gray-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-[#080B11] border-[#252E3E] text-brand-gold focus:ring-brand-gold/20 focus:ring-offset-0 focus:ring-1 h-3.5 w-3.5 cursor-pointer accent-brand-gold"
                  id="checkbox-remember-me"
                />
                <span>Save credentials</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-brand-gold/80 hover:text-brand-gold font-bold transition-colors hover:underline"
              >
                Reset Access Code?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-gold-dark to-brand-gold hover:from-brand-gold hover:to-[#FFF] text-black font-sans font-bold tracking-[0.15em] uppercase py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-brand-gold/25 cursor-pointer text-sm font-semibold mt-4"
            >
              <span>Authenticate Session</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Tab 2: Sign Up / Register form */}
        {!isSubmitting && authMode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5" id="signup-form">
            
            {/* Full Name field */}
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                Officer Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                  <User className="h-3.5 w-3.5" />
                </span>
                <input
                  type="text"
                  value={signupFullName}
                  onChange={(e) => setSignupFullName(e.target.value)}
                  placeholder="Lieutenant J. Doe"
                  className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                  id="signup-fullname"
                />
              </div>
            </div>

            {/* Username & Email row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                  Operator ID (Username)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                    <AtSign className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="operator_1a"
                    className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                    id="signup-username"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                  Security Email
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-gray-500">
                    <Mail className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="doe@aura.mil"
                    className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 pl-9 pr-3 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                    id="signup-email"
                  />
                </div>
              </div>
            </div>

            {/* Role & Clearance mapping */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                  Designated Officer Role
                </label>
                <select
                  value={signupRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 px-3 text-xs font-mono text-white focus:outline-none focus:border-brand-gold/60 cursor-pointer"
                  id="signup-role"
                >
                  <option value="GRID DEFENSE ANALYST">Defense Analyst</option>
                  <option value="REGIONAL DEFENSE ANALYST">Regional Analyst</option>
                  <option value="JOINT COMMAND SECURITY">Joint Command</option>
                  <option value="NEXUS COMMANDER">Nexus Commander</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                  Clearance Level Group
                </label>
                <input
                  type="text"
                  value={signupClearance}
                  disabled
                  className="w-full bg-[#131924] border border-[#252E3E] rounded-lg py-2 px-3 text-xs font-mono text-gray-500 focus:outline-none"
                  id="signup-clearance"
                />
              </div>
            </div>

            {/* Passkey & confirm passkey row */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                  Security Passkey
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 px-3 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                  id="signup-password"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase">
                  Verify Passkey
                </label>
                <input
                  type="password"
                  value={signupConfirmPassword}
                  onChange={(e) => setSignupConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 px-3 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                  id="signup-confirm-password"
                />
              </div>
            </div>

            {/* Optional security authorization token for realism */}
            <div className="space-y-1 text-left">
              <label className="text-[9px] font-mono text-gray-400 tracking-wider uppercase flex justify-between">
                <span>Security Authorization Code</span>
                <span className="text-brand-gold text-[8px] font-bold">Recommended: AURA-SECURE-9</span>
              </label>
              <input
                type="text"
                value={signupCode}
                onChange={(e) => setSignupCode(e.target.value)}
                placeholder="AURA-XXXX-X"
                className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 px-3 text-xs font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                id="signup-authcode"
              />
            </div>

            {/* Terms checkpoint */}
            <div className="pt-1.5 text-left">
              <label className="flex items-start gap-2 cursor-pointer select-none text-[10px] font-mono text-gray-400 hover:text-white transition-colors">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="rounded bg-[#080B11] border-[#252E3E] text-brand-gold focus:ring-brand-gold/20 focus:ring-offset-0 focus:ring-1 h-3.5 w-3.5 cursor-pointer accent-brand-gold mt-0.5"
                  id="signup-terms"
                />
                <span className="leading-normal">
                  I pledge to uphold AURA National Security directives and follow secure energy resource management procedures.
                </span>
              </label>
            </div>

            {/* Registration button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-gold-dark to-brand-gold hover:from-brand-gold hover:to-[#FFF] text-black font-sans font-bold tracking-[0.12em] uppercase py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all duration-300 shadow-md hover:shadow-brand-gold/25 cursor-pointer text-xs mt-3.5"
            >
              <span>Provision Officer Profile</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Unified SSO Integration button */}
        {!isSubmitting && (
          <div className="space-y-4 mt-5" id="sso-section">
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-[#1A2130]" />
              <span className="flex-shrink mx-3 text-[9px] font-mono text-gray-500 tracking-[0.2em] uppercase">
                OR INTERCEPT WITH KEY
              </span>
              <div className="flex-grow border-t border-[#1A2130]" />
            </div>

            <button
              type="button"
              onClick={startSsoLogin}
              className="w-full bg-[#080B11] border border-[#252E3E] hover:border-brand-gold/30 hover:bg-brand-gold/[0.02] text-xs font-mono text-gray-300 hover:text-white py-2.5 rounded-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              id="button-sso-login"
            >
              <Key className="h-4 w-4 text-brand-gold" />
              <span>Decrypt with Hardware Key</span>
            </button>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-2 text-[9px] font-mono text-gray-500 tracking-wider uppercase border-t border-[#1A2130]/60 pt-4" id="login-card-footer">
          <ShieldCheck className="h-3.5 w-3.5 text-brand-gold/60" />
          <span>Secured by AURA Defense Protocol</span>
        </div>
      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 z-50 backdrop-blur-md animate-fade-in" id="forgot-modal">
          <div className="w-full max-w-sm bg-[#0F131C] border border-[#252E3E] rounded-xl p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gold rounded-t-xl" />
            
            <h2 className="text-md font-bold font-sans tracking-wider text-white mb-2 flex items-center gap-2 uppercase">
              <HelpCircle className="h-5 w-5 text-brand-gold" />
              Clearance Recovery
            </h2>
            <p className="text-xs font-mono text-gray-400 mb-4 leading-relaxed text-left">
              Enter your registered officer email address. A hardware-linked crypt-key recovery sequence will be dispatched upon validation.
            </p>

            {forgotSuccess ? (
              <div className="p-3 bg-brand-gold/10 border border-brand-gold/20 rounded-lg text-left animate-pulse">
                <p className="text-[11px] font-mono text-brand-gold">
                  [SUCCESS] Cryptographic reset token sent to secure mail server. Check authorized receiver.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-mono text-gray-400 uppercase">Secure Email Identifier</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="officer@aura.mil"
                    className="w-full bg-[#080B11] border border-[#252E3E] rounded-lg py-2 px-3 text-sm font-mono text-white placeholder-gray-700 focus:outline-none focus:border-brand-gold/60"
                  />
                </div>
                
                <div className="flex gap-2 justify-end text-xs font-mono pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-1.5 rounded text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-brand-gold text-black rounded font-bold hover:bg-[#FFF] transition-colors"
                  >
                    Dispatch Key
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= SSO SECURE DEVICE MODAL ================= */}
      {showSsoModal && (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/85 z-50 backdrop-blur-md animate-fade-in" id="sso-modal">
          <div className="w-full max-w-sm bg-[#0F131C] border border-[#252E3E] rounded-xl p-6 text-center relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-gold rounded-t-xl" />

            {ssoStep === 'scan' && (
              <div className="space-y-5 py-4" id="sso-step-scan">
                <div className="mx-auto w-16 h-16 rounded-full bg-brand-gold/5 flex items-center justify-center border border-brand-gold/20 animate-pulse">
                  <Key className="h-7 w-7 text-brand-gold" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold tracking-wide text-white">Hardware SSO Vault</h3>
                  <p className="text-xs font-mono text-gray-400 px-2 leading-relaxed">
                    Insert your physical FIDO2 cryptographic key into the USB port or trigger biometric response node.
                  </p>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleSsoAuthenticate}
                    className="w-full bg-brand-gold text-black font-mono font-bold text-xs py-2.5 rounded-lg hover:bg-white transition-colors uppercase tracking-wider"
                  >
                    Simulate Handshake
                  </button>
                  <button
                    onClick={() => setShowSsoModal(false)}
                    className="text-xs font-mono text-gray-500 hover:text-gray-300 py-1"
                  >
                    Abort Connection
                  </button>
                </div>
              </div>
            )}

            {ssoStep === 'verifying' && (
              <div className="space-y-5 py-6" id="sso-step-verifying">
                <div className="relative mx-auto w-16 h-16 rounded-full border border-brand-gold/10 flex items-center justify-center">
                  <Loader className="h-7 w-7 text-brand-gold animate-spin" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-mono text-brand-gold font-bold uppercase tracking-wider">Verifying Crypt Token</h3>
                  <p className="text-[11px] font-mono text-gray-500">Decrypting hardware handshake envelope...</p>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1 bg-[#1A2130] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-gold transition-all duration-150"
                    style={{ width: `${ssoProgress}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-gray-400">{ssoProgress}%</span>
              </div>
            )}

            {ssoStep === 'success' && (
              <div className="space-y-5 py-6" id="sso-step-success">
                <div className="mx-auto w-16 h-16 rounded-full bg-green-950/20 flex items-center justify-center border border-green-500/40 text-green-400">
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-md font-bold tracking-wide text-green-400">Handshake Complete</h3>
                  <p className="text-xs font-mono text-gray-400 leading-relaxed">
                    Identity validation token generated. Connecting session to command grid...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
