import React from 'react'

interface DuplicateField {
  field: string
  label?: string
  newline?: boolean
  hideComma?: boolean
}

interface Duplicate {
  [key: string]: any
}

interface DuplicateListItemProps {
  duplicate: Duplicate
  fields?: { [key: string]: DuplicateField }
  handleStyle: (itemName: string, field: any) => string
  handleStyleForPhone?: (itemName: string, field: any) => string
  field: any
  trimValue: any
}

const DuplicateListItem: React.FC<DuplicateListItemProps> = ({
  duplicate,
  fields,
  handleStyle,
  field,
  trimValue,
  handleStyleForPhone,
}) => {
  const rows: React.ReactNode[][] = []
  let currentRow: React.ReactNode[] = []
  fields &&
    Object.entries(fields).forEach(([itemName, itemValue], index, array) => {
      const labelElement = itemValue.label ? (
        <label
          key={`label-${itemName}`}
          className={`text-xxs leading-4 font-medium text-secondary w-auto inline-block whitespace-nowrap `}
        >
          {itemValue.label}
        </label>
      ) : undefined

      const dataElement = field.isMobileOrEmail ? (
        duplicate[itemValue.field] || itemValue.label ? (
          duplicate[itemValue.field] === trimValue ? (
            <span
              className={`  ${
                handleStyleForPhone &&
                handleStyleForPhone(itemName, itemValue.field)
              }`}
              key={`data-${itemName}`}
            >
              <>
                {itemValue.label ? (
                  <>{duplicate[itemValue.field] ?? '--'}</>
                ) : (
                  <>{duplicate[itemValue.field]}</>
                )}
              </>
            </span>
          ) : (
            <>
              {itemValue.label ? (
                <span>{duplicate[itemValue.field] ?? '--'}</span>
              ) : (
                <span>{duplicate[itemValue.field]}</span>
              )}
            </>
          )
        ) : undefined
      ) : duplicate[itemValue.field] || itemValue.label ? (
        <span
          className={`  ${handleStyle(itemName, field)}`}
          key={`data-${itemName}`}
        >
          <>
            {itemValue.label ? (
              <span>{duplicate[itemValue.field] ?? '--'}</span>
            ) : (
              <span>{duplicate[itemValue.field]}</span>
            )}
          </>
        </span>
      ) : undefined

      // const dataElement =
      //   duplicate[itemValue.field] || itemValue.label ? (
      //     <span
      //       className={`  ${handleStyle(itemName, field)}`}
      //       key={`data-${itemName}`}
      //     >
      //       <>
      //         {itemValue.label ? (
      //           <>{duplicate[itemValue.field] ?? '--'}</>
      //         ) : (
      //           <>{duplicate[itemValue.field]}</>
      //         )}
      //       </>
      //     </span>
      //   ) : undefined
      const hasValueAndNotHidingComma =
        duplicate[itemValue.field] != null && !itemValue.hideComma

      const needsComma =
        currentRow.length > 0 &&
        index < array.length - 1 &&
        hasValueAndNotHidingComma &&
        duplicate[array[index - 1][1].field] != null

      if (needsComma) {
        currentRow.push(
          <span
            className={`text-xxs fieldNameSm leading-4 font-medium text-secondary `}
            key={`comma-${itemName}`}
          >
            {','}
          </span>
        )
      }
      if (labelElement || dataElement) {
        currentRow.push(
          <React.Fragment key={`fragment-${itemName}`}>
            {labelElement}
            {dataElement}
          </React.Fragment>
        )
      }

      if (itemValue.newline && currentRow.length > 0) {
        rows.push(currentRow)
        currentRow = [] // Reset the current row
      }
    })

  if (currentRow.length > 0) {
    rows.push(currentRow)
  }
  return (
    <li>
      {rows.map((row, index) => (
        <div
          className="flex flex-wrap gap-1 items-center fieldNameXs"
          key={`row-${index}`}
        >
          {row}
        </div>
      ))}
    </li>
  )
}

export default DuplicateListItem
