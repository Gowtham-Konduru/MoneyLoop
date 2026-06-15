import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, TrendingUp, Shield, Zap, BarChart3, Users, Star, CheckCircle, ArrowDownLeft, DollarSign, Target, Sparkles, X } from 'lucide-react';
import MoneyLoopLogo from './ui/MoneyLoopLogo';

export default function LandingPage({ onAuth }: { onAuth?: (mode: 'login' | 'register') => void }) {
  const [activeSection, setActiveSection] = useState('hero');
  const [showDemoModal, setShowDemoModal] = useState(false);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGetStarted = () => {
    if (onAuth) {
      onAuth('register');
      return;
    }
    // Navigate to dashboard after "Get Started" or "View Demo"
    window.location.hash = '#dashboard';
    // Set authentication state to true
    if (typeof window !== 'undefined') {
      (window as any).setAuthenticated(true);
    }
  };

  const handleSignIn = () => {
    if (onAuth) {
      onAuth('login');
      return;
    }
    window.location.hash = '#sign-in';
  };

  const handleViewDemo = () => {
    setShowDemoModal(true);
  };

  // Check if user is already authenticated when component mounts
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthenticated = (window as any).getAuthenticated?.() || false;
      if (isAuthenticated) {
        // If already authenticated, navigate to dashboard
        window.location.hash = '#dashboard';
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navigation Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <MoneyLoopLogo size="lg" />
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                MoneyLoop
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-6">
              {[
                { id: 'hero', label: 'Home', icon: null },
                { id: 'features', label: 'Features', icon: null },
                { id: 'how-it-works', label: 'How It Works', icon: null },
                { id: 'pricing', label: 'Pricing', icon: null },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`px-4 py-2.5 rounded-xl font-medium transition-all ${activeSection === item.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-indigo-600 hover:bg-indigo-50'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="flex gap-4">
              <button
                onClick={handleSignIn}
                className="px-6 py-2.5 bg-white border-2 border-indigo-200 text-indigo-600 rounded-xl font-semibold hover:border-indigo-300 hover:shadow-md transition-all"
              >
                Sign In
              </button>
              <button
                onClick={handleGetStarted}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center lg:text-left"
            >
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Smart Finance Management
                <br />
                <span className="text-3xl md:text-5xl">Made Simple</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto lg:mx-0 leading-relaxed">
                Take control of your financial future with AI-powered insights,
                intelligent budget tracking, and personalized recommendations.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12">
                <button
                  onClick={handleGetStarted}
                  className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <DollarSign className="w-6 h-6" />
                  Start Free Trial
                </button>
                <button onClick={handleViewDemo} className="px-8 py-4 bg-white border-2 border-indigo-200 text-indigo-600 rounded-2xl font-semibold hover:border-indigo-300 hover:shadow-md transition-all flex items-center gap-2">
                  <Sparkles className="w-6 h-6" />
                  View Demo
                </button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <img 
                src="/finance-hero.svg" 
                alt="Finance Hero Animation" 
                className="w-full max-w-md h-auto"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Manage Your Money
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to give you complete control over your financial life
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: BarChart3,
                title: 'Smart Analytics',
                description: 'AI-powered insights and detailed financial reports to help you make better decisions.',
                gradient: 'from-blue-500 to-cyan-600'
              },
              {
                icon: Shield,
                title: 'Bank-Level Security',
                description: 'Your financial data is protected with enterprise-grade encryption and security measures.',
                gradient: 'from-green-500 to-emerald-600'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Real-time updates and instant transaction processing for up-to-the-minute accuracy.',
                gradient: 'from-purple-500 to-pink-600'
              },
              {
                icon: Target,
                title: 'Goal Tracking',
                description: 'Set savings goals and track your progress with intelligent recommendations.',
                gradient: 'from-orange-500 to-red-600'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="p-8 bg-gradient-to-br from-gray-50 to-white rounded-3xl border-2 border-gray-100 hover:border-indigo-200 hover:shadow-2xl transition-all">
                  <div className={`p-4 bg-gradient-to-br ${feature.gradient} rounded-2xl mb-6 group-hover:scale-105 transition-transform`}>
                    <feature.icon className="w-12 h-12 text-white mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How MoneyLoop
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Works For You
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-12">
              Get started in minutes and transform your financial management experience
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                title: 'Connect Your Accounts',
                description: 'Securely link all your bank accounts and credit cards in one place.',
                icon: Users
              },
              {
                step: 2,
                title: 'Track Everything',
                description: 'Automatically categorize transactions and monitor spending in real-time.',
                icon: BarChart3
              },
              {
                step: 3,
                title: 'Get Insights',
                description: 'Receive AI-powered recommendations to optimize your financial decisions.',
                icon: TrendingUp
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex gap-6"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {step.step}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Pricing
              </span>
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Choose the plan that works best for your financial needs
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'Perfect for getting started',
                features: ['Basic tracking', 'Monthly reports', 'Email support'],
                gradient: 'from-gray-500 to-gray-600',
                popular: false
              },
              {
                name: 'Professional',
                price: '₹99/month',
                description: 'Most popular choice',
                features: ['Everything in Starter', 'AI insights', 'Real-time alerts', 'Priority support'],
                gradient: 'from-indigo-500 to-purple-600',
                popular: true
              },
              {
                name: 'Business',
                price: '₹249/month',
                description: 'For power users',
                features: ['Everything in Professional', 'Advanced analytics', 'API access', 'Dedicated support'],
                gradient: 'from-purple-500 to-pink-600',
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 bg-gradient-to-br ${plan.gradient} rounded-3xl border-2 ${plan.popular ? 'border-indigo-400 shadow-2xl scale-105' : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                  } transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 -right-4 px-3 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-full">
                    Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-white mb-4">{plan.price}</p>
                  <p className="text-white/80 text-sm">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                      <span className="text-white text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors"
                >
                  Get Started
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-lg font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 pt-8 text-center">
            <p className="text-gray-400">
              © 2026 MoneyLoop. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Demo Modal */}
      <AnimatePresence>
        {showDemoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDemoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">App Demo Screens</h2>
                <button
                  onClick={() => setShowDemoModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
                    <img 
                      src="/demo-dashboard.svg" 
                      alt="Dashboard Demo" 
                      className="w-full h-auto rounded-2xl border border-gray-200"
                    />
                    <p className="text-sm text-gray-600">Track your balance, income, and expenses at a glance.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Budget Management</h3>
                    <img 
                      src="/demo-budget.svg" 
                      alt="Budget Demo" 
                      className="w-full h-auto rounded-2xl border border-gray-200"
                    />
                    <p className="text-sm text-gray-600">Set and manage budget categories with spending limits.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
                    <img 
                      src="/demo-analytics.svg" 
                      alt="Analytics Demo" 
                      className="w-full h-auto rounded-2xl border border-gray-200"
                    />
                    <p className="text-sm text-gray-600">View detailed analytics and spending trends.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    handleGetStarted();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  Try It Now - Start Free Trial
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
