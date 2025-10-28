import { FabProps } from '../../../common/types'
import React from 'react'

import Icon from '../icons'

const Fab: React.FC<FabProps> = ({
  icon = 'fab-edit',
  type = 'button',
  onClick = undefined,
  className = '',
  outlined = false,
  primary = true,
  size = 'md',
  isLoading = false,
  disabled = false,
}) => {
  const generateClassName = () => {
    let genclass = `fab rounded-full `

    if (primary) {
      genclass += ` ${outlined ? 'btn-primary-outlined ' : 'btn-primary '}`
    } else {
      genclass += `${outlined ? 'btn-secondary-outlined ' : 'btn-secondary '}`
    }

    if (size === 'sm') {
      genclass += ' small'
    }
    if (size === 'xs') {
      genclass += ' extra-small'
    }
    if (className) {
      genclass += ` ${className}`
    }
    return genclass
  }
  return (
    <>
      <button
        type={type}
        disabled={disabled || isLoading}
        onClick={onClick}
        className={generateClassName()}
      >
        <Icon
          name={icon}
          className={`flex items-center justify-center   ${
            outlined ? '' : 'text-white'
          }`}
        />
      </button>
    </>
  )
}

export default Fab
