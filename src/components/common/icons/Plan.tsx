import React from 'react'

export default function Plan({
  width = 24,
  height = 24,
  fill = '#fff', // White color
  className = '',
  style = {},
  ...props
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      width={width}
      height={height}
      viewBox="0 0 64 64"
      version="1.1"
      xmlSpace="preserve"
      style={style}
      className={className}
      {...props}
    >
      <g id="Layer_2">
        <g fill={fill}>
          <path d="M47,19.1v-7h-7V4.9h-1H10v40h7l0,7.3h7l0,7h30v-40H47z M12,6.9l26,0v36H12V6.9z M19,44.9h21V14.1h5v6v30H25h-6L19,44.9z     M52,57.1H26l0-5h21v-31h5V57.1z" />
          <rect height="2" width="21" x="14.5" y="11.9" />
          <rect height="2" width="21" x="14.5" y="15.4" />
          <rect height="2" width="21" x="14.5" y="18.9" />
          <rect height="2" width="21" x="14.5" y="22.4" />
          <rect height="2" width="7.8" x="14.5" y="25.9" />
          <rect height="2" width="4.5" x="14.5" y="36.4" />
        </g>
      </g>
    </svg>
  )
}
