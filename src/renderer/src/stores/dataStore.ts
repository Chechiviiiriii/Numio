import { create } from 'zustand'
import type { Transaction, Category, Recurrence, Budget } from '../types'

interface DataState {
  transactions: Transaction[]
  categories: Category[]
  recurrences: Recurrence[]
  budgets: Budget[]
  setTransactions: (t: Transaction[]) => void
  setCategories: (c: Category[]) => void
  setRecurrences: (r: Recurrence[]) => void
  setBudgets: (b: Budget[]) => void
}

export const useDataStore = create<DataState>((set) => ({
  transactions: [],
  categories: [],
  recurrences: [],
  budgets: [],
  setTransactions: (transactions) => set({ transactions }),
  setCategories: (categories) => set({ categories }),
  setRecurrences: (recurrences) => set({ recurrences }),
  setBudgets: (budgets) => set({ budgets })
}))
