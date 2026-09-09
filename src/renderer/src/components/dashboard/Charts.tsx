import React, { useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts'
import { useDataStore } from '../../stores/dataStore'
import { Card } from '../ui/Card'
import {
  format, parseISO, subMonths, startOfMonth, endOfMonth,
  startOfYear, endOfYear, differenceInDays, addDays, addMonths
} from 'date-fns'
import { es } from 'date-fns/locale'
import { DateRangePicker, type DateRangeValue, type DatePreset } from '../ui/DateRangePicker'
import { capitalize } from '../../lib/format'

const toISO = (d: Date): string => format(d, 'yyyy-MM-dd')

const LINE_PRESETS: DatePreset[] = [
  { value: '1m', label: '1 mes', range: () => { const n = new Date(); return { from: toISO(subMonths(n, 1)), to: toISO(n) } } },
  { value: '3m', label: '3 meses', range: () => { const n = new Date(); return { from: toISO(subMonths(n, 3)), to: toISO(n) } } },
  { value: '6m', label: '6 meses', range: () => { const n = new Date(); return { from: toISO(subMonths(n, 6)), to: toISO(n) } } },
  { value: '12m', label: '12 meses', range: () => { const n = new Date(); return { from: toISO(subMonths(n, 12)), to: toISO(n) } } },
  { value: 'custom', label: 'Personalizado' }
]

const PIE_PRESETS: DatePreset[] = [
  { value: 'this_month', label: 'Este mes', range: () => { const n = new Date(); return { from: toISO(startOfMonth(n)), to: toISO(endOfMonth(n)) } } },
  { value: 'last_month', label: 'Mes pasado', range: () => { const n = new Date(); const lm = subMonths(n, 1); return { from: toISO(startOfMonth(lm)), to: toISO(endOfMonth(lm)) } } },
  { value: '3m', label: 'Últimos 3 meses', range: () => { const n = new Date(); return { from: toISO(startOfMonth(subMonths(n, 3))), to: toISO(endOfMonth(n)) } } },
  { value: 'this_year', label: 'Este año', range: () => { const n = new Date(); return { from: toISO(startOfYear(n)), to: toISO(endOfYear(n)) } } },
  { value: 'custom', label: 'Personalizado' }
]

function inRange(iso: string, from: Date, to: Date): boolean {
  try {
    const d = parseISO(iso)
    return d >= from && d <= to
  } catch {
    return false
  }
}

function formatRangeSubtitle(from: string, to: string): string {
  try {
    return `${capitalize(format(parseISO(from), 'd MMM yyyy', { locale: es }))} – ${capitalize(format(parseISO(to), 'd MMM yyyy', { locale: es }))}`
  } catch {
    return `${from} – ${to}`
  }
}

export function Charts(): React.ReactElement {
  const { transactions, categories } = useDataStore()

  const [lineRange, setLineRange] = useState<DateRangeValue>(() => {
    const n = new Date()
    return { preset: '6m', from: toISO(subMonths(n, 6)), to: toISO(n) }
  })

  const [pieRange, setPieRange] = useState<DateRangeValue>(() => {
    const n = new Date()
    return { preset: 'this_month', from: toISO(startOfMonth(n)), to: toISO(endOfMonth(n)) }
  })

  // --- Pie data ---
  const pieRangeTx = useMemo(() => {
    try {
      const from = parseISO(pieRange.from)
      const to = parseISO(pieRange.to)
      return transactions.filter((t) => inRange(t.fecha, from, to))
    } catch {
      return []
    }
  }, [transactions, pieRange])

  const pieGastos = useMemo(() => {
    const map = new Map<string, number>()
    pieRangeTx.filter((t) => t.tipo === 'gasto').forEach((t) => {
      map.set(t.categoriaId, (map.get(t.categoriaId) ?? 0) + t.cantidad)
    })
    return Array.from(map.entries()).map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.nombre ?? id,
      value,
      color: categories.find((c) => c.id === id)?.color ?? '#6b7280'
    }))
  }, [pieRangeTx, categories])

  const pieIngresos = useMemo(() => {
    const map = new Map<string, number>()
    pieRangeTx.filter((t) => t.tipo === 'ingreso').forEach((t) => {
      map.set(t.categoriaId, (map.get(t.categoriaId) ?? 0) + t.cantidad)
    })
    return Array.from(map.entries()).map(([id, value]) => ({
      name: categories.find((c) => c.id === id)?.nombre ?? id,
      value,
      color: categories.find((c) => c.id === id)?.color ?? '#6b7280'
    }))
  }, [pieRangeTx, categories])

  // --- Line data ---
  const { data: lineData, isDaily } = useMemo(() => {
    try {
      const fromDate = parseISO(lineRange.from)
      const toDate = parseISO(lineRange.to)
      const diffDays = differenceInDays(toDate, fromDate)

      if (diffDays <= 62) {
        const days: Array<{ label: string; ingresos: number; gastos: number }> = []
        let cur = fromDate
        while (cur <= toDate) {
          const dateStr = format(cur, 'yyyy-MM-dd')
          const dayTx = transactions.filter((t) => t.fecha.startsWith(dateStr))
          days.push({
            label: capitalize(format(cur, 'd MMM', { locale: es })),
            ingresos: dayTx.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.cantidad, 0),
            gastos: dayTx.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.cantidad, 0)
          })
          cur = addDays(cur, 1)
        }
        return { data: days, isDaily: true }
      } else {
        const months: Array<{ label: string; ingresos: number; gastos: number }> = []
        let cur = startOfMonth(fromDate)
        while (cur <= toDate) {
          const mFrom = startOfMonth(cur)
          const mTo = endOfMonth(cur)
          const monthTx = transactions.filter((t) => inRange(t.fecha, mFrom, mTo))
          months.push({
            label: capitalize(format(cur, 'MMM yy', { locale: es })),
            ingresos: monthTx.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.cantidad, 0),
            gastos: monthTx.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.cantidad, 0)
          })
          cur = addMonths(cur, 1)
        }
        return { data: months, isDaily: false }
      }
    } catch {
      return { data: [], isDaily: false }
    }
  }, [transactions, lineRange])

  const pieRangeLabel = formatRangeSubtitle(pieRange.from, pieRange.to)
  const lineRangeLabel = formatRangeSubtitle(lineRange.from, lineRange.to)

  const renderPie = (data: typeof pieGastos, title: string): React.ReactElement => (
    <Card title={title} subtitle={pieRangeLabel}>
      {data.length === 0 ? (
        <p className="text-center text-gray-400 py-8">Sin datos</p>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) =>
                `${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
              }
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )

  return (
    <div className="space-y-4">
      {/* Pie charts with shared date picker */}
      <Card>
        <DateRangePicker value={pieRange} onChange={setPieRange} presets={PIE_PRESETS} />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {renderPie(pieGastos, 'Gastos por categoría')}
        {renderPie(pieIngresos, 'Ingresos por categoría')}
      </div>

      {/* Line chart */}
      <Card title="Tendencia" subtitle={lineRangeLabel}>
        <div className="mb-4">
          <DateRangePicker value={lineRange} onChange={setLineRange} presets={LINE_PRESETS} />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              labelFormatter={(label) => String(label)}
              formatter={(v: number) =>
                `${v.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €`
              }
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ingresos"
              stroke="#22c55e"
              strokeWidth={2}
              dot={isDaily}
              name="Ingresos"
            />
            <Line
              type="monotone"
              dataKey="gastos"
              stroke="#ef4444"
              strokeWidth={2}
              dot={isDaily}
              name="Gastos"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  )
}
