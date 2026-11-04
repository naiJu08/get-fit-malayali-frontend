import React from 'react'
import TextField from './TextField'

type ColorPickerProps = {
  id: string
  name: string
  label?: string
  value: string
  onChange: (value: string) => void
}

const ColorPicker: React.FC<ColorPickerProps> = ({
  id,
  name,
  label = 'Color',
  value,
  onChange,
}) => (
  <div className="w-full">
    <label className="labels label-text">{label}</label>
    <div className="flex items-center gap-2">
      <input
        id={id}
        name={name}
        type="color"
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-12 rounded-lg border border-formBorder bg-white p-1 cursor-pointer"
      />
      <div className="flex-1">
        <TextField
          id={id + '-value'}
          name={name + '_value'}
          label=""
          placeholder="#176b5b"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
    </div>
  </div>
)

export default ColorPicker
