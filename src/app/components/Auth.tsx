import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User, Phone, ArrowRight, Sparkles, Shield, Zap, TrendingUp, ArrowLeft } from 'lucide-react';
import MoneyLoopLogo from './ui/MoneyLoopLogo';
import { apiService } from '../services/api';
import { useGoogleLogin } from '@react-oauth/google';

interface AuthProps {
  onLogin: (user: { name: string, email: string }) => void;
  onBack?: () => void;
  mode?: 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'reset-password';
  onSwitchMode?: (mode: 'login' | 'register' | 'forgot-password' | 'verify-otp' | 'reset-password') => void;
}

export default function Auth({ onLogin, onBack, mode = 'login', onSwitchMode }: AuthProps) {
  const isLogin = mode === 'login';
  const isRegister = mode === 'register';
  const isForgotPassword = mode === 'forgot-password';
  const isVerifyOtp = mode === 'verify-otp';
  const isResetPassword = mode === 'reset-password';
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({ identifier: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [resetData, setResetData] = useState({ email: '', otp: '', newPassword: '' });
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);

  // Countdown timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isVerifyOtp && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerifyOtp, otpTimer]);

  // Reset timer when switching to verify-otp mode
  useEffect(() => {
    if (isVerifyOtp) {
      setOtpTimer(60);
      setCanResendOtp(false);
    }
  }, [isVerifyOtp]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiService.login(loginData.identifier, loginData.password);
      setIsLoading(false);
      if (response.success && response.data) {
        const user = response.data.user as any;
        onLogin({ name: user.username || user.firstName, email: user.email });
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.message || 'Login failed');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.password !== registerData.confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiService.register({
        email: registerData.email,
        password: registerData.password,
        username: registerData.name,
        phoneNumber: registerData.phone
      } as any);
      setIsLoading(false);
      if (response.success && response.data) {
        alert('Account created successfully! Please sign in to continue.');
        // Redirect to sign-in page instead of directly logging in
        if (onSwitchMode) onSwitchMode('login');
        // Clear registration data
        setRegisterData({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.message || 'Registration failed');
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiService.sendOtp(resetData.email);
      setIsLoading(false);
      if (response.success) {
        alert('OTP sent to ' + resetData.email);
        if (onSwitchMode) onSwitchMode('verify-otp');
      } else {
        setErrorMsg(response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiService.verifyOtp(resetData.email, resetData.otp);
      setIsLoading(false);
      if (response.success) {
        if (onSwitchMode) onSwitchMode('reset-password');
      } else {
        setErrorMsg(response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.message || 'Invalid OTP');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      const response = await apiService.resetPassword(resetData.email, resetData.otp, resetData.newPassword);
      setIsLoading(false);
      if (response.success) {
        alert('Password reset successfully');
        setResetData({ email: '', otp: '', newPassword: '' });
        if (onSwitchMode) onSwitchMode('login');
      } else {
        setErrorMsg(response.message || 'Failed to reset password');
      }
    } catch (error: any) {
      setIsLoading(false);
      setErrorMsg(error.message || 'Failed to reset password');
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const response = await apiService.googleLogin(tokenResponse.access_token);
        if (response.success && response.data) {
          const user = response.data.user as any;
          onLogin({ name: user.username || user.firstName, email: user.email });
        }
      } catch (error: any) {
        setErrorMsg(error.message || 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    onError: () => setErrorMsg('Google login failed')
  });

  return (
    <div className="size-full relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [0, -90, 0],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-600 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            x: [-100, 100, -100],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-96 h-96 bg-violet-600 rounded-full blur-3xl"
        />
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, Math.random() * window.innerHeight],
              x: [null, Math.random() * window.innerWidth],
            }}
            transition={{
              duration: Math.random() * 10 + 20,
              repeat: Infinity,
              ease: "linear",
            }}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
          />
        ))}
      </div>

      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-4 left-4 md:top-8 md:left-8 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-lg text-white text-sm font-medium transition-all border border-white/20 shadow-lg hover:shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to Home</span>
        </button>
      )}

      {/* Main Content */}
      <div className="relative z-10 size-full flex items-center justify-center p-4 md:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-center my-auto">
          {/* Left Side - Branding */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-white space-y-8 hidden lg:block"
          >
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
                <MoneyLoopLogo size="xl" className="text-white" animated={false} />
              </div>
              <div>
                <h1 className="text-5xl font-bold">MoneyLoop</h1>
                <p className="text-xl text-white/80">AI Finance</p>
              </div>
            </div>

            {/* Tagline */}
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Your money. Your context.
                <br />
                <span className="bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  Your AI.
                </span>
              </h2>
              <p className="text-lg text-white/90">
                AI-first personal finance that understands your context and helps you achieve financial freedom.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Bank-level security with 256-bit encryption' },
                { icon: Zap, text: 'Real-time transaction tracking and alerts' },
                { icon: TrendingUp, text: 'AI-powered financial insights & predictions' },
              ].map((feature, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + idx * 0.1 }}
                  className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <div className="p-3 bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl border border-white/30">
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <span className="text-white/90">{feature.text}</span>
                </motion.div>
              ))}
            </div>

                      </motion.div>

          {/* Right Side - Auth Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md mx-auto lg:max-w-none"
          >
            {/* Glass Card */}
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-4 md:p-6 lg:p-8 border border-white/20 shadow-2xl">
              {/* Mobile Logo */}
              <div className="lg:hidden flex items-center justify-center gap-3 mb-6">
                <div className="p-3 bg-white/20 backdrop-blur-xl rounded-2xl">
                  <MoneyLoopLogo size="lg" className="text-white" animated={false} />
                </div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">MoneyLoop</h1>
                  <p className="text-sm text-white/80">AI Finance</p>
                </div>
              </div>

              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {isLogin ? 'Welcome Back' : 
                   isRegister ? 'Create Account' : 
                   isForgotPassword ? 'Reset Password' : 
                   'Verify OTP'}
                </h2>
                <p className="text-purple-200 text-sm">
                  {isLogin ? 'Sign in to access your dashboard' : 
                   isRegister ? 'Start your financial journey today' : 
                   isForgotPassword ? 'Enter your mobile number to receive an OTP' : 
                   'Enter the OTP sent to your mobile number'}
                </p>
              </div>

              {errorMsg && (
                <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
                  {errorMsg}
                </div>
              )}

              <AnimatePresence mode="wait">
                {isLogin ? (
                  <motion.form
                    key="login"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleLogin}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Username, Email, or Mobile Number
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                        <input
                          type="text"
                          value={loginData.identifier}
                          onChange={(e) => setLoginData({ ...loginData, identifier: e.target.value })}
                          placeholder="username, email, or mobile number"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-12 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-white/30 bg-white/20 text-purple-600 focus:ring-white/50"
                        />
                        <span className="text-sm text-purple-200">Remember me</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => onSwitchMode && onSwitchMode('forgot-password')}
                        className="text-sm text-purple-200 hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/30"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : isRegister ? (
                  <motion.form
                    key="register"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleRegister}
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-white text-xs font-medium mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                        <input
                          type="text"
                          value={registerData.name}
                          onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                          placeholder="John Doe"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white text-xs font-medium mb-1">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                        <input
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                          placeholder="you@example.com"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-white text-xs font-medium mb-1">
                        Phone Number
                      </label>
                      <div className="flex w-full bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-white/50 focus-within:border-transparent transition-all">
                        <div className="flex items-center pl-3 pr-2 py-2 border-r border-white/20 bg-white/5">
                          <Phone className="w-4 h-4 text-purple-300 mr-1.5 shrink-0" />
                          <span className="text-white text-sm font-medium whitespace-nowrap">IN +91</span>
                        </div>
                        <div className="relative flex-1">
                          <input
                            type="tel"
                            value={registerData.phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setRegisterData({ ...registerData, phone: val });
                            }}
                            placeholder="98765 43210"
                            required
                            className="w-full px-3 py-2 bg-transparent text-white text-sm placeholder-purple-300 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white text-xs font-medium mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full pl-9 pr-9 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-white text-xs font-medium mb-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full pl-9 pr-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-2 pt-1">
                      <input
                        type="checkbox"
                        required
                        className="w-3.5 h-3.5 mt-0.5 rounded border-white/30 bg-white/20 text-purple-600 focus:ring-white/50"
                      />
                      <label className="text-xs text-purple-200">
                        I agree to the{' '}
                        <button type="button" className="text-white hover:underline">
                          Terms of Service
                        </button>{' '}
                        and{' '}
                        <button type="button" className="text-white hover:underline">
                          Privacy Policy
                        </button>
                      </label>
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                      className="w-full py-3 mt-2 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white rounded-lg font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/30 text-sm"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : isForgotPassword ? (
                  <motion.form
                    key="forgot-password"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSendOtp}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                        <input
                          type="email"
                          value={resetData.email}
                          onChange={(e) => setResetData({ ...resetData, email: e.target.value })}
                          placeholder="your@email.com"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/30"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <span>Send OTP</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : isVerifyOtp ? (
                  <motion.form
                    key="verify-otp"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        Enter OTP
                      </label>
                      <div className="relative">
                        <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                        <input
                          type="text"
                          value={resetData.otp}
                          onChange={(e) => setResetData({ ...resetData, otp: e.target.value })}
                          placeholder="123456"
                          required
                          className="w-full pl-12 pr-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all tracking-widest text-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-purple-200">
                          {canResendOtp ? (
                            <button
                              type="button"
                              onClick={() => {
                                handleSendOtp({ preventDefault: () => {} } as React.FormEvent);
                              }}
                              className="text-white hover:underline font-medium"
                            >
                              Resend OTP
                            </button>
                          ) : (
                            `Resend OTP in ${otpTimer}s`
                          )}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/30"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify OTP</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="reset-password"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleResetPassword}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-white text-sm font-medium mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-300" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={resetData.newPassword}
                          onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                          placeholder="••••••••"
                          required
                          className="w-full pl-12 pr-12 py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white rounded-xl font-semibold shadow-lg shadow-white/20 hover:shadow-xl hover:shadow-white/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/30"
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Verifying & Resetting...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Social Login & Switch Mode Links */}
              {(isLogin || isRegister) && (
                <>
                  {/* Divider */}
                  <div className="flex items-center gap-4 my-5">
                    <div className="flex-1 h-px bg-white/20" />
                    <span className="text-sm text-purple-200">or continue with</span>
                    <div className="flex-1 h-px bg-white/20" />
                  </div>

                  {/* Social Login - Google Only */}
                  <motion.button
                    type="button"
                    onClick={() => googleLogin()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={isLoading}
                    className="w-full py-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl hover:bg-white/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="text-white font-medium">Continue with Google</span>
                  </motion.button>
                </>
              )}

              {/* Switch Mode Link */}
              <div className="mt-6 text-center">
                <p className="text-sm text-purple-200">
                  {(isForgotPassword || isVerifyOtp) ? (
                    <button
                      type="button"
                      onClick={() => onSwitchMode && onSwitchMode('login')}
                      className="text-white hover:underline font-semibold"
                    >
                      Back to Sign In
                    </button>
                  ) : (
                    <>
                      {isLogin ? "Don't have an account?" : "Already have an account?"}
                      {' '}
                      <button
                        type="button"
                        onClick={() => onSwitchMode && onSwitchMode(isLogin ? 'register' : 'login')}
                        className="text-white hover:underline font-semibold"
                      >
                        {isLogin ? "Sign up" : "Sign in"}
                      </button>
                    </>
                  )}
                </p>
              </div>

              {/* AI Badge */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-2 mt-5 text-xs text-purple-200"
              >
                <Sparkles className="w-3 h-3" />
                <span className="text-white/70">Secured with AI-powered protection</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
