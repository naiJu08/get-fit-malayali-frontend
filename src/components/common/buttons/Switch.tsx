import { SwitchButtonProps } from '../../../common/types'
import React from 'react'

const Switch: React.FC<SwitchButtonProps> = ({
  name,
  id,
  label,
  handleChange = undefined,
  disabled = false,
}) => {
  return (
    <div className={`labels label-text ${disabled ? ' opacity-70' : ''} `}>
      <label className="switch">
        <input
          type="checkbox"
          disabled={disabled}
          name={name}
          id={id}
          onChange={handleChange}
        />
        <span className="slider"></span>
      </label>
      {label}
    </div>
  )
}

export default Switch
