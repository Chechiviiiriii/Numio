import React, { useState, useMemo } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuthStore } from '../../stores/authStore'
import { useDataStore } from '../../stores/dataStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Modal } from '../ui/Modal'
import { format } from 'date-fns'
import type { Budget, Category } from '../../types'

type Tab = 'mes' | 'plantilla'
type ModalScope = 'plantilla' | 'mes'
type EffectiveSource = 'override' | 'plantilla'

interface EffectiveRow {
  cat: Category
  effective: { budget: Budget; source: EffectiveSource }
}

export function BudgetManager(): React.ReactElement {
  const { user } = useAuthStore()
  const { budgets, categories, transactions } = useDataStore()

  const [activeTab, setActiveTab] = useState<Tab>('mes')
  const [mes, setMes] = useState(format(new Date(), 'yyyy-MM'))
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [catId, setCatId] = useState('')
  const [limite, setLimite] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalScope, setModalScope] = useState<ModalScope>('mes')

  const gastosCats = categories.filter((c) => c.tipo === 'gasto')

  const catOptions = [
    { value: '', label: 'Seleccionar categoría...' },
    ...gastosCats.map((c) => ({ value: c.id, label: c.nombre }))
  ]

  // --- Resolution helpers (read from store, no Firestore queries) ---
  const getPlantilla = (cId: string): Budget | undefined =>
    budgets.find((b) => b.esPlantilla === true && b.categoriaId === cId)

  const getOverride = (cId: string, m: string): Budget | undefined =>
    budgets.find((b) => !b.esPlantilla && b.mes === m && b.categoriaId === cId)

  const getEffective = (
    cId: string,
    m: string
  ): { budget: Budget; source: EffectiveSource } | undefined => {
    const override = getOverride(cId, m)
    if (override) return { budget: override, source: 'override' }
    const plantilla = getPlantilla(cId)
    if (plantilla) return { budget: plantilla, source: 'plantilla' }
    return undefined
  }

  // --- Transactions for selected month ---
  const mesTransacciones = useMemo(
    () => transactions.filter((t) => t.tipo === 'gasto' && t.fecha.startsWith(mes)),
    [transactions, mes]
  )

  const getGasto = (cId: string): number =>
    mesTransacciones.filter((t) => t.categoriaId === cId).reduce((s, t) => s + t.cantidad, 0)

  // --- Effective rows for "Mes" view ---
  const mesRows = useMemo((): EffectiveRow[] => {
    const gastoCats = categories.filter((c) => c.tipo === 'gasto')
    return gastoCats
      .map((cat) => ({ cat, effective: getEffective(cat.id, mes) }))
      .filter(
        (row): row is EffectiveRow => row.effective !== undefined
      )
  }, [categories, budgets, mes]) // eslint-disable-line react-hooks/exhaustive-deps

  // --- Totals ---
  const totalPresupuestado = mesRows.reduce((s, r) => s + r.effective.budget.limite, 0)
  const totalGastado = mesRows.reduce((s, r) => s + getGasto(r.cat.id), 0)

  // --- Bar color ---
  const getBarColor = (pct: number): string => {
    if (pct >= 1) return 'bg-red-500'
    if (pct >= 0.8) return 'bg-amber-400'
    return 'bg-green-500'
  }

  // --- Modal open helpers ---
  const openCreateMes = (): void => {
    setEditingId(null)
    setCatId('')
    setLimite('')
    setModalScope('mes')
    setFormOpen(true)
  }

  const openCreatePlantilla = (): void => {
    setEditingId(null)
    setCatId('')
    setLimite('')
    setModalScope('plantilla')
    setFormOpen(true)
  }

  const openEditDoc = (id: string, cId: string, lim: number): void => {
    setEditingId(id)
    setCatId(cId)
    setLimite(String(lim))
    setFormOpen(true)
  }

  // Prefill override with plantilla's limit
  const openPersonalizar = (cId: string, plantillaLimite: number): void => {
    setEditingId(null)
    setCatId(cId)
    setLimite(String(plantillaLimite))
    setModalScope('mes')
    setFormOpen(true)
  }

  // --- Save ---
  const handleSave = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!user) return
    setLoading(true)
    try {
      const limiteNum = parseFloat(limite)
      if (editingId) {
        await updateDoc(doc(db, 'budgets', editingId), {
          categoriaId: catId,
          limite: limiteNum
        })
      } else {
        const isPlantilla = activeTab === 'plantilla' || modalScope === 'plantilla'
        if (isPlantilla) {
          const existing = getPlantilla(catId)
          if (existing) {
            await updateDoc(doc(db, 'budgets', existing.id), {
              categoriaId: catId,
              limite: limiteNum
            })
          } else {
            await addDoc(collection(db, 'budgets'), {
              userId: user.uid,
              categoriaId: catId,
              limite: limiteNum,
              mes: null,
              esPlantilla: true
            })
          }
        } else {
          const existing = getOverride(catId, mes)
          if (existing) {
            await updateDoc(doc(db, 'budgets', existing.id), {
              categoriaId: catId,
              limite: limiteNum
            })
          } else {
            await addDoc(collection(db, 'budgets'), {
              userId: user.uid,
              categoriaId: catId,
              limite: limiteNum,
              mes,
              esPlantilla: false
            })
          }
        }
      }
      setFormOpen(false)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, label: string): Promise<void> => {
    if (!confirm(`¿Eliminar ${label}?`)) return
    await deleteDoc(doc(db, 'budgets', id))
  }

  const handleResetToPlantilla = async (overrideId: string): Promise<void> => {
    if (!confirm('¿Restablecer a la plantilla? Se eliminará el ajuste de este mes.')) return
    await deleteDoc(doc(db, 'budgets', overrideId))
  }

  const modalTitle = editingId
    ? 'Editar presupuesto'
    : activeTab === 'plantilla'
    ? 'Nueva plantilla'
    : 'Nuevo presupuesto'

  return (
    <div className="space-y-4">
      {/* Header with tab switcher */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Presupuestos</h2>
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('mes')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'mes'
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setActiveTab('plantilla')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'plantilla'
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Plantilla
          </button>
        </div>
      </div>

      {/* MES view */}
      {activeTab === 'mes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Input
              type="month"
              value={mes}
              onChange={(e) => setMes(e.target.value)}
            />
            <Button onClick={openCreateMes}>+ Nuevo</Button>
          </div>

          {mesRows.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400">
              No hay presupuestos para {mes}
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {mesRows.map(({ cat, effective }) => {
                  const gasto = getGasto(cat.id)
                  const pct = effective.budget.limite > 0 ? gasto / effective.budget.limite : 0
                  const pctDisplay = Math.min(pct * 100, 100)
                  const isOverride = effective.source === 'override'

                  return (
                    <div
                      key={cat.id}
                      className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                    >
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800 dark:text-gray-200">
                            {cat.nombre}
                          </span>
                          {isOverride ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                              Personalizado
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              Plantilla
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {gasto.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                            {' / '}
                            {effective.budget.limite.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                          </span>
                          {isOverride ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  openEditDoc(effective.budget.id, cat.id, effective.budget.limite)
                                }
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResetToPlantilla(effective.budget.id)}
                              >
                                <span className="text-amber-600 dark:text-amber-400">
                                  Restablecer a plantilla
                                </span>
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openPersonalizar(cat.id, effective.budget.limite)}
                            >
                              Personalizar este mes
                            </Button>
                          )}
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
                          {pct >= 1
                            ? 'Presupuesto superado'
                            : `${Math.round(pct * 100)}% del presupuesto usado`}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Totals */}
              <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                Presupuestado:{' '}
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {totalPresupuestado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </span>
                {' · '}
                Gastado:{' '}
                <span
                  className={`font-medium ${
                    totalGastado > totalPresupuestado
                      ? 'text-red-500'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {totalGastado.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* PLANTILLA view */}
      {activeTab === 'plantilla' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openCreatePlantilla}>+ Nuevo</Button>
          </div>

          {gastosCats.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-400">
              No hay categorías de gasto
            </div>
          ) : (
            <div className="space-y-3">
              {gastosCats.map((cat) => {
                const plantilla = getPlantilla(cat.id)
                return (
                  <div
                    key={cat.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-200">{cat.nombre}</span>
                    <div className="flex items-center gap-3">
                      {plantilla ? (
                        <>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {plantilla.limite.toLocaleString('es-ES', { minimumFractionDigits: 2 })} €/mes
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDoc(plantilla.id, cat.id, plantilla.limite)}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(plantilla.id, 'la plantilla')}
                          >
                            <span className="text-red-500">Eliminar</span>
                          </Button>
                        </>
                      ) : (
                        <span className="text-sm text-gray-400 dark:text-gray-500 italic">
                          sin plantilla
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={modalTitle} size="sm">
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
          {!editingId && activeTab === 'mes' && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aplicar a:</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="plantilla"
                  checked={modalScope === 'plantilla'}
                  onChange={() => setModalScope('plantilla')}
                  className="accent-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Todos los meses (plantilla)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="scope"
                  value="mes"
                  checked={modalScope === 'mes'}
                  onChange={() => setModalScope('mes')}
                  className="accent-primary-600"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Solo {mes}</span>
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setFormOpen(false)}
              className="flex-1"
            >
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
