import { collection, addDoc, query, where, getDocs } from 'firebase/firestore'
import { db } from './config'
import type { Category } from '../types'

const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'userId'>[] = [
  { nombre: 'Alimentación', color: '#ef4444', tipo: 'gasto' },
  { nombre: 'Transporte', color: '#f97316', tipo: 'gasto' },
  { nombre: 'Vivienda', color: '#eab308', tipo: 'gasto' },
  { nombre: 'Ocio', color: '#84cc16', tipo: 'gasto' },
  { nombre: 'Salud', color: '#06b6d4', tipo: 'gasto' },
  { nombre: 'Otros gastos', color: '#8b5cf6', tipo: 'gasto' },
  { nombre: 'Sueldo', color: '#22c55e', tipo: 'ingreso' },
  { nombre: 'Freelance', color: '#3b82f6', tipo: 'ingreso' },
  { nombre: 'Venta', color: '#f59e0b', tipo: 'ingreso' },
  { nombre: 'Otros ingresos', color: '#14b8a6', tipo: 'ingreso' }
]

export async function seedDefaultCategories(userId: string): Promise<void> {
  const q = query(collection(db, 'categories'), where('userId', '==', userId))
  const snap = await getDocs(q)
  if (!snap.empty) return

  for (const cat of DEFAULT_CATEGORIES) {
    await addDoc(collection(db, 'categories'), { ...cat, userId })
  }
}
