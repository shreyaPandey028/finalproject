import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, NavLink } from 'react-router';
import { registerUser } from '../authSlice';
import { Code2, Mail, Lock, User, RefreshCw, ArrowRight, Shield, Github } from 'lucide-react';

const signupSchema = z.object({
  firstName: z.string().min(3, "Minimum character should be 3"),
  emailId: z.string().email("Invalid Email"),
  password: z.string().min(8, "Password is too weak")
});

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaCode, setCaptchaCode] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(signupSchema) });

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaVerified(false);
    setUserCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const verifyCaptcha = () => {
    if (userCaptchaInput === captchaCode) {
      setCaptchaVerified(true);
    } else {
      setCaptchaVerified(false);
      alert('Incorrect CAPTCHA. Please try again.');
      generateCaptcha();
    }
  };

  const onSubmit = (data) => {
    if (!captchaVerified) {
      alert('Please verify the CAPTCHA first.');
      return;
    }
    dispatch(registerUser(data));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse-slower"></div>
        </div>

        <div className="relative z-10 space-y-8 animate-fade-in-left">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group mb-12">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative bg-blue-600 p-3 rounded-lg group-hover:bg-blue-500 transition-all">
                <Code2 className="w-8 h-8 text-white" strokeWidth={2.5} />
              </div>
            </div>
            <div>
              <span className="text-3xl font-bold text-white tracking-tight">Head-2-Code</span>
              <div className="text-sm text-slate-400 font-medium">Master Your Coding Skills</div>
            </div>
          </NavLink>

          {/* Hero Content */}
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-white leading-tight">
              Start Your Coding Journey Today
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Join thousands of developers mastering algorithms and data structures. Practice, compete, and excel.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 pt-6">
            {[
              { icon: '🎯', title: '2000+ Problems', desc: 'From easy to expert' },
              { icon: '🏆', title: 'Live Contests', desc: 'Compete globally' },
              { icon: '💼', title: 'Interview Prep', desc: 'Top company questions' },
              { icon: '📚', title: 'Learn & Discuss', desc: 'Active community' }
            ].map((feature, i) => (
              <div 
                key={i}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 animate-fade-in-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-3xl mb-2">{feature.icon}</div>
                <div className="text-white font-semibold mb-1">{feature.title}</div>
                <div className="text-sm text-slate-400">{feature.desc}</div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-8">
            {[
              { value: '50K+', label: 'Active Users' },
              { value: '500+', label: 'Companies' },
              { value: '95%', label: 'Success Rate' }
            ].map((stat, i) => (
              <div key={i} className="animate-fade-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="text-3xl font-bold text-blue-400">{stat.value}</div>
                <div className="text-sm text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative">
        <div className="w-full max-w-md animate-fade-in-right">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2.5 rounded-lg">
                <Code2 className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-2xl font-bold text-white">Head-2-Code</span>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 shadow-xl hover:border-blue-500/30 transition-all">
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
              <p className="text-slate-400">Join our coding community</p>
            </div>

            {/* Social Login Buttons */}
            <div className="space-y-3 mb-6">
              <button className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3 group">
                <Github className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                <span>Continue with GitHub</span>
              </button>

              <button className="w-full bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02] flex items-center justify-center gap-3">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-slate-900 text-slate-400 text-sm">or continue with email</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-5">
              {/* First Name */}
              <div className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <label className="block text-sm font-semibold text-slate-300 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="John"
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-800 border ${
                      errors.firstName ? 'border-rose-500/50' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                    {...register('firstName')}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-rose-400 text-sm mt-2 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.firstName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    placeholder="john@example.com"
                    className={`w-full pl-12 pr-4 py-3.5 bg-slate-800 border ${
                      errors.emailId ? 'border-rose-500/50' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                    {...register('emailId')}
                  />
                </div>
                {errors.emailId && (
                  <p className="text-rose-400 text-sm mt-2 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.emailId.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="animate-slide-in" style={{ animationDelay: '0.3s' }}>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`w-full pl-12 pr-12 py-3.5 bg-slate-800 border ${
                      errors.password ? 'border-rose-500/50' : 'border-slate-700'
                    } rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-rose-400 text-sm mt-2 flex items-center gap-1">
                    <span className="w-4 h-4">⚠️</span>
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* CAPTCHA */}
              <div className="animate-slide-in" style={{ animationDelay: '0.4s' }}>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Verify You're Human</label>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 flex items-center justify-center gap-2">
                    <Shield className="w-5 h-5 text-blue-400" />
                    <span className="text-2xl font-bold tracking-widest text-white select-none">
                      {captchaCode}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generateCaptcha}
                    className="p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all hover:scale-105 group"
                    title="Refresh CAPTCHA"
                  >
                    <RefreshCw className="w-5 h-5 text-slate-400 group-hover:text-white group-hover:rotate-180 transition-all duration-300" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter the code above"
                    value={userCaptchaInput}
                    onChange={(e) => setUserCaptchaInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={verifyCaptcha}
                    disabled={!userCaptchaInput}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-xl transition-all disabled:cursor-not-allowed hover:scale-105"
                  >
                    Verify
                  </button>
                </div>
                {captchaVerified && (
                  <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm animate-fade-in">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="font-semibold">Verified successfully!</span>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={loading || !captchaVerified}
                className="w-full relative group mt-8 animate-slide-in"
                style={{ animationDelay: '0.5s' }}
              >
                <div className={`bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-6 rounded-xl transition-all ${
                  loading || !captchaVerified ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/20'
                }`}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Creating Your Account...</span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>Create Account</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </div>
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <span className="text-slate-400">
                Already have an account?{' '}
                <NavLink to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Sign in
                </NavLink>
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 space-y-3 animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <p className="text-slate-500 text-sm">
              By signing up, you agree to our{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="text-blue-400 hover:text-blue-300 transition-colors">Privacy Policy</a>
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Your data is secure and encrypted</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.1;
            transform: scale(1);
          }
          50% {
            opacity: 0.15;
            transform: scale(1.1);
          }
        }

        @keyframes pulse-slower {
          0%, 100% {
            opacity: 0.08;
            transform: scale(1);
          }
          50% {
            opacity: 0.12;
            transform: scale(1.05);
          }
        }

        .animate-fade-in-left {
          animation: fade-in-left 0.8s ease-out;
        }

        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
          animation-fill-mode: both;
        }

        .animate-slide-in {
          animation: slide-in 0.5s ease-out;
          animation-fill-mode: both;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-slower {
          animation: pulse-slower 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default Signup;