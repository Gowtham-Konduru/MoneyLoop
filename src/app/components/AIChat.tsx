import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, User, Sparkles, TrendingUp, DollarSign, PieChart, Mic, Paperclip, MoreVertical, Copy, ThumbsUp, ThumbsDown, Trash2 } from 'lucide-react';
import MoneyLoopLogo from './ui/MoneyLoopLogo';
import { useFinance } from '../context/FinanceContext';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  suggestions?: string[];
}

const quickQuestions = [
  { icon: Sparkles, text: 'What can this app do?', color: 'from-indigo-500 to-indigo-600', emoji: '✨' },
  { icon: PieChart, text: 'Analyze my current finances', color: 'from-green-500 to-green-600', emoji: '📊' },
  { icon: TrendingUp, text: 'Show my spending trends', color: 'from-blue-500 to-blue-600', emoji: '📈' },
  { icon: DollarSign, text: 'How can I save 40%?', color: 'from-purple-500 to-purple-600', emoji: '💰' },
];

export default function AIChat({ onComplete }: { onComplete?: () => void }) {
  const { transactions, budgets, addTransaction, addBudget, addGoal, totalIncome, totalExpense, categoryData } = useFinance();
  
  // Load messages from localStorage on mount
  const loadMessages = (): Message[] => {
    try {
      const saved = localStorage.getItem('moneyloop_ai_messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        // Filter messages older than 1 month
        const filtered = parsed.filter((msg: any) => {
          const msgDate = new Date(msg.timestamp);
          return msgDate > oneMonthAgo;
        });
        
        return filtered.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
    return [
      {
        id: '1',
        text: 'Hello! 👋 I\'m MoneyLoop, your AI-first financial partner. I can help you analyze your spending, set budgets, or answer any questions about the app.\n\nTo get started with a personalized plan, you can tell me your monthly salary, or ask me anything!',
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['How does this app help me?', 'My salary is ₹50000', 'Analyze my data']
      },
    ];
  };

  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingSalary, setAwaitingSalary] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('moneyloop_ai_messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving messages:', error);
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const calculateBudgetSplit = (salary: number) => {
    const saving = salary * 0.40; // 40%
    const food = salary * 0.30; // 30%
    const shopping = salary * 0.15; // 15%
    const entertainment = salary * 0.15; // 15%
    
    return { food, shopping, entertainment, saving };
  };

  const handleSendMessage = (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      let botResponse: Message;
      const lowerText = text.toLowerCase().trim();

      // Priority 1: Greetings & Identity
      if (lowerText.match(/^(hi|hello|hey|hola|greetings)/) || lowerText.includes('who are you') || lowerText.includes('what is your name')) {
        botResponse = {
          id: Date.now().toString(),
          text: "Hello! I'm your MoneyLoop AI Assistant. 👋\n\nI'm here to help you master your finances. I can analyze your spending, set up custom budgets, and help you reach that 40% savings goal. \n\nHow can I help you today?",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Analyze my data', 'How to start?', 'App features']
        };
      }
      // Priority 2: App Features / General Help / User Goals
      else if (lowerText.includes('app') || lowerText.includes('feature') || lowerText.includes('help') || lowerText.includes('do') || lowerText.includes('work') || lowerText.includes('benefit') || lowerText.includes('why')) {
        botResponse = {
          id: Date.now().toString(),
          text: "MoneyLoop is more than just a tracker; it's a financial roadmap designed to help you achieve financial freedom. 🚀\n\nWhat users love about this app:\n• Clarity: Finally know exactly where every rupee goes.\n• The 40% Rule: I help you automatically prioritize saving 40% of your income before you spend a dime.\n• Zero Effort: Upload a bill, and I'll handle the data entry. Analyze your salary, and I'll build the budget.\n• AI Guidance: I'll warn you if you're spending too fast or missing your goals.\n\nCore Features:\n1. 📊 Smart Dashboard: Real-time stats at a glance.\n2. 🧾 Bill Processor: AI-powered bill extraction.\n3. 🤖 AI Assistant: Personalized advice (that's me!).\n4. 📈 Analytics: Deep-dive trends and spending patterns.\n\nReady to see your own analysis?",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Analyze my data', 'Show my trends', 'Set my salary']
        };
      }
      // Priority 3: Data Analysis & Trends
      else if (lowerText.includes('trend') || lowerText.includes('chart') || lowerText.includes('pattern') || lowerText.includes('show my spending trends') || lowerText === 'show my spending trends') {
        const hasData = transactions.length > 0 || budgets.length > 0;
        
        botResponse = {
          id: Date.now().toString(),
          text: hasData 
            ? `Your spending patterns are emerging! 📈\n\n• Top Category: ${categoryData.length > 0 ? categoryData[0].name : 'General'}\n• Savings Rate: ${totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(0) : '0'}%\n• Budget Status: ${budgets.length > 0 ? 'Active' : 'Not set'}\n\nI recommend checking the Analytics tab for the full visual breakdown of your trends!`
            : "I need a bit more data to show you trends! 📊 Try adding some transactions or setting up your salary first. Once you do, I can show you how your money moves over time.",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Set my salary', 'How to save more?', 'App features']
        };
      }
      else if (lowerText.includes('analyze') || lowerText.includes('finances') || lowerText.includes('report') || lowerText.includes('data') || (lowerText.includes('spending') && !lowerText.includes('trend'))) {
        const hasData = transactions.length > 0 || budgets.length > 0;
        
        botResponse = {
          id: Date.now().toString(),
          text: hasData 
            ? `Here is your current financial snapshot: 🧐\n\n• Income: ₹${totalIncome.toLocaleString()}\n• Expenses: ₹${totalExpense.toLocaleString()}\n• Current Balance: ₹${(totalIncome - totalExpense).toLocaleString()}\n\n${totalExpense > totalIncome * 0.7 ? "⚠️ You're spending over 70% of your income. Let's try to lower your shopping or entertainment expenses!" : "✅ Your finances look healthy! You're well on your way to your savings goals."}`
            : "I don't have any financial data to analyze yet! 📂 Start by telling me your monthly salary (e.g., 'My salary is 50000') and I'll help you set up a plan.",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Show my trends', 'Set my salary', 'Why MoneyLoop?']
        };
      }
      // Priority 4: Salary / Budgeting Setup
      else if (lowerText.includes('salary') || lowerText.includes('income') || (awaitingSalary && text.replace(/,/g, '').match(/\d+(\.\d+)?/))) {
        const numberMatch = text.replace(/,/g, '').match(/\d+(\.\d+)?/);
        
        if (!numberMatch) {
          setAwaitingSalary(true);
          botResponse = {
            id: Date.now().toString(),
            text: "I'd love to help you set up your budget! 💰 What is your total monthly salary? (Just type the number)",
            sender: 'bot',
            timestamp: new Date(),
            suggestions: ['50000', '100000', 'Why ask?']
          };
        } else {
          const salary = parseFloat(numberMatch[0]);
          const saving = salary * 0.40; // 40%
          const expenses = salary * 0.60; // 60%
          
          botResponse = {
            id: Date.now().toString(),
            text: `Perfect! For a ₹${salary.toLocaleString()} salary, I've created a plan focused on your financial goals: 🎯\n\n• Savings (40%): ₹${saving.toLocaleString()}\n• Expenses (60%): ₹${expenses.toLocaleString()}\n• Goal: Build your savings to ₹${saving.toLocaleString} this month\n\nI've automatically added this to your dashboard. We'll redirect you in a few seconds to see it!`,
            sender: 'bot',
            timestamp: new Date(),
            suggestions: ['Analyze my data', 'Show my trends', 'Set a goal']
          };

          const processSetup = async () => {
            try {
              await addTransaction({ name: 'Monthly Salary', amount: salary, category: 'Salary', date: new Date().toISOString().split('T')[0], type: 'income' });
              await new Promise(r => setTimeout(r, 100));
              await addTransaction({ name: 'Monthly Expenses (Planned)', amount: expenses, category: 'Total Expenses', date: new Date().toISOString().split('T')[0], type: 'expense' });
              await addBudget({ name: 'Total Expenses', budget: expenses, icon: '💰' });
              await addGoal({ name: 'Monthly Savings Goal', targetAmount: saving, targetDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0] });
              setAwaitingSalary(false);
            } catch (err) { console.error(err); }
          };
          processSetup();
        }
      }
      // Priority 5: Savings Goal / Advice
      else if (lowerText.includes('save') || lowerText.includes('goal') || lowerText.includes('advice')) {
        botResponse = {
          id: Date.now().toString(),
          text: "My number one piece of advice is the 40% Rule. 🏆\n\nBy saving 40% of your income before you spend anything else, you build wealth much faster. I can help you track this automatically. \n\nWould you like me to analyze your current savings rate?",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Analyze my data', 'Set my salary', 'Show my trends']
        };
      }
      // Priority 6: Reset / Clear
      else if (lowerText.includes('reset') || lowerText.includes('clear') || lowerText.includes('delete')) {
        botResponse = {
          id: Date.now().toString(),
          text: "To reset your data, you can go to your **Profile Settings** and look for the 'Danger Zone' at the bottom. \n\nBe careful, this will permanently delete all your financial history!",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Go to Profile', 'App features']
        };
      }
      // Default Fallback
      else {
        botResponse = {
          id: Date.now().toString(),
          text: "I'm not quite sure I understand, but I'm learning! 🤖\n\nI can help you with:\n• Salary Analysis (Try: 'My salary is 50000')\n• Financial Reports (Try: 'Analyze my data')\n• App Features (Try: 'What can you do?')\n\nWhat else can I help with?",
          sender: 'bot',
          timestamp: new Date(),
          suggestions: ['Analyze my finances', 'App features', 'Show my trends']
        };
      }

      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: '1',
        text: 'Hello! 👋 I\'m MoneyLoop, your AI-first financial partner. I can help you analyze your spending, set budgets, or answer any questions about the app.\n\nTo get started with a personalized plan, you can tell me your monthly salary, or ask me anything!',
        sender: 'bot',
        timestamp: new Date(),
        suggestions: ['How does this app help me?', 'My salary is ₹50000', 'Analyze my data']
      },
    ]);
    localStorage.removeItem('moneyloop_ai_messages');
  };

  return (
    <div className="flex flex-col h-screen md:h-full max-w-6xl mx-auto p-2 md:p-4 pb-24 md:pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-3 bg-gradient-to-r from-[#1B4FFF] to-[#00C896] rounded-2xl p-3 md:p-4 text-white shadow-xl relative overflow-hidden backdrop-blur-sm"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
            >
              <MoneyLoopLogo size="md" className="text-white" />
            </motion.div>
            <div>
              <h1 className="text-lg md:text-xl font-bold">MoneyLoop AI Assistant</h1>
              <p className="text-white/80 text-xs mt-0.5">Your money. Your context. Your AI.</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleClearChat}
            className="p-2 bg-white/20 backdrop-blur-sm rounded-xl hover:bg-white/30 transition-colors"
            title="Clear chat"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </motion.button>
        </div>
      </motion.div>

      {/* Quick Questions */}
      {messages.length >= 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-3"
        >
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar">
            {quickQuestions.map((q, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleQuickQuestion(q.text)}
                className="flex-shrink-0 flex items-center gap-3 p-3 px-5 bg-white border border-gray-100 rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all text-left group"
              >
                <div className={`p-2.5 bg-gradient-to-br ${q.color} rounded-xl shadow-sm`}>
                  <q.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
                  {q.text}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto mb-3 space-y-3 scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-transparent">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[90%] md:max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex-shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : 'bg-gradient-to-br from-purple-500 to-pink-600'
                }`}>
                  {message.sender === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <MoneyLoopLogo size="sm" className="text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={`p-4 rounded-2xl shadow-lg ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white'
                        : 'bg-white border border-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm md:text-[15px] whitespace-pre-line leading-relaxed">{message.text}</p>
                  </div>

                  {/* Message Actions */}
                  {message.sender === 'bot' && (
                    <div className="flex items-center gap-2 mt-2 ml-2">
                      <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <Copy className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ThumbsUp className="w-4 h-4 text-gray-500" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <ThumbsDown className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  )}

                  {/* Suggestions */}
                  {message.suggestions && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {message.suggestions.map((suggestion, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-200 text-indigo-700 rounded-xl text-sm font-semibold hover:from-indigo-200 hover:to-purple-200 transition-all"
                        >
                          {suggestion}
                        </motion.button>
                      ))}
                    </div>
                  )}

                  <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-right text-gray-500' : 'text-left text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-3 max-w-[80%]">
              <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                <MoneyLoopLogo size="sm" className="text-white" />
              </div>
              <div className="bg-white border-2 border-gray-100 p-5 rounded-3xl shadow-xl">
                <div className="flex gap-1.5">
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    className="w-2.5 h-2.5 bg-purple-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    className="w-2.5 h-2.5 bg-purple-500 rounded-full"
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    className="w-2.5 h-2.5 bg-purple-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-2 shadow-lg"
      >
        <div className="flex gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Paperclip className="w-4 h-4 text-gray-600" />
          </button>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder={awaitingSalary ? "Enter your monthly salary (e.g., 50000)..." : "Ask me anything about your finances..."}
            className="flex-1 px-3 py-2 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-sm"
          />
          <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <Mic className="w-4 h-4 text-gray-600" />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSendMessage()}
            disabled={!inputValue.trim()}
            className={`p-2 rounded-xl transition-all ${
              inputValue.trim()
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>

      {/* AI Info Badge */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 mt-2 text-xs text-gray-500"
      >
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span>AI responses are generated using advanced RAG technology for accurate financial insights</span>
      </motion.div>
    </div>
  );
}
