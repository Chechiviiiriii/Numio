import type { Budget, Category } from '../types'

export interface EffectiveBudget {
  categoria: Category
  limite: number
  source: 'plantilla' | 'override'
}

/**
 * Resuelve el presupuesto efectivo de cada categoría de gasto para un mes
 * (`yyyy-MM`): el override del mes si existe, si no la plantilla recurrente.
 */
export function getEffectiveBudgets(
  budgets: Budget[],
  categories: Category[],
  mes: string
): EffectiveBudget[] {
  const result: EffectiveBudget[] = []
  for (const cat of categories.filter((c) => c.tipo === 'gasto')) {
    const override = budgets.find(
      (b) => !b.esPlantilla && b.mes === mes && b.categoriaId === cat.id
    )
    const plantilla = budgets.find(
      (b) => b.esPlantilla === true && b.categoriaId === cat.id
    )
    const eff = override ?? plantilla
    if (eff) {
      result.push({
        categoria: cat,
        limite: eff.limite,
        source: override ? 'override' : 'plantilla'
      })
    }
  }
  return result
}
