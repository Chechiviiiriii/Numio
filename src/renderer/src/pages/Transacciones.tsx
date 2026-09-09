import React, { useState } from 'react'
import { TransactionList } from '../components/transactions/TransactionList'
import { RecurrenceList } from '../components/recurrences/RecurrenceList'

export function Transacciones(): React.ReactElement {
  const [tab, setTab] = useState<'list' | 'recurrencias'>('list')

  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
        {(['list', 'recurrencias'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t === 'list' ? 'Transacciones' : 'Recurrencias'}
          </button>
        ))}
      </div>
      {tab === 'list' ? <TransactionList /> : <RecurrenceList />}
    </div>
  )
}
