import React, { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore'
import { auth, db } from './firebase/config'
import { useAuthStore } from './stores/authStore'
import { useDataStore } from './stores/dataStore'
import { useThemeStore } from './stores/themeStore'
import { seedDefaultCategories } from './firebase/seeds'
import { procesarRecurrencias } from './firebase/recurrences'
import { AuthScreen } from './components/auth/AuthScreen'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { Transacciones } from './pages/Transacciones'
import { Presupuestos } from './pages/Presupuestos'
import { Configuracion } from './pages/Configuracion'
import type { Transaction, Category, Recurrence, Budget } from './types'

export default function App(): React.ReactElement {
  const { user, loading, setUser, setLoading, setProfile } = useAuthStore()
  const { setTransactions, setCategories, setRecurrences, setBudgets } = useDataStore()
  const { setTheme } = useThemeStore()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        // Load user prefs
        try {
          const userSnap = await getDoc(doc(db, 'users', u.uid))
          if (userSnap.exists()) {
            const prefs = userSnap.data()?.preferencias
            if (prefs?.tema) setTheme(prefs.tema)
          } else {
            await setDoc(doc(db, 'users', u.uid), {
              email: u.email ?? '',
              nombre: '',
              preferencias: { tema: 'light' }
            })
          }
        } catch {
          // ignore
        }

        // Load electron theme
        if (window.electronAPI) {
          try {
            const t = await window.electronAPI.getTheme()
            if (t === 'light' || t === 'dark') setTheme(t)
          } catch {
            // ignore
          }
        }

        await seedDefaultCategories(u.uid)
        await procesarRecurrencias(u.uid)
      }
      setLoading(false)
    })
    return unsub
  }, [setUser, setLoading, setTheme])

  // Real-time Firestore listeners
  useEffect(() => {
    if (!user) {
      setTransactions([])
      setCategories([])
      setRecurrences([])
      setBudgets([])
      setProfile(null)
      return
    }
    const uid = user.uid
    const unsubs = [
      onSnapshot(
        query(collection(db, 'transactions'), where('userId', '==', uid)),
        (snap) =>
          setTransactions(
            snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction))
          )
      ),
      onSnapshot(
        query(collection(db, 'categories'), where('userId', '==', uid)),
        (snap) =>
          setCategories(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category)))
      ),
      onSnapshot(
        query(collection(db, 'recurrences'), where('userId', '==', uid)),
        (snap) =>
          setRecurrences(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recurrence)))
      ),
      onSnapshot(
        query(collection(db, 'budgets'), where('userId', '==', uid)),
        (snap) => setBudgets(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Budget)))
      ),
      onSnapshot(doc(db, 'users', uid), (snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setProfile({ nombre: data.nombre ?? '', email: data.email ?? user.email ?? '' })
        }
      })
    ]
    return () => unsubs.forEach((u) => u())
  }, [user, setTransactions, setCategories, setRecurrences, setBudgets, setProfile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="transacciones" element={<Transacciones />} />
          <Route path="presupuestos" element={<Presupuestos />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
