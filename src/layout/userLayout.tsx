import { useRef } from 'react'

import { useLayoutStore } from '../store/layoutStore'
// import Footer from './footer'
import HeaderTop from './headerTop'
import { ScrollProvider } from './scrollcontext'
// import Overview from '../components/common/overview/overview'
// import SideNav from './sidenav'
import SideNav from './sidenav'

// type LayoutType = 'headerNav' | 'sideNav'

export default function Layout({ children }: any) {
  // let layoutType: LayoutType = 'headerNav'

  const { layoutType, expand } = useLayoutStore()
  const mainRef = useRef(null)

  return (
    <div className={`flex h-screen bg-mainBgColor pt-[64px]`}>
      <HeaderTop />

      <div className="flex-1 flex  overflow-hidden relative">
        {layoutType === 'sideNav' && <SideNav />}
        <ScrollProvider value={mainRef}>
          <div
            className={`flex h-full w-full overflow-auto flex-col ms-0 duration-300  ${layoutType === 'sideNav' && expand ? 'sm:ms-20 xl:ms-[240px] 2xl:ms-[280px]' : !expand ? 'ms-20' : ''}`}
          >
            {/* <Header /> */}
            <main
              ref={mainRef}
              className={` bg-mainBgColor  flex flex-col h-full w-full overflow-x-hidden overflow-y-auto`}
            >
              {children}
              {/* <Overview />
            <InvoiceTable /> */}
            </main>
            {/* <Footer /> */}
          </div>
        </ScrollProvider>
      </div>
    </div>
  )
}
