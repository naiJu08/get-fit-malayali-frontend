import React, { createContext, MutableRefObject, useContext } from 'react'

type ScrollContextType = MutableRefObject<HTMLDivElement | null>

const ScrollContext = createContext<ScrollContextType | null>(null)

interface ScrollProviderProps {
  children: React.ReactNode
  value: ScrollContextType // The ref to be provided
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({
  children,
  value,
}) => {
  return (
    <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>
  )
}

export const useScroll = (): ScrollContextType | null => {
  return useContext(ScrollContext)
}
