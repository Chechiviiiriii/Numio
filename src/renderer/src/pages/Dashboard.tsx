import React from 'react'
import { SummaryCards } from '../components/dashboard/SummaryCards'
import { Charts } from '../components/dashboard/Charts'
import { useDataStore } from '../stores/dataStore'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function Dashboard(): React.ReactElement {
  const { recurrences, categories } = useDataStore()

  const upcoming = recurrences
    .filter((r) => r.activa)
    .sort((a, b) => a.proximaEjecucion.localeCompare(b.proximaEjecucion))
    .slice(0, 5)

  const getCatName = (id: string): string =>
    categories.find((c) => c.id === id)?.nombre ?? '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {format(new Date(), "MMMM yyyy", { locale: es })}
        </p>
      </div>

      <SummaryCards />
      <Charts />

      {upcoming.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Próximas recurrencias</h3>
          <div className="space-y-2">
            {upcoming.map((r) => {
              const fecha = (() => {
                try { return format(parseISO(r.proximaEjecucion), "d MMM yyyy", { locale: es }) }
                catch { return r.proximaEjecucion }
              })()
              return (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-gray-800 dark:text-gray-200">{r.template.descripcion}</span>
                    <span className="text-gray-400 ml-2">({getCatName(r.template.categoriaId)})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500 dark:text-gray-400">{fecha}</span>
                    <span className={`font-medium ${r.template.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {r.template.tipo === 'ingreso' ? '+' : '-'}
                      {r.template.cantidad.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
