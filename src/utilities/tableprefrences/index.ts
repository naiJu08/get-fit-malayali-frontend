// import { useCallback, useState } from 'react'

// // import {
// //   getTablePreference,
// //   getTablePreferences,
// //   saveTablePreferences,
// // } from '../../apis/common.apis'
// import { useSnackbarManager } from '../../components/common/snackbar'
// import { useTableStore } from '../../store/tableColumns/tableColumnStore'

// type CallBackReturn = {
//   updatedColumns: any
//   setColumnData: (data: any) => void
//   handleSaveColumns: (columns: any, tableTitle: string) => void
//   getSavedColumns: (defaultColumns: any, tableTtle: string) => any
//   handleGetAllPrefrences: () => void
// }
// export const useTablePreference = (): CallBackReturn => {
//   const { columnData, setColumnData } = useTableStore()
//   const [updatedColumns, setUpdatedColumns] = useState<any>()
//   const { enqueueSnackbar } = useSnackbarManager()
//   const handleSaveColumns = useCallback((columns: any, tableTitle: string) => {
//     const sortedColumns = columns?.map((item: any, index: 1) => ({
//       ...item,
//       sortOrder: index + 1,
//       colId: `col-id-${index + 1}`,
//     }))
//     saveTablePreferences({
//       reference_slug: tableTitle,
//       choice: 'table_preference',
//       data: sortedColumns,
//     }).then(() => {
//       enqueueSnackbar('Table settings saved successfully', {
//         variant: 'success',
//       })
//       getTablePreference(tableTitle).then((res) => {
//         setUpdatedColumns(res.data?.data)
//         setColumnData({ ...columnData, [tableTitle]: res.data?.data })
//       })
//     })
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])

//   const getSavedColumns = useCallback(
//     (defaultcolums: any, tableTitle: string) => {
//       const savedColumn = columnData ? columnData[tableTitle as string] : []
//       const defaultCol = defaultcolums.map((item: any, index: 1) => ({
//         ...item,
//         colId: `col-id-${index + 1}`,
//       }))
//       if (savedColumn && savedColumn?.length > 0) {
//         const sortedArray = defaultCol.map((item: any) => {
//           const savedCol = savedColumn?.find(
//             (sub: any) => sub.title === item.title
//           )
//           if (savedCol) {
//             return {
//               ...item,
//               isVisible: savedCol?.isVisible,
//               colWidth: savedCol?.colWidth,
//               sortOrder: savedCol?.sortOrder,
//             }
//           }
//           return item
//         })
//         return sortedArray.sort((a: any, b: any) => {
//           return a.sortOrder - b.sortOrder
//         })
//       } else {
//         return defaultcolums
//       }
//     },
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//     []
//   )

//   const handleGetAllPrefrences = useCallback(async () => {
//     const { data } = await getTablePreferences()
//     let sortedColumns = {}
//     if (data) {
//       data?.forEach((item: any) => {
//         sortedColumns = { ...sortedColumns, [item.reference_slug]: item.data }
//       })
//       setColumnData(sortedColumns)
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [])
//   return {
//     updatedColumns,
//     setColumnData,
//     handleSaveColumns,
//     getSavedColumns,
//     handleGetAllPrefrences,
//   }
// }
export const TABlE_COLUMNS = {
  ACCOUNT: 'account_table',
}
