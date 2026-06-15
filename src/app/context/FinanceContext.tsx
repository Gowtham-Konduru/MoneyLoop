import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiService } from '../services/api';

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  date: string;
  type: TransactionType;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'upcoming';
}

export interface BudgetCategory {
  id: string;
  name: string;
  budget: number;
  icon: string;
}

interface FinanceContextType {
  transactions: Transaction[];
  goals: Goal[];
  bills: Bill[];
  budgets: BudgetCategory[];
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  addGoal: (g: Omit<Goal, 'id' | 'currentAmount'>) => void;
  addBill: (b: Omit<Bill, 'id' | 'status'>) => void;
  addBudget: (b: Omit<BudgetCategory, 'id'>) => void;
  updateBudget: (id: string, b: Partial<BudgetCategory>) => void;
  deleteBudget: (id: string) => void;
  payBill: (id: string) => void;
  deleteTransaction: (id: string) => void;
  clearAllData: () => Promise<void>;
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const transRes = await apiService.getTransactions();
        if (transRes.success && transRes.data) {
          const mappedTrans: Transaction[] = transRes.data.transactions.map((t: any) => ({
            id: t.id.toString(),
            name: t.description || t.category,
            amount: typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount,
            category: t.category,
            date: t.date,
            type: t.type
          }));
          setTransactions(mappedTrans);
        }

        const budgRes = await apiService.getBudgets();
        if (budgRes.success && budgRes.data) {
          const mappedBudgets: BudgetCategory[] = budgRes.data.budgets.map((b: any) => ({
            id: b.id.toString(),
            name: b.name,
            budget: typeof b.amount === 'string' ? parseFloat(b.amount) : b.amount,
            icon: b.name.substring(0, 2)
          }));
          setBudgets(mappedBudgets);
        }
      } catch (err) {
        console.error('Failed to load data from API', err);
      }
      
      const savedGoals = localStorage.getItem('budget_goals');
      const savedBills = localStorage.getItem('budget_bills');
      if (savedGoals) setGoals(JSON.parse(savedGoals));
      if (savedBills) setBills(JSON.parse(savedBills));
      
      setIsLoaded(true);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('budget_goals', JSON.stringify(goals));
      localStorage.setItem('budget_bills', JSON.stringify(bills));
    }
  }, [goals, bills, isLoaded]);

  const addTransaction = async (t: Omit<Transaction, 'id'>) => {
    // Optimistic update
    const tempId = Date.now().toString();
    setTransactions(prev => [{ ...t, id: tempId }, ...prev]);

    // If this is an expense, reduce the Total Expenses budget
    if (t.type === 'expense') {
      const totalExpensesBudget = budgets.find(b => b.name === 'Total Expenses');
      if (totalExpensesBudget) {
        const newBudgetAmount = Math.max(0, totalExpensesBudget.budget - Math.abs(t.amount));
        setBudgets(prev => prev.map(b => 
          b.id === totalExpensesBudget.id ? { ...b, budget: newBudgetAmount } : b
        ));
        
        // Also update on backend
        try {
          await apiService.updateBudget(totalExpensesBudget.id, {
            name: totalExpensesBudget.name,
            budget: newBudgetAmount,
            icon: totalExpensesBudget.icon
          });
        } catch (e) {
          console.error('Failed to update budget on backend:', e);
        }
      }
    }

    try {
      const res = await apiService.createTransaction({
        amount: t.amount,
        type: t.type,
        category: t.category,
        description: t.name,
        date: t.date,
        account: 'Main Account'
      });
      if (res.success && res.data) {
        const backendT = res.data.transaction as any;
        // Replace temp id with real id
        setTransactions(prev => prev.map(item => item.id === tempId ? { ...item, id: backendT.id.toString() } : item));
      }
    } catch (e) {
      console.error('Failed to add transaction to backend:', e);
      // We keep the optimistic one if it failed, or we could remove it. 
      // For now, let's keep it so the user sees something.
    }
  };

  const addGoal = (g: Omit<Goal, 'id' | 'currentAmount'>) => {
    setGoals(prev => [{ ...g, id: Date.now().toString(), currentAmount: 0 }, ...prev]);
  };

  const addBill = (b: Omit<Bill, 'id' | 'status'>) => {
    setBills(prev => [{ ...b, id: Date.now().toString(), status: 'pending' }, ...prev]);
  };

  const addBudget = async (b: Omit<BudgetCategory, 'id'>) => {
    try {
      const res = await apiService.createBudget({
        name: b.name,
        amount: b.budget,
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        categories: [b.name]
      });
      if (res.success && res.data) {
        const backendB = res.data.budget as any;
        setBudgets(prev => [{ ...b, id: backendB.id.toString() }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteBudget = async (id: string) => {
    try {
      await apiService.deleteBudget(id);
      setBudgets(prev => prev.filter(b => b.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const updateBudget = async (id: string, b: Partial<BudgetCategory>) => {
    try {
      const res = await apiService.updateBudget(id, {
        name: b.name,
        amount: b.budget,
        period: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
        categories: [b.name]
      });
      if (res.success) {
        setBudgets(prev => prev.map(item => item.id === id ? { ...item, ...b } : item));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const payBill = (id: string) => {
    setBills(prev => prev.map(bill => bill.id === id ? { ...bill, status: 'paid' } : bill));
  };

  const deleteTransaction = async (id: string) => {
    try {
      await apiService.deleteTransaction(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAllData = async () => {
    try {
      await apiService.resetUserData();
    } catch (e) {
      console.error('Failed to reset data on backend:', e);
    }
    setTransactions([]);
    setGoals([]);
    setBills([]);
    setBudgets([]);
    localStorage.removeItem('budget_transactions');
    localStorage.removeItem('budget_goals');
    localStorage.removeItem('budget_bills');
    localStorage.removeItem('budget_categories');
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + Math.abs(curr.amount), 0);
  const balance = totalIncome - totalExpense;

  return (
    <FinanceContext.Provider value={{
      transactions,
      goals,
      bills,
      budgets,
      addTransaction,
      addGoal,
      addBill,
      addBudget,
      updateBudget,
      deleteBudget,
      payBill,
      deleteTransaction,
      clearAllData,
      totalIncome,
      totalExpense,
      balance
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
