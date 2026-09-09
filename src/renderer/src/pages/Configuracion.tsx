import React from 'react'
import { CategoryManager } from '../components/categories/CategoryManager'
import { useAuthStore } from '../stores/authStore'
import { Card } from '../components/ui/Card'
import { useThemeStore } from '../stores/themeStore'
import { Switch } from '../components/ui/Switch'

export function Configuracion(): React.ReactElement {
  const { user, profile } = useAuthStore()
  const { theme, setTheme } = useThemeStore()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Configuración</h1>

      <Card title="Cuenta">
        {profile?.nombre ? (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            <span className="font-medium">Nombre:</span> {profile.nombre}
          </p>
        ) : null}
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-medium">Email:</span> {user?.email}
        </p>
      </Card>

      <Card title="Apariencia">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Tema oscuro</span>
          <Switch
            checked={theme === 'dark'}
            onChange={(v) => setTheme(v ? 'dark' : 'light')}
            ariaLabel="Alternar tema oscuro"
          />
        </div>
      </Card>

      <Card title="Categorías">
        <CategoryManager />
      </Card>
    </div>
  )
}
