import React from 'react'
import { CategoryManager } from '../components/categories/CategoryManager'
import { useAuthStore } from '../stores/authStore'
import { Card } from '../components/ui/Card'
import { useThemeStore } from '../stores/themeStore'

export function Configuracion(): React.ReactElement {
  const { user } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuración</h1>

      <Card title="Cuenta">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Email:</span> {user?.email}
        </p>
      </Card>

      <Card title="Apariencia">
        <div className="flex gap-2">
          {(['light', 'dark'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === t
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {t === 'light' ? 'Claro' : 'Oscuro'}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Categorías">
        <CategoryManager />
      </Card>
    </div>
  )
}
