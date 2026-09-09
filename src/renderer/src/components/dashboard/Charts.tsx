import React, { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { useDataStore } from '../../stores/dataStore'
import { Card } from '../ui/Card'
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

function formatMes(date: Date): string {
  return format(date, 'MMM yy', { locale: es })
}

function inRange(iso: string, from: Date, to: Date): boolean {
  try {
    const d = parseISO(iso)
    return d >= from && d <= to
  } catch {
    return false
  }
}

export function Charts(): React.ReactElement {
  const { transactions, categories } = useDataStore()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const thisMonthTx = useMemo(
    () => transactions.filter((t) => inRange(t.fecha, monthStart, monthEnd)),
    [transactions, monthStart, monthEnd]
  )

  const pieGastos = useMemo(() => {
    const map = new Map<string, number>()
    thisMonthTx.filter((t) => t.tipo === 'gasto').forEach((t) => {
      map.set(t.categoriaId, (map.get(t.categoriaId) ?? 0) + t.cantidad)
    })
    return Array.from(map.entries()).map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.nombre ?? id,
      value,
      color: categories.find((c) => c.id === id)?.color ?? '#6b7280'
    }))
  }, [thisMonthTx, categories])

  const pieIngresos = useMemo(() => {
    const map = new Map<string, number>()
    thisMonthTx.filter((t) => t.tipo === 'ingreso').forEach((t) => {
      map.set(t.categoriaId, (map.get(t.categoriaId) ?? 0) + t.cantidad)
    })
    return Array.from(map.entries()).map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.nombre ?? id,
      value,
      color: categories.find((c) => c.id === id)?.color ?? '#6b7280'
    }))
  }, [thisMonthTx, categories])

  const lineData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      const from = startOfMonth(d)
      const to = endOfMonth(d)
      const monthTx = transactions.filter((t) => inRange(t.fecha, from, to))
      return {
        mes: formatMes(d),
        ingresos: monthTx.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.cantidad, 0),
        gastos: monthTx.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.cantidad, 0)
      }
    })
  }, [transactions, now])

  const renderPie = (data: typeof pieGastos, title: string): React.ReactElement => (
    <Card title={title}>
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Sin datos</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v: number) => `${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderPie(pieGastos, 'Gastos por categoría (este mes)')}
        {renderPie(pieIngresos, 'Ingresos por categoría (este mes)')}
      </div>
      <Card title="Tendencia últimos 6 meses">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: number) => `${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`} />
            <Legend />
            <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={2} dot={false} name="Ingresos" />
            <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={2} dot={false} name="Gastos" />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
