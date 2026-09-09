export interface UserProfile {
  email: string
  nombre: string
  preferencias: {
    tema: 'light' | 'dark'
  }
}

export interface Category {
  id: string
  userId: string
  nombre: string
  color: string
  tipo: 'ingreso' | 'gasto'
}

export interface Transaction {
  id: string
  userId: string
  tipo: 'ingreso' | 'gasto'
  cantidad: number
  categoriaId: string
  descripcion: string
  fecha: string
  recurrente: boolean
  recurrenceId?: string | null
}

export interface RecurrenceTemplate {
  tipo: 'ingreso' | 'gasto'
  cantidad: number
  categoriaId: string
  descripcion: string
}

export interface Recurrence {
  id: string
  userId: string
  template: RecurrenceTemplate
  frecuencia: 'diario' | 'semanal' | 'mensual' | 'anual'
  proximaEjecucion: string
  activa: boolean
}

export interface Budget {
  id: string
  userId: string
  categoriaId: string
  limite: number
  mes: string
}

declare global {
  interface Window {
    electronAPI: {
      getTheme: () => Promise<'light' | 'dark' | 'system'>
      setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>
      getAppVersion: () => Promise<string>
    }
  }
}
