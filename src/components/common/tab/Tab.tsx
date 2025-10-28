import React from 'react'
type TabProps = {
  id: string | number
  className?: string
  children: React.ReactNode
  activeTab?: string | number
}
const Tabs: React.FC<TabProps> = ({ children, className, id, activeTab }) => {
  return (
    <>
      {activeTab === id && (
        <div className={className} id={id as string}>
          {children}
        </div>
      )}
    </>
  )
}

export default Tabs
