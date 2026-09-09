import React, { useState, useMemo } from 'react'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useDataStore } from '../../stores/dataStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { TransactionForm } from './TransactionForm'
import type { Transaction } from '../../types'
import { format, parseISO, isValid } from 'date-fns'
import { es } from 'date-fns/locale'

const PAGE_SIZE = 20

export function TransactionList(): React.ReactElement {
  const { transactions, categories } = useDataStore()
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const catOptions = [
    { value: '', label: 'Todas las categorías' },
    ...categories.map((c) => ({ value: c.id, label: c.nombre }))
  ]

  const filtered = useMemo(() => {
    return [...transactions]
      .filter((t) => {
        if (search && !t.descripcion.toLowerCase().includes(search.toLowerCase())) return false
        if (filterTipo && t.tipo !== filterTipo) return false
        if (filterCat && t.categoriaId !== filterCat) return false
        if (filterFrom && t.fecha < new Date(filterFrom).toISOString()) return false
        if (filterTo && t.fecha > new Date(filterTo + 'T23:59:59').toISOString()) return false
        return true
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [transactions, search, filterTipo, filterCat, filterFrom, filterTo])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const getCatName = (id: string): string =>
    categories.find((c) => c.id === id)?.nombre ?? '—'
  const getCatColor = (id: string): string =>
    categories.find((c) => c.id === id)?.color ?? '#6b7280'

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar esta transacción?')) return
    await deleteDoc(doc(db, 'transactions', id))
  }

  const formatFecha = (iso: string): string => {
    try {
      const d = parseISO(iso)
      if (!isValid(d)) return iso
      return format(d, 'd MMM yyyy', { locale: es })
    } catch {
      return iso
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Transacciones</h2>
        <Button onClick={() => { setEditing(null); setFormOpen(true) }}>+ Nueva</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          placeholder="Buscar descripción..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
        />
        <Select
          value={filterTipo}
          onChange={(e) => { setFilterTipo(e.target.value); setPage(1) }}
          options={[
            { value: '', label: 'Todos los tipos' },
            { value: 'ingreso', label: 'Ingresos' },
            { value: 'gasto', label: 'Gastos' }
          ]}
        />
        <Select
          value={filterCat}
          onChange={(e) => { setFilterCat(e.target.value); setPage(1) }}
          options={catOptions}
        />
        <div className="flex gap-2">
          <Input
            type="date"
            value={filterFrom}
            onChange={(e) => { setFilterFrom(e.target.value); setPage(1) }}
            placeholder="Desde"
          />
          <Input
            type="date"
            value={filterTo}
            onChange={(e) => { setFilterTo(e.target.value); setPage(1) }}
            placeholder="Hasta"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {paged.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay transacciones</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Fecha</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Descripción</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Categoría</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Cantidad</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paged.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {formatFecha(t.fecha)}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                    {t.descripcion}
                    {t.recurrente && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 rounded px-1.5 py-0.5">
                        recurrente
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ background: getCatColor(t.categoriaId) + '22', color: getCatColor(t.categoriaId) }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: getCatColor(t.categoriaId) }}
                      />
                      {getCatName(t.categoriaId)}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${t.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {t.tipo === 'ingreso' ? '+' : '-'}{t.cantidad.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setEditing(t); setFormOpen(true) }}
                      >
                        Editar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(t.id)}>
                        <span className="text-red-500">Eliminar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{filtered.length} resultados</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="px-3 py-1.5">
              {page} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  )
}
