import React, { useMemo } from 'react'
import { useDataStore } from '../../stores/dataStore'
import { Card } from '../ui/Card'
import { startOfMonth, endOfMonth, parseISO } from 'date-fns'

function inRange(iso: string, from: Date, to: Date): boolean {
  try {
    const d = parseISO(iso)
    return d >= from && d <= to
  } catch {
    return false
  }
}

function fmt(n: number): string {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2 })
}

export function SummaryCards(): React.ReactElement {
  const { transactions, categories } = useDataStore()

  const now = new Date()
  const from = startOfMonth(now)
  const to = endOfMonth(now)

  const monthTx = useMemo(
    () => transactions.filter((t) => inRange(t.fecha, from, to)),
    [transactions, from, to]
  )

  const totalIngresos = monthTx.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.cantidad, 0)
  const totalGastos = monthTx.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.cantidad, 0)
  const saldo = totalIngresos - totalGastos

  const catSummary = useMemo(() => {
    const map = new Map<string, { total: number; count: number; tipo: string }>()
    monthTx.forEach((t) => {
      const prev = map.get(t.categoriaId) ?? { total: 0, count: 0, tipo: t.tipo }
      map.set(t.categoriaId, { total: prev.total + t.cantidad, count: prev.count + 1, tipo: t.tipo })
    })
    return Array.from(map.entries()).map(([id, v]) => ({
      id,
      nombre: categories.find((c) => c.id === id)?.nombre ?? '—',
      ...v
    })).sort((a, b) => b.total - a.total)
  }, [monthTx, categories])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total ingresos</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{fmt(totalIngresos)} €</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total gastos</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{fmt(totalGastos)} €</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-500 dark:text-gray-400">Saldo neto</p>
          <p className={`text-2xl font-bold mt-1 ${saldo >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {saldo >= 0 ? '+' : ''}{fmt(saldo)} €
          </p>
        </Card>
      </div>

      {catSummary.length > 0 && (
        <Card title="Resumen por categoría (este mes)">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">Categoría</th>
                  <th className="text-left py-2 font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Transacciones</th>
                  <th className="text-right py-2 font-medium text-gray-500 dark:text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {catSummary.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 text-gray-800 dark:text-gray-200">{row.nombre}</td>
                    <td className="py-2">
                      <span className={`text-xs rounded-full px-2 py-0.5 ${row.tipo === 'ingreso' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>
                        {row.tipo}
                      </span>
                    </td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{row.count}</td>
                    <td className={`py-2 text-right font-medium ${row.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {fmt(row.total)} €
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
