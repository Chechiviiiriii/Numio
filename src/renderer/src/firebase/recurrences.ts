import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore'
import { db } from './config'
import { addDays, addWeeks, addMonths, addYears, parseISO, isBefore } from 'date-fns'
import type { Recurrence } from '../types'

function advanceDate(date: Date, frecuencia: Recurrence['frecuencia']): Date {
  switch (frecuencia) {
    case 'diario':
      return addDays(date, 1)
    case 'semanal':
      return addWeeks(date, 1)
    case 'mensual':
      return addMonths(date, 1)
    case 'anual':
      return addYears(date, 1)
  }
}

export async function procesarRecurrencias(userId: string): Promise<void> {
  const now = new Date()
  const q = query(
    collection(db, 'recurrences'),
    where('userId', '==', userId),
    where('activa', '==', true)
  )
  const snap = await getDocs(q)

  for (const docSnap of snap.docs) {
    const rec = { id: docSnap.id, ...docSnap.data() } as Recurrence
    let proxima = parseISO(rec.proximaEjecucion)

    if (!isBefore(proxima, now)) continue

    while (isBefore(proxima, now)) {
      await addDoc(collection(db, 'transactions'), {
        userId,
        tipo: rec.template.tipo,
        cantidad: rec.template.cantidad,
        categoriaId: rec.template.categoriaId,
        descripcion: rec.template.descripcion,
        fecha: proxima.toISOString(),
        recurrente: true,
        recurrenceId: rec.id,
        creadoEn: Timestamp.now()
      })
      proxima = advanceDate(proxima, rec.frecuencia)
    }

    await updateDoc(doc(db, 'recurrences', rec.id), {
      proximaEjecucion: proxima.toISOString()
    })
  }
}
