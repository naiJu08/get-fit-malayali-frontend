import React from 'react'
import Icons from '../icons'
import { overviewItems } from './overviewItems'

function Overview() {
  return (
    <div className="w-100 bg-primaryThin p-5 border border-border rounded-t-xl">
      <div className="flex justify-between mb-2">
        <div className="flex gap-x-1.5 items-center ">
          <h4 className="text-m font-semibold">Overview</h4>
          <span className="font-semibold text-xxs text-successColor">Hide</span>
        </div>
        <div className="flex gap-x-1 5 items-center ">
          <div className="w-6 h-6 bg-grey-light flex items-center justify-center rounded-full stroke-grey-strong cursor-pointer transition durtaion-600  hover:rotate-180">
            <Icons name="settings" />
          </div>
          <div className="w-6 h-6 bg-grey-light flex items-center justify-center rounded-full stroke-grey-strong cursor-pointer">
            <Icons name="menu-up-arrow" />
          </div>
        </div>
      </div>

      <div className="flex flex-nowrap gap-3 overflow-x-auto overview-container">
        {overviewItems.map((item) => (
          <>
            <div className="select-none bg-white border border-border rounded-lg p-3 rounded-lg shrink-0 cursor-grab mb-1">
              <div className="flex justify-between mb-2.5 min-w-[150px]">
                <div className="w-6 h-6 stroke-primary flex items-center justify-center">
                  <Icons name={item.iconName} />
                </div>
                <div className="w-6 h-6 flex items-center justify-center cursor-pointer">
                  <Icons name="three_dot_horizontal" />
                </div>
              </div>
              <h4 className="text-common font-semibold mb-2.5">{item.name}</h4>
              {item.bar && (
                <>
                  <div className="flex gap-2 mb-2.5 items-center">
                    <div className="w-[228px] bg-grey-lightAlt rounded h-1.5 overflow-hidden">
                      <div
                        style={{ width: `${item.bar.percentage}%` }}
                        className={` h-1.5 rounded bg-primary`}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">
                      {item.bar.percentage}%
                    </span>
                  </div>
                  <h3 className="text-xxxl font-bold">{item.bar.value}/45</h3>
                </>
              )}
              <h3 className="text-xxxl font-bold">{item.value}</h3>
              <span className="text-grey-medium text-xs">{item.meta}</span>
            </div>

            {/* {item.bar &&
                <div className="xl:col-span-2 flex-grow">
                  <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                      <div className="w-6 h-6 stroke-primary flex items-center justify-center">
                        <Icons name={item.iconName} />
                      </div>
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Icons name="three_dot_horizontal" />
                      </div>
                    </div>
                    <h4 className="text-common font-semibold mb-4">
                      {item.name}
                    </h4>

                   
                    <h3 className="text-xxxl font-bold">
                      {item.bar.value}/45
                    </h3>
                  </div>
                </div>
} */}
          </>
        ))}

        {/* <div>
                <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                        <div className="w-6 h-6 stroke-primary flex items-center justify-center"><Icons name='attachment'/></div>
                        <div className="w-6 h-6 flex items-center justify-center"><Icons name='three_dot_horizontal'/></div>
                    </div>
                    <h4 className="text-common font-semibold mb-2.5">Name of the Dashlet</h4>
                    <h3 className="text-xxxl font-bold">2345</h3>
                    <span className='text-grey-medium text-xs'>Metadata</span>
                </div>
            </div>

            <div>
                <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                        <div className="w-6 h-6 stroke-primary flex items-center justify-center"><Icons name='activities'/></div>
                        <div className="w-6 h-6 flex items-center justify-center"><Icons name='three_dot_horizontal'/></div>
                    </div>
                    <h4 className="text-common font-semibold mb-2.5">Name of the Dashlet</h4>
                    <h3 className="text-xxxl font-bold">2345</h3>
                    <span className='text-grey-medium text-xs'>Metadata</span>
                </div>
            </div>

            <div>
                <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                        <div className="w-6 h-6 stroke-primary flex items-center justify-center"><Icons name='activities'/></div>
                        <div className="w-6 h-6 flex items-center justify-center"><Icons name='three_dot_horizontal'/></div>
                    </div>
                    <h4 className="text-common font-semibold mb-2.5">Name of the Dashlet</h4>
                    <h3 className="text-xxxl font-bold">2345</h3>
                    <span className='text-grey-medium text-xs'>Metadata</span>
                </div>
            </div>

            <div>
                <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                        <div className="w-6 h-6 stroke-primary flex items-center justify-center"><Icons name='activities'/></div>
                        <div className="w-6 h-6 flex items-center justify-center"><Icons name='three_dot_horizontal'/></div>
                    </div>
                    <h4 className="text-common font-semibold mb-2.5">Name of the Dashlet</h4>
                    <h3 className="text-xxxl font-bold">2345</h3>
                    <span className='text-grey-medium text-xs'>Metadata</span>
                </div>
            </div>

            <div className='xl:col-span-2 flex-grow'>
                <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                        <div className="w-6 h-6 stroke-primary flex items-center justify-center"><Icons name='activities'/></div>
                        <div className="w-6 h-6 flex items-center justify-center"><Icons name='three_dot_horizontal'/></div>
                    </div>
                    <h4 className="text-common font-semibold mb-4">Name of the Dashlet</h4>
                    <div className="flex gap-2 mb-2.5">
                        <div className="w-full bg-grey-light rounded h-1.5">
                            <div className="w-[80%] h-1.5 rounded bg-primary"></div>
                        </div>
                    </div>
                    <h3 className="text-xxxl font-bold">23/45</h3>
                </div>
            </div>

            <div className="xl:col-span-2 flex-grow">
                <div className="bg-white border border-border rounded-lg p-3 rounded-lg">
                    <div className="flex justify-between mb-2.5">
                        <div className="w-6 h-6 stroke-primary flex items-center justify-center"><Icons name='activities'/></div>
                        <div className="w-6 h-6 flex items-center justify-center"><Icons name='three_dot_horizontal'/></div>
                    </div>
                    <h4 className="text-common font-semibold mb-4">Name of the Dashlet</h4>
                    <div className="flex gap-2 mb-2.5">
                        <div className="w-full bg-grey-light rounded h-1.5">
                            <div className="w-[80%] h-1.5 rounded bg-primary"></div>
                        </div>
                    </div>
                    <h3 className="text-xxxl font-bold">23/45</h3>
                </div>
            </div> */}
      </div>
    </div>
  )
}

export default Overview
