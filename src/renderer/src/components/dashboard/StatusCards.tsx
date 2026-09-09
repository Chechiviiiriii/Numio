import React, { useMemo } from 'react'
import { useDataStore } from '../../stores/dataStore'
import { getEffectiveBudgets } from '../../lib/budgets'
import { format, startOfMonth, addMonths, differenceInCalendarDays } from 'date-fns'

const fmt = (n: number): string =>
  n.toLocaleString('es-ES', { minimumFractionDigits: 2 })

const CalendarIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
)

const BadgeIcon = (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
)

const cardClass =
  'bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5'
const labelClass =
  'text-xs font-semibold tracking-widest text-gray-400 dark:text-gray-500 uppercase'

export function StatusCards(): React.ReactElement {
  const { budgets, categories, transactions } = useDataStore()

  const now = new Date()
  const mes = format(now, 'yyyy-MM')
  const diasRestantes = Math.max(
    differenceInCalendarDays(startOfMonth(addMonths(now, 1)), now),
    1
  )

  const effective = useMemo(
    () => getEffectiveBudgets(budgets, categories, mes),
    [budgets, categories, mes]
  )

  const gastoPorCat = (catId: string): number =>
    transactions
      .filter(
        (t) => t.tipo === 'gasto' && t.categoriaId === catId && t.fecha.startsWith(mes)
      )
      .reduce((s, t) => s + t.cantidad, 0)

  const totalPresupuesto = effective.reduce((s, e) => s + e.limite, 0)
  const totalGastado = effective.reduce((s, e) => s + gastoPorCat(e.categoria.id), 0)
  const restante = totalPresupuesto - totalGastado
  const porDia = restante / diasRestantes

  const pcts = effective.map((e) =>
    e.limite > 0 ? gastoPorCat(e.categoria.id) / e.limite : 0
  )
  const total = pcts.length
  const fuera = pcts.filter((p) => p >= 1).length
  const ambar = pcts.filter((p) => p >= 0.8 && p < 1).length
  const enMargen = pcts.filter((p) => p < 1).length
  const hasBudgets = total > 0

  const estado =
    fuera >= 1
      ? { txt: 'Fuera de control', cls: 'text-red-600 dark:text-red-400' }
      : ambar >= 1
        ? { txt: 'Atención', cls: 'text-amber-500 dark:text-amber-400' }
        : { txt: 'En control', cls: 'text-green-600 dark:text-green-400' }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Cierre de ciclo */}
      <div className={cardClass}>
        <div className="flex items-start justify-between">
          <span className={labelClass}>Cierre de ciclo</span>
          <span className="text-primary-500">{CalendarIcon}</span>
        </div>
        <p className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-3">
          {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Hasta renovación</p>
        {hasBudgets && (
          <p
            className={`text-sm mt-3 flex items-center gap-1.5 ${
              porDia < 0 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {fmt(porDia)} € / día disp.
          </p>
        )}
      </div>

      {/* Estado global */}
      <div className={cardClass}>
        <div className="flex items-start justify-between">
          <span className={labelClass}>Estado global</span>
          <span className={hasBudgets ? estado.cls : 'text-gray-400'}>{BadgeIcon}</span>
        </div>
        {hasBudgets ? (
          <>
            <p className={`text-3xl font-bold mt-3 ${estado.cls}`}>{estado.txt}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {enMargen} de {total} en margen
            </p>
            {fuera > 0 && (
              <p className="text-sm text-red-500 mt-3 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {fuera} fuera de rango
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-2xl font-bold text-gray-400 mt-3">Sin presupuestos</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Define límites en la pestaña Presupuestos
            </p>
          </>
        )}
      </div>
    </div>
  )
}
