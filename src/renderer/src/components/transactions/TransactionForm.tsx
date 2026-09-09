import React, { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { Modal } from '../ui/Modal'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Button } from '../ui/Button'
import type { Transaction } from '../../types'
import { format } from 'date-fns'

interface TransactionFormProps {
  open: boolean
  onClose: () => void
  editing?: Transaction | null
}

const FRECUENCIAS = [
  { value: 'diario', label: 'Diario' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'anual', label: 'Anual' }
]

export function TransactionForm({ open, onClose, editing }: TransactionFormProps): React.ReactElement {
  const { user } = useAuthStore()
  const { categories } = useDataStore()
  const [tipo, setTipo] = useState<'ingreso' | 'gasto'>('gasto')
  const [cantidad, setCantidad] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [recurrente, setRecurrente] = useState(false)
  const [frecuencia, setFrecuencia] = useState<'diario' | 'semanal' | 'mensual' | 'anual'>('mensual')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (editing) {
      setTipo(editing.tipo)
      setCantidad(String(editing.cantidad))
      setCategoriaId(editing.categoriaId)
      setDescripcion(editing.descripcion)
      setFecha(editing.fecha.slice(0, 10))
      setRecurrente(editing.recurrente)
    } else {
      setTipo('gasto')
      setCantidad('')
      setCategoriaId('')
      setDescripcion('')
      setFecha(format(new Date(), 'yyyy-MM-dd'))
      setRecurrente(false)
      setFrecuencia('mensual')
    }
    setError('')
  }, [editing, open])

  const filteredCats = categories.filter((c) => c.tipo === tipo)
  const catOptions = filteredCats.map((c) => ({ value: c.id, label: c.nombre }))

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const data = {
        userId: user.uid,
        tipo,
        cantidad: parseFloat(cantidad),
        categoriaId,
        descripcion,
        fecha: new Date(fecha).toISOString(),
        recurrente
      }

      if (editing) {
        await updateDoc(doc(db, 'transactions', editing.id), data)
      } else {
        const txRef = await addDoc(collection(db, 'transactions'), {
          ...data,
          creadoEn: Timestamp.now()
        })
        if (recurrente) {
          const recDoc = await addDoc(collection(db, 'recurrences'), {
            userId: user.uid,
            template: { tipo, cantidad: parseFloat(cantidad), categoriaId, descripcion },
            frecuencia,
            proximaEjecucion: new Date(fecha).toISOString(),
            activa: true
          })
          await updateDoc(doc(db, 'transactions', txRef.id), { recurrenceId: recDoc.id })
        }
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editing ? 'Editar transacción' : 'Nueva transacción'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          {(['gasto', 'ingreso'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTipo(t); setCategoriaId('') }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tipo === t
                  ? t === 'gasto'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}
            >
              {t === 'gasto' ? 'Gasto' : 'Ingreso'}
            </button>
          ))}
        </div>
        <Input
          label="Cantidad (€)"
          type="number"
          step="0.01"
          min="0"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
          required
          placeholder="0.00"
        />
        <Select
          label="Categoría"
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          options={[{ value: '', label: 'Seleccionar...' }, ...catOptions]}
          required
        />
        <Input
          label="Descripción"
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          required
          placeholder="Descripción"
        />
        <Input
          label="Fecha"
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          required
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={recurrente}
            onChange={(e) => setRecurrente(e.target.checked)}
            className="rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Transacción recurrente</span>
        </label>
        {recurrente && !editing && (
          <Select
            label="Frecuencia"
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value as typeof frecuencia)}
            options={FRECUENCIAS}
          />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
