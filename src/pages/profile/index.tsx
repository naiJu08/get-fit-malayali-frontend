import { useState } from 'react'

import MyProfileDrawer from './myProfile'

type Props = {
  isDrawerOpen: boolean
  viewMode: boolean
  setOpenMyprofile: (value: boolean) => void
  setViewMode: (value: boolean) => void
}

export default function MyProfile({
  isDrawerOpen,
  setOpenMyprofile,
  setViewMode,
  viewMode,
}: Props) {
  const [edit, setEdit] = useState(false)
  const [flag, setFlag] = useState(false)

  const [editViewIndicator, setEditViewIndicator] = useState(false)

  const handleClose = () => {
    setFlag(false)
    setOpenMyprofile(false)
    setViewMode(false)
    setEdit(false)
    if (editViewIndicator) {
      setFlag(true)
      setViewMode(true)
      setEditViewIndicator(false)
    }
  }
  return (
    <>
      {(isDrawerOpen || flag) && (
        <MyProfileDrawer
          isDrawerOpen={isDrawerOpen || flag}
          // rowData={rowData}
          edit={edit}
          setViewMode={setViewMode}
          setEdit={setEdit}
          viewMode={viewMode}
          handleClose={handleClose}
          editViewIndicator={editViewIndicator}
          setEditViewIndicator={setEditViewIndicator}
        />
      )}
    </>
  )
}
