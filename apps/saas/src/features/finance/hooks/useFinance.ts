import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/infrastructure/supabase/client';
import { useTenant } from '@/features/auth/hooks/useTenant';

export interface Transaction {
  id: string;
  tenant_id: string | null;
  type: 'income' | 'expense';
  category: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  paid: boolean;
  user_id: string | null;
  created_at: string | null;
}

export interface Account {
  id: string;
  tenant_id: string | null;
  name: string;
  type: 'checking' | 'credit_card' | 'investment' | 'cash';
  balance: number;
  limit: number | null;
  due_day: number | null;
  user_id: string | null;
  created_at: string | null;
}

export interface Loan {
  id: string;
  tenant_id: string | null;
  title: string;
  total_installments: number;
  paid_installments: number;
  installment_value: number;
  user_id: string | null;
  created_at: string | null;
}

export const useFinance = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenantId } = useTenant();

  const fetchAll = useCallback(async () => {
    if (!tenantId) {
      setTransactions([]);
      setAccounts([]);
      setLoans([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [transactionsRes, accountsRes, loansRes] = await Promise.all([
        supabase.from('finance_transactions').select('*').eq('user_id', tenantId).order('created_at', { ascending: false }),
        supabase.from('finance_accounts').select('*').eq('user_id', tenantId).order('name', { ascending: true }),
        supabase.from('finance_loans').select('*').eq('user_id', tenantId).order('created_at', { ascending: false }),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (accountsRes.error) throw accountsRes.error;
      if (loansRes.error) throw loansRes.error;

      setTransactions(transactionsRes.data || []);
      setAccounts(accountsRes.data || []);
      setLoans(loansRes.data || []);
    } catch (err) {
      console.error('Erro ao buscar dados financeiros:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Transactions
  const createTransaction = useCallback(async (transaction: Omit<Transaction, 'id' | 'created_at'>) => {
    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('finance_transactions')
        .insert(transaction)
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) setTransactions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar transação';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('finance_transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) setTransactions(prev => prev.map(t => t.id === id ? data : t));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar transação';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      setTransactions(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao excluir transação';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Accounts
  const createAccount = useCallback(async (account: Omit<Account, 'id' | 'created_at'>) => {
    try {
      setError(null);
      const { data, error: insertError } = await supabase
        .from('finance_accounts')
        .insert(account)
        .select()
        .single();

      if (insertError) throw insertError;
      if (data) setAccounts(prev => [...prev, data]);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateAccount = useCallback(async (id: string, updates: Partial<Account>) => {
    try {
      setError(null);
      const { data, error: updateError } = await supabase
        .from('finance_accounts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      if (data) setAccounts(prev => prev.map(a => a.id === id ? data : a));
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar conta';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  // Metrics
  const getFinancialSummary = useCallback(() => {
    const income = transactions
      .filter(t => t.type === 'income' && t.paid)
      .reduce((sum, t) => sum + (t.amount || 0), 0);
    
    const expenses = transactions
      .filter(t => t.type === 'expense' && t.paid)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0);

    const pendingIncome = transactions
      .filter(t => t.type === 'income' && !t.paid)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingExpenses = transactions
      .filter(t => t.type === 'expense' && !t.paid)
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      income,
      expenses,
      profit: income - expenses,
      totalBalance,
      pendingIncome,
      pendingExpenses,
      transactionCount: transactions.length,
      accountCount: accounts.length,
    };
  }, [transactions, accounts]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    transactions,
    accounts,
    loans,
    loading,
    error,
    refresh: fetchAll,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createAccount,
    updateAccount,
    getFinancialSummary,
  };
};