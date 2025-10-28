import React from 'react'
import { LoaderProps } from '../../../common/types'

const Loader: React.FC<LoaderProps> = () => {
  return (
    <div
      style={{ backgroundColor: 'rgba(255, 255, 255, 0.5)' }}
      className="w-full h-full absolute top-3"
    >
      <section className="dots-container">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </section>
    </div>
  )
}

export default Loader
