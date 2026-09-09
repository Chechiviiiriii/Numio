import React, { useState } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Modal } from '../ui/Modal'
import type { Category } from '../../types'

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'
]

interface CatFormState {
  nombre: string
  color: string
  tipo: 'ingreso' | 'gasto'
}

const INIT: CatFormState = { nombre: '', color: '#3b82f6', tipo: 'gasto' }

export function CategoryManager(): React.ReactElement {
  const { user } = useAuthStore()
  const { categories } = useDataStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [form, setForm] = useState<CatFormState>(INIT)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const gastos = categories.filter((c) => c.tipo === 'gasto')
  const ingresos = categories.filter((c) => c.tipo === 'ingreso')

  const openCreate = (tipo: 'ingreso' | 'gasto'): void => {
    setEditing(null)
    setForm({ ...INIT, tipo })
    setError('')
    setFormOpen(true)
  }

  const openEdit = (cat: Category): void => {
    setEditing(cat)
    setForm({ nombre: cat.nombre, color: cat.color, tipo: cat.tipo })
    setError('')
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      if (editing) {
        await updateDoc(doc(db, 'categories', editing.id), {
          nombre: form.nombre,
          color: form.color,
          tipo: form.tipo
        })
      } else {
        await addDoc(collection(db, 'categories'), {
          userId: user.uid,
          nombre: form.nombre,
          color: form.color,
          tipo: form.tipo
        })
      }
      setFormOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar categoría?')) return
    await deleteDoc(doc(db, 'categories', id))
  }

  const renderGroup = (title: string, list: Category[], tipo: 'ingreso' | 'gasto'): React.ReactElement => (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <Button size="sm" variant="secondary" onClick={() => openCreate(tipo)}>
          + Añadir
        </Button>
      </div>
      <div className="space-y-2">
        {list.map((cat) => (
          <div
            key={cat.id}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2.5"
          >
            <span
              className="w-4 h-4 rounded-full flex-shrink-0"
              style={{ background: cat.color }}
            />
            <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{cat.nombre}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => openEdit(cat)}>Editar</Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(cat.id)}>
                <span className="text-red-500">Eliminar</span>
              </Button>
            </div>
          </div>
        ))}
        {list.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-2">Sin categorías</p>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {renderGroup('Categorías de Gastos', gastos, 'gasto')}
      {renderGroup('Categorías de Ingresos', ingresos, 'ingreso')}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            required
          />
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Color</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full transition-transform ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500 scale-110' : ''}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <input
              type="color"
              value={form.color}
              onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
              className="w-full h-9 rounded cursor-pointer"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
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
