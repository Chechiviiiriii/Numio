import React, { useState } from 'react'
import { deleteDoc, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useDataStore } from '../../stores/dataStore'
import { useAuthStore } from '../../stores/authStore'
import { procesarRecurrencias } from '../../firebase/recurrences'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { capitalize } from '../../lib/format'

const FRECUENCIA_LABEL: Record<string, string> = {
  diario: 'Diario',
  semanal: 'Semanal',
  mensual: 'Mensual',
  anual: 'Anual'
}

export function RecurrenceList(): React.ReactElement {
  const { recurrences, categories } = useDataStore()
  const { user } = useAuthStore()
  const [processing, setProcessing] = useState(false)

  const getCatName = (id: string): string =>
    categories.find((c) => c.id === id)?.nombre ?? '—'

  const handleToggle = async (id: string, current: boolean): Promise<void> => {
    await updateDoc(doc(db, 'recurrences', id), { activa: !current })
  }

  const handleDelete = async (id: string): Promise<void> => {
    if (!confirm('¿Eliminar esta recurrencia?')) return
    await deleteDoc(doc(db, 'recurrences', id))
  }

  const handleProcess = async (): Promise<void> => {
    if (!user) return
    setProcessing(true)
    try {
      await procesarRecurrencias(user.uid)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recurrencias</h2>
        <Button onClick={handleProcess} variant="secondary" disabled={processing}>
          {processing ? 'Procesando...' : 'Procesar ahora'}
        </Button>
      </div>

      {recurrences.length === 0 ? (
        <Card>
          <p className="text-center text-gray-400 py-4">
            No hay recurrencias. Crea una marcando "Transacción recurrente" al añadir una transacción.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurrences.map((rec) => {
            const proxima = (() => {
              try {
                return capitalize(format(parseISO(rec.proximaEjecucion), "d MMM yyyy", { locale: es }))
              } catch {
                return rec.proximaEjecucion
              }
            })()
            return (
              <div
                key={rec.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
              >
                <div
                  className={`w-2 h-10 rounded-full flex-shrink-0 ${rec.activa ? 'bg-green-500' : 'bg-gray-300'}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 dark:text-gray-100 truncate">
                    {rec.template.descripcion}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getCatName(rec.template.categoriaId)} · {FRECUENCIA_LABEL[rec.frecuencia]}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-semibold ${rec.template.tipo === 'ingreso' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}
                  >
                    {rec.template.tipo === 'ingreso' ? '+' : '-'}
                    {rec.template.cantidad.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                  </p>
                  <p className="text-xs text-gray-400">Próx: {proxima}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(rec.id, rec.activa)}
                    className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${rec.activa ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                  >
                    <span
                      className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform ${rec.activa ? 'translate-x-4' : 'translate-x-1'}`}
                      style={{ marginTop: '3px' }}
                    />
                  </button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(rec.id)}>
                    <span className="text-red-500">Eliminar</span>
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
