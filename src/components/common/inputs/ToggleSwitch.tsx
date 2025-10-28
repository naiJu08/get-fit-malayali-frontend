import React, { useState } from 'react'

import { ToggleSwitchProps } from '../../../common/types'

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  checked,
  disabled,
  className,
  onChange,
}) => {
  const [isChecked, setIsChecked] = useState(checked ?? false)

  const handleToggle = () => {
    if (!disabled) {
      const newChecked = !isChecked
      setIsChecked(newChecked)
      onChange(newChecked)
    }
  }

  return (
    <div className={`switch ${className}`}>
      <input
        type="checkbox"
        id={id}
        checked={checked ?? undefined}
        onChange={handleToggle}
        disabled={disabled}
      />
      <label htmlFor={id} className=""></label>
    </div>
  )
}

export default ToggleSwitch
