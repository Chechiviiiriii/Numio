import React, { useState, useMemo } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { format } from 'date-fns'

export function BudgetManager(): React.ReactElement {
  const { user } = useAuthStore()
  const { budgets, categories, transactions } = useDataStore()
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [catId, setCatId] = useState('')
  const [limite, setLimite] = useState('')
  const [loading, setLoading] = useState(false)

  const gastosCats = categories.filter((c) => c.tipo === 'gasto')
  const catOptions = [
    { value: '', label: 'Seleccionar categoría...' },
    ...gastosCats.map((c) => ({ value: c.id, label: c.nombre }))
  ]

  const mesTransacciones = useMemo(() => {
    return transactions.filter((t) => t.tipo === 'gasto' && t.fecha.startsWith(mes))
  }, [transactions, mes])

  const budgetsMes = budgets.filter((b) => b.mes === mes)

  const getGasto = (cId: string): number =>
    mesTransacciones.filter((t) => t.categoriaId === cId).reduce((s, t) => s + t.cantidad, 0)

  const openCreate = (): void => {
    setEditingId(null)
    setCatId('')
    setLimite('')
    setFormOpen(true)
  }

  const openEdit = (id: string, cId: string, lim: number): void => {
    setEditingId(id)
    setCatId(cId)
    setLimite(String(lim))
    setFormOpen(true)
  }

  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      if (editingId) {
        await updateDoc(doc(db, 'budgets', editingId), {
          categoriaId: catId,
          limite: parseFloat(limite),
          mes
        })
      } else {
        const q = query(
          collection(db, 'budgets'),
          where('userId', '==', user.uid),
          where('mes', '==', mes),
          where('categoriaId', '==', catId)
        )
        const snap = await getDocs(q)
        if (!snap.empty) {
          await updateDoc(doc(db, 'budgets', snap.docs[0].id), { limite: parseFloat(limite) })
        } else {
          await addDoc(collection(db, 'budgets'), {
            userId: user.uid,
            categoriaId: catId,
            limite: parseFloat(limite),
            mes
          })
        }
      }
      setFormOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar presupuesto?')) return
    await deleteDoc(doc(db, 'budgets', id))
  }

  const getBarColor = (pct: number): string => {
    if (pct >= 1) return 'bg-red-500'
    if (pct >= 0.8) return 'bg-amber-400'
    return 'bg-green-500'
  }

  const getCatName = (id: string): string => categories.find((c) => c.id === id)?.nombre ?? '—'

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Presupuestos</h2>
        <div className="flex gap-2">
          <Input
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
          />
          <Button onClick={openCreate}>+ Nuevo</Button>
        </div>
      </div>

      {budgetsMes.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400">
          No hay presupuestos para {mes}
        </div>
      ) : (
        <div className="space-y-3">
          {budgetsMes.map((b) => {
            const gasto = getGasto(b.categoriaId)
            const pct = b.limite > 0 ? gasto / b.limite : 0
            const pctDisplay = Math.min(pct * 100, 100)
            return (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-gray-200">
                    {getCatName(b.categoriaId)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {gasto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                      {' / '}
                      {b.limite.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(b.id, b.categoriaId, b.limite)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(b.id)}>
                      <span className="text-red-500">Eliminar</span>
                    </Button>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all ${getBarColor(pct)}`}
                    style={{ width: `${pctDisplay}%` }}
                  />
                </div>
                {pct >= 0.8 && (
                  <p className={`text-xs mt-1 ${pct >= 1 ? 'text-red-500' : 'text-amber-500'}`}>
                    {pct >= 1 ? 'Presupuesto superado' : `${Math.round(pct * 100)}% del presupuesto usado`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingId ? 'Editar presupuesto' : 'Nuevo presupuesto'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <Select
            label="Categoría de gasto"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
            options={catOptions}
            required
          />
          <Input
            label="Límite (€)"
            type="number"
            min="0"
            step="0.01"
            value={limite}
            onChange={(e) => setLimite(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={() => setFormOpen(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
