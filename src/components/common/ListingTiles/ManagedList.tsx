import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import * as React from 'react'

type Props = {
  groupData: any
  setGroupNameCode?: any
  selection?: any
}

export default function ManagedList({
  groupData,
  setGroupNameCode,
  selection,
}: Props) {
  const [value, setValue] = React.useState(selection)
  // const [tabItems, setTabItems] = React.useState(groupData ?? [])

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue)
  }
  const handleOnClick = (item: any) => {
    setGroupNameCode(item.code)
  }
  return (
    <div className="managedList-tabs">
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="basic tabs example"
      >
        {groupData?.map((item: any, index: any) => (
          <Tab
            key={index}
            label={item.name}
            onClick={() => handleOnClick(item)}
          />
        ))}
      </Tabs>
    </div>
  )
}
