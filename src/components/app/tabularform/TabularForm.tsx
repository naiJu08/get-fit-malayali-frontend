import { Controller, useFormContext } from 'react-hook-form'

import TextField from '../../common/inputs/TextField'
import { DataEntry, InputData, TabularColumn } from './types'
import { ExpandableToolTip } from 'react-core-ts'

type Props = {
  tabularData: InputData[]
  sideItem?: any
  columnTitle: any[]
  groupedColumns?: boolean
  hideEdit?: boolean
  editable?: boolean
}
export default function Tabularform({
  tabularData,
  editable,
  sideItem,
}: Props) {
  const { control } = useFormContext()

  function generateColumns(data: InputData): TabularColumn[] {
    const column: TabularColumn[] = []

    data.children[0].columns.forEach((col, index: number) => {
      const columnObj: TabularColumn = {
        title: col.name as string,
        id: index.toString(),
        children: [],
        editable: col.data.find((item) => item.editable) ? true : false,
      }
      col.data.forEach((entry, index) => {
        const title = entry.label as string

        columnObj.children.push({
          title: title,
          editable: entry.editable,
          id: index + 1,
        })
      })
      column.push(columnObj)
    })

    return column
  }

  // Generate the columns using the function
  const tabularColumns =
    tabularData?.length > 0 ? generateColumns(tabularData[0]) : []
  const handleTotalCountCell = (colInd: number, rowInd: number) => {
    if (tabularColumns) {
      return tabularColumns[colInd].children[rowInd].title === 'Total'
        ? true
        : false
    } else {
      return false
    }
  }
  const handleReturnNotEditable = (
    row: any,
    rowChild: any,
    rowField: any,
    rowIndex: number,
    childIndex: number,
    columnsIndex: number,
    fieldIndex: number
  ) => {
    return (
      <Controller
        name={`${rowIndex}.children.${childIndex}.columns.${columnsIndex}.data.${fieldIndex}.value`}
        control={control}
        render={({ field: { onChange, value } }) => (
          <TextField
            disabled={!editable || !rowField.editable}
            //tabularForm
            id={`${rowField.name?.toString()}${columnsIndex}${rowIndex}${childIndex}`}
            onChange={onChange}
            value={value}
            type={rowField.editable ? 'number' : 'text'}
            totalCount={handleTotalCountCell(columnsIndex, fieldIndex)}
            tabularForm={
              rowChild.rowTitle !== 'Total' &&
              !handleTotalCountCell(columnsIndex, fieldIndex)
                ? true
                : false
            }
            allowPositiveOnly
            isTotal={
              (rowChild.rowTitle === 'Total' || !row.editable) &&
              !handleTotalCountCell(columnsIndex, fieldIndex)
                ? true
                : false
            }
            name={rowField.name}
          />
        )}
      />
    )
  }
  const handleReturnEditable = (
    rowField: any,
    rowIndex: number,
    childIndex: number,
    columnsIndex: number,
    fieldIndex: number
  ) => {
    return (
      <Controller
        name={`${rowIndex}.children.${childIndex}.columns.${columnsIndex}.data.${fieldIndex}.value`}
        control={control}
        render={({ field: { value, onChange } }) => (
          <TextField
            disabled={!editable || !rowField.editable}
            id={`${rowField.name?.toString()}${columnsIndex}${rowIndex}${childIndex}`}
            allowPositiveOnly
            onChange={onChange}
            value={value}
            type={rowField.editable ? 'number' : 'text'}
            name={rowField.name}
          />
        )}
      />
    )
  }

  const columnSeparation = (data: any, fieldIndex: number) => {
    const result = data?.filter((item: any) => item.editable)
    return fieldIndex === result.length - 1
  }
  console.log(sideItem, 'fasldfj')
  return (
    <div className="flex flex-col w-full bg-white max-h-[80vh] p-5 rounded-md">
      <div className="w-full overflow-auto pb-5">
        {/* TOP SECTION - INCLUDING HANGING ITEMS  */}
        <div className="bg-white flex flex-col w-fit sticky top-0 z-10">
          <div className="flex">
            {/* LEFT WIDTH SPACER  */}
            <div className="w-[200px] me-2 shrink-0 h-[100px] bg-white sticky left-0 z-30"></div>
            {/* HANGGING ITEMS  */}
            <ul className="flex gap-3 text-center bg-white mb-2">
              {tabularColumns?.map((tabcolum: any) =>
                editable ? (
                  tabcolum?.editable && (
                    <li key={tabcolum.id}>
                      {tabcolum.title && (
                        <span className="py-3 block mb-4 relative z-10 bg-bgTabHeader rounded-xs text-blackAlt text-common font-semibold min-w-[100px]">
                          {tabcolum.title}
                        </span>
                      )}
                      {tabcolum.children && (
                        <ul className="flex gap-2">
                          {tabcolum.children?.map((childColumn: any) => (
                            <>
                              {childColumn.editable && (
                                <li
                                  key={childColumn.id}
                                  className={`w-[150px] flex justify-center py-2 text-xs ${childColumn.title === 'Total' ? 'bg-purpleLight font-medium ' : 'bg-tabHeader'}  rounded-xs`}
                                >
                                  {childColumn.title !== 'Others' ||
                                  (sideItem !== 'Gender Breakdown' &&
                                    sideItem !== 'Age Breakdown') ? (
                                    childColumn.title
                                  ) : (
                                    <ExpandableToolTip
                                      enabled
                                      title={
                                        <span className="text-xxs text-nowrap">
                                          Those who identify in another way
                                        </span>
                                      }
                                    >
                                      <p className="relative">
                                        {childColumn.title}
                                        <span className="text-danger ms-1">
                                          *
                                        </span>
                                      </p>
                                    </ExpandableToolTip>
                                  )}
                                </li>
                              )}
                            </>
                          ))}
                        </ul>
                      )}
                    </li>
                  )
                ) : (
                  <li key={tabcolum.id}>
                    <span className="py-3 block mb-4 relative z-10 bg-bgTabHeader rounded-xs text-blackAlt text-common font-semibold min-w-[100px]">
                      {tabcolum.title}
                    </span>
                    {tabcolum.children && (
                      <ul className="flex gap-2">
                        {tabcolum.children?.map((childColumn: any) => (
                          <>
                            <li
                              key={childColumn.id}
                              className={`w-[150px] py-2 text-xs flex justify-center ${childColumn.title === 'Total' ? 'bg-purpleLight font-medium' : 'bg-tabHeader'}  rounded-xs`}
                            >
                              {childColumn.title !== 'Others' ||
                              (sideItem !== 'Gender Breakdown' &&
                                sideItem !== 'Age Breakdown') ? (
                                childColumn.title
                              ) : (
                                <ExpandableToolTip
                                  enabled
                                  title={
                                    <span className="text-xxs text-nowrap">
                                      Those who identify in another way
                                    </span>
                                  }
                                >
                                  <p className="relative">
                                    {childColumn.title}
                                    <span className="text-danger ms-1">*</span>
                                  </p>
                                </ExpandableToolTip>
                              )}
                            </li>
                          </>
                        ))}
                      </ul>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        </div>

        {/* LEFT MENU & SUBMENU ALSO INCLUDING INPUT ROWS  */}
        <ul className="w-fit bg-white relative z-0">
          {tabularData?.map((row, rowIndex) => (
            <li className="mb-2 last:mb-0" key={row.title}>
              {/* LEFT LABEL  */}
              {editable ? (
                <>
                  {row?.editable && (
                    <>
                      {row.children && row.grouped ? (
                        <>
                          <div className="flex gap-2 items-center">
                            <div className="block px-5 py-1 bg-bgGrey rounded-xs shrink-0 w-full relative z-30">
                              <span className="text-xs text-blackAlt sticky left-4 z-[3] font-semibold">
                                {row.title}
                              </span>
                            </div>
                          </div>
                          {/* LEFT HANGING ITEMS  & INPUT ROW  (OPTIONAL)*/}

                          <ul className="ps-[70px] mt-[10px] text-xs ">
                            {row.children?.map(
                              (rowChild: any, childIndex: number) => (
                                <>
                                  {rowChild.rowTitle !== 'Total' && (
                                    <li
                                      key={rowChild.rowTitle}
                                      className=" gap-2 flex relative tab-total"
                                    >
                                      <span
                                        className="p-3 w-[130px] inline-block shrink-0 sticky left-16 bg-white z-20 before:z-[5] before:absolute before:w-[20px] before:h-[55px] before:-top-[30px] before:-left-5 before:border before:border-t-0 before:border-r-0
                            after:absolute after:-left-[100px] after:-top-[10px] after:bottom-0 after:w-[230px] after:bg-white after:-z-[1]
                            "
                                      >
                                        {rowChild.rowTitle}
                                      </span>

                                      {/* INPUT ROWS  */}

                                      <div className=" gap-2 flex items-center relative">
                                        {rowChild?.columns?.map(
                                          (
                                            columns: any,
                                            columnsIndex: number
                                          ) => (
                                            <>
                                              {columns?.data?.map(
                                                (
                                                  rowField: DataEntry,
                                                  fieldIndex: number
                                                ) => (
                                                  <>
                                                    {rowField.editable && (
                                                      <div
                                                        className={`w-[150px] coloredFields text-center ${columnSeparation(columns.data, fieldIndex) && 'me-1'}`}
                                                        key={rowField.name}
                                                      >
                                                        {handleReturnEditable(
                                                          rowField,
                                                          rowIndex,
                                                          childIndex,
                                                          columnsIndex,
                                                          fieldIndex
                                                        )}
                                                      </div>
                                                    )}
                                                  </>
                                                )
                                              )}
                                            </>
                                          )
                                        )}
                                      </div>
                                    </li>
                                  )}
                                </>
                              )
                            )}
                          </ul>
                        </>
                      ) : (
                        <>
                          <div className="flex gap-2">
                            <div className="block px-5 py-1 bg-white rounded-xs  shrink-0 w-[200px] sticky left-0 z-[3]  ">
                              <span className="text-xs text-blackAlt  font-semibold  ">
                                {row.title}
                              </span>
                            </div>
                            <div className=" gap-2 flex items-center ">
                              <div className="flex gap-2">
                                {row.children?.map(
                                  (rowChild: any, childIndex: number) => (
                                    <>
                                      {rowChild?.columns?.map(
                                        (
                                          columns: any,
                                          columnsIndex: number
                                        ) => (
                                          <>
                                            {columns?.data?.map(
                                              (
                                                rowField: DataEntry,
                                                fieldIndex: number
                                              ) => (
                                                <>
                                                  {rowField.editable && (
                                                    <div
                                                      className={`w-[150px] coloredFields ${columnSeparation(columns.data, fieldIndex) && 'me-1'}`}
                                                      key={rowField.name}
                                                    >
                                                      {handleReturnEditable(
                                                        rowField,
                                                        rowIndex,
                                                        childIndex,
                                                        columnsIndex,
                                                        fieldIndex
                                                      )}
                                                    </div>
                                                  )}
                                                </>
                                              )
                                            )}
                                          </>
                                        )
                                      )}
                                    </>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  {row.children && row.grouped ? (
                    <>
                      <div className="flex gap-2 items-center">
                        <div className="block px-5 py-1 bg-bgGrey rounded-xs shrink-0 w-full relative z-30">
                          <span className="text-xs text-blackAlt sticky left-4 z-[3] font-semibold">
                            {row.title}
                          </span>
                        </div>
                      </div>
                      {/* LEFT HANGING ITEMS  & INPUT ROW  (OPTIONAL)*/}

                      <ul className="ps-[70px] mt-[10px] text-xs ">
                        {row.children?.map(
                          (rowChild: any, childIndex: number) => (
                            <li
                              key={rowChild.rowTitle}
                              className=" gap-2 flex relative tab-total"
                            >
                              <span
                                className="p-3 w-[120px] me-2 inline-block shrink-0 sticky left-20 bg-white z-20 before:z-[5] before:absolute before:w-[20px] before:h-[55px] before:-top-[30px] before:-left-5 before:border before:border-t-0 before:border-r-0
                            after:absolute after:-left-[100px] after:-top-[10px] after:bottom-0 after:w-[200px] after:bg-white after:-z-[1]
                            "
                              >
                                {rowChild.rowTitle}
                              </span>

                              {/* INPUT ROWS  */}

                              <div className=" gap-2 flex items-center relative">
                                {rowChild?.columns?.map(
                                  (columns: any, columnsIndex: number) => (
                                    <>
                                      {columns?.data?.map(
                                        (
                                          rowField: DataEntry,
                                          fieldIndex: number
                                        ) => (
                                          <div
                                            className={`w-[150px] coloredFields text-center ${fieldIndex === columns?.data?.length - 1 && `me-1 ${handleTotalCountCell(columnsIndex, fieldIndex) && 'font-medium'}`}`}
                                            key={rowField.name}
                                          >
                                            {handleReturnNotEditable(
                                              row,
                                              rowChild,
                                              rowField,
                                              rowIndex,
                                              childIndex,
                                              columnsIndex,
                                              fieldIndex
                                            )}
                                          </div>
                                        )
                                      )}
                                    </>
                                  )
                                )}
                              </div>
                            </li>
                          )
                        )}
                      </ul>
                    </>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <div className="block px-5 py-1  rounded-xs  shrink-0 w-[200px] sticky left-0 z-[3] bg-white">
                          <span className="text-xs text-blackAlt  font-semibold  ">
                            {row.title}
                          </span>
                        </div>
                        <div className=" gap-2 flex items-center ">
                          <div className="flex gap-2">
                            {row.children?.map(
                              (rowChild: any, childIndex: number) => (
                                <>
                                  {rowChild?.columns?.map(
                                    (columns: any, columnsIndex: number) => (
                                      <>
                                        {columns?.data?.map(
                                          (
                                            rowField: DataEntry,
                                            fieldIndex: number
                                          ) => (
                                            <div
                                              className={`w-[150px] coloredFields text-center ${fieldIndex === columns?.data?.length - 1 && `me-1 ${handleTotalCountCell(columnsIndex, fieldIndex) && 'font-medium'}`}`}
                                              key={rowField.name}
                                            >
                                              {handleReturnNotEditable(
                                                row,
                                                rowChild,
                                                rowField,
                                                rowIndex,
                                                childIndex,
                                                columnsIndex,
                                                fieldIndex
                                              )}
                                            </div>
                                          )
                                        )}
                                      </>
                                    )
                                  )}
                                </>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
