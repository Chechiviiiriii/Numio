import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
}

export function Card({ children, className = '', title }: CardProps): React.ReactElement {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
