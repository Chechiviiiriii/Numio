import React from 'react'
import { Input } from './Input'

export interface DatePreset {
  value: string
  label: string
  range?: () => { from: string; to: string }
}

export interface DateRangeValue {
  preset: string
  from: string
  to: string
}

interface DateRangePickerProps {
  value: DateRangeValue
  onChange: (value: DateRangeValue) => void
  presets: DatePreset[]
}

export function DateRangePicker({ value, onChange, presets }: DateRangePickerProps): React.ReactElement {
  const handlePreset = (preset: DatePreset): void => {
    if (preset.value === 'custom') {
      onChange({ preset: 'custom', from: value.from, to: value.to })
    } else if (preset.range) {
      const { from, to } = preset.range()
      onChange({ preset: preset.value, from, to })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-wrap">
        {presets.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => handlePreset(p)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              value.preset === p.value
                ? 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {value.preset === 'custom' && (
        <div className="flex gap-3 items-end">
          <Input
            type="date"
            label="Desde"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.target.value })}
          />
          <Input
            type="date"
            label="Hasta"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.target.value })}
          />
        </div>
      )}
    </div>
  )
}
