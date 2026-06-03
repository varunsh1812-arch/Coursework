interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (value: string) => void
  size?: 'lg' | 'sm'
}

export default function ToggleButtonGroup({ options, value, onChange, size = 'sm' }: Props) {
  const base = size === 'lg'
    ? 'px-3 py-1.5 rounded-lg text-xs font-medium'
    : 'px-2.5 py-1 rounded text-xs font-medium'
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`${base} transition-colors ${
            value === opt.value ? 'bg-primary-600 text-white' : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
