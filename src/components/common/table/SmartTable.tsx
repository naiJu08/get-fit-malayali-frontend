import React, { useEffect, useMemo, useState } from 'react'
import Icons from '../icons'
import ColumnIcon from '../icons/ColumnIcon'
import { TableColumns } from '../../../common/types'

type Action = {
  title: string
  icon: React.ReactNode
  toolTip?: string
  action: (row: any) => void
  hide?: (row: any) => boolean
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
}

type PaginationProps = {
  total: number
  currentPage: number
  rowsPerPage: number
  dropOptions?: number[]
  onPagination: (page: number) => void
  onRowsPerPage: (rows: number | string) => void
  totalPages?: number
}

type SmartTableProps = {
  data: any[]
  dataRowKey?: string
  columns: TableColumns[]
  title?: string
  sortColumn?: string
  sortType?: 'asc' | 'desc'
  handleColumnSort?: (
    orderColumn: string,
    orderDirection: 'asc' | 'desc'
  ) => void
  isLoading?: boolean
  height?: number | string
  emptyTitle?: string
  emptySubTitle?: string
  actionProps?: Action[]
  pagination?: boolean
  paginationProps?: PaginationProps
  toolbar?: boolean
  columnToggle?: boolean
  search?: boolean
  searchValue?: string
  onSearchChange?: (val: string) => void
  onSearch?: (val?: string) => void
  externalActions?: boolean
  toolbarExtra?: React.ReactNode
  searchPlaceholder?: string
  createButton?: React.ReactNode
}

const SmartTable: React.FC<SmartTableProps> = ({
  data,
  dataRowKey = 'id',
  columns,
  title,
  sortColumn,
  sortType,
  handleColumnSort,
  isLoading,
  height,
  emptyTitle = 'No records to display',
  emptySubTitle = '',
  actionProps = [],
  pagination = false,
  paginationProps,
  toolbar = true,
  columnToggle = false,
  search = false,
  searchValue = '',
  onSearchChange,
  onSearch,
  externalActions = false,
  toolbarExtra,
  searchPlaceholder,
  createButton,
}) => {
  const [visibleColumns, setVisibleColumns] = useState<TableColumns[]>(columns)
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [selectedRowKey, setSelectedRowKey] = useState<any | null>(null)
  const [hoveredRow, setHoveredRow] = useState<any | null>(null)
  const [actionAnimation, setActionAnimation] = useState<string | null>(null)

  useEffect(() => {
    setVisibleColumns(columns)
  }, [columns])

  const toggleColumn = (field: string) => {
    setVisibleColumns((prev) =>
      prev.map((c) =>
        c.field === field ? { ...c, isVisible: !c.isVisible } : c
      )
    )
  }

  const handleSortClick = (col: TableColumns) => {
    if (!handleColumnSort || !col.sortable) return
    const current =
      sortColumn === (col.sortKey || col.field) ? sortType : undefined
    const next: 'asc' | 'desc' = current === 'asc' ? 'desc' : 'asc'
    handleColumnSort(col.sortKey || col.field, next)
  }

  const handleActionClick = (action: Action, row: any) => {
    // Trigger animation
    setActionAnimation(`${action.title}-${row[dataRowKey]}`)
    setTimeout(() => setActionAnimation(null), 600)

    // Execute action
    action.action(row)
  }

  const getActionVariantStyles = (variant: Action['variant'] = 'secondary') => {
    const baseStyles =
      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 border'

    const variants = {
      primary:
        'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:shadow-md hover:scale-105',
      secondary:
        'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100 hover:shadow-md hover:scale-105',
      danger:
        'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:shadow-md hover:scale-105',
      success:
        'bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:shadow-md hover:scale-105',
    }

    return `${baseStyles} ${variants[variant]}`
  }

  const renderedColumns = useMemo(
    () => visibleColumns.filter((c) => c.isVisible !== false),
    [visibleColumns]
  )

  const renderCell = (col: TableColumns, row: any) => {
    if (col.customCell && col.renderCell) {
      const { cell } = col.renderCell(row)
      return cell
    }
    return row[col.field]
  }

  const header = (
    <thead className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
      <tr>
        {renderedColumns.map((col) => (
          <th
            key={col.field}
            className={`px-6 py-3 text-left text-[11px] font-semibold text-gray-600 uppercase tracking-wide ${
              col.align === 'right'
                ? 'text-right'
                : col.align === 'center'
                  ? 'text-center'
                  : 'text-left'
            }`}
          >
            <div className="flex items-center gap-2 select-none">
              <span className="text-gray-700">{col.title}</span>
              {handleColumnSort && col.sortable && (
                <button
                  className="text-gray-400 hover:text-blue-500 transition-colors duration-200 p-1 rounded hover:bg-blue-50"
                  onClick={() => handleSortClick(col)}
                  title="Sort"
                >
                  {sortColumn === (col.sortKey || col.field) ? (
                    sortType === 'asc' ? (
                      <Icons
                        name="ascending-icon"
                        className="w-4 h-4 text-blue-500"
                      />
                    ) : sortType === 'desc' ? (
                      <Icons
                        name="descending-icon"
                        className="w-4 h-4 text-blue-500"
                      />
                    ) : (
                      <Icons name="qbs-sort-icon" className="w-4 h-4" />
                    )
                  ) : (
                    <Icons name="qbs-sort-icon" className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
          </th>
        ))}
        {!!actionProps.length && (
          <th className="px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider text-left">
            Actions
          </th>
        )}
      </tr>
    </thead>
  )

  const empty = (
    <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
      <div className="mb-4 transform scale-125">
        <Icons name="no-data-icon" className="w-16 h-16 opacity-50" />
      </div>
      <p className="text-lg font-medium text-gray-500 mb-2">{emptyTitle}</p>
      {emptySubTitle && (
        <p className="text-sm text-gray-400">{emptySubTitle}</p>
      )}
    </div>
  )

  const loader = (
    <div className="flex items-center justify-center py-20">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-gray-500">Loading data...</span>
    </div>
  )

  const paginationView =
    pagination && paginationProps
      ? (() => {
          const total = paginationProps.total || 0
          const rpp = Number(paginationProps.rowsPerPage || 10)
          const page = Math.max(1, Number(paginationProps.currentPage || 1))
          const totalPages =
            paginationProps.totalPages ?? Math.max(1, Math.ceil(total / rpp))
          const start = total === 0 ? 0 : (page - 1) * rpp + 1
          const end = Math.min(total, page * rpp)

          return (
            <div className="px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Summary */}
              <div className="text-sm text-gray-600">
                Showing <strong className="text-gray-800">{start}</strong>–
                <strong className="text-gray-800">{end}</strong> of{' '}
                <strong className="text-gray-800">{total}</strong> items
              </div>

              {/* Pagination Controls */}
              <div className="flex items-center gap-1">
                <button
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-white hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => paginationProps.onPagination(1)}
                  disabled={page <= 1}
                >
                  First
                </button>
                <button
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-white hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() =>
                    paginationProps.onPagination(Math.max(1, page - 1))
                  }
                  disabled={page <= 1}
                >
                  Previous
                </button>

                <div className="mx-2 flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <button
                        key={pageNum}
                        className={`w-8 h-8 text-sm rounded-lg transition-all ${
                          page === pageNum
                            ? 'bg-blue-500 text-white shadow-md'
                            : 'border border-gray-300 hover:bg-white hover:shadow-sm'
                        }`}
                        onClick={() => paginationProps.onPagination(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                  {totalPages > 5 && (
                    <span className="px-2 text-gray-400">...</span>
                  )}
                </div>

                <button
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-white hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() =>
                    paginationProps.onPagination(Math.min(totalPages, page + 1))
                  }
                  disabled={page >= totalPages}
                >
                  Next
                </button>
                <button
                  className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-white hover:shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  onClick={() => paginationProps.onPagination(totalPages)}
                  disabled={page >= totalPages}
                >
                  Last
                </button>
              </div>

              {/* Rows per page */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Rows per page</span>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={rpp}
                  onChange={(e) =>
                    paginationProps.onRowsPerPage(Number(e.target.value))
                  }
                >
                  {(paginationProps.dropOptions || [10, 20, 30, 50, 100]).map(
                    (n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          )
        })()
      : null

  return (
    <div
      className="border border-gray-100 rounded-xl overflow-hidden bg-white flex flex-col shadow-sm transition-all duration-300 hover:shadow-md"
      style={{ height }}
    >
      {/* Toolbar */}
      {(toolbar || columnToggle || search || !!title) && (
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-4">
            {title ? (
              <div className="font-semibold text-lg text-gray-800">{title}</div>
            ) : null}
            {search && (
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-600">Search</label>
                <div className="relative">
                  <input
                    className="pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                    // placeholder="Search records..."
                    placeholder={searchPlaceholder}
                    value={searchValue || ''}
                    onChange={(e) =>
                      onSearchChange && onSearchChange(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && onSearch) onSearch(searchValue)
                    }}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Icons name="search" className="w-4 h-4" />
                  </span>
                </div>
              </div>
            )}
            {toolbarExtra && (
              <div className="flex items-end gap-3">{toolbarExtra}</div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {createButton && <div>{createButton}</div>}
            {columnToggle && (
              <div className="flex items-center gap-3">
                <div className="relative">
                  <span
                    role="button"
                    aria-label="Toggle columns"
                    tabIndex={0}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-sm transition-all cursor-pointer"
                    onClick={() => setShowColumnMenu((s) => !s)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ')
                        setShowColumnMenu((s) => !s)
                    }}
                  >
                    <ColumnIcon
                      size={16}
                      className="text-primaryBlue group-hover:text-primaryPink"
                    />
                  </span>
                  {showColumnMenu && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-xl z-20 p-3 animate-fadeIn">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Visible Columns
                      </div>
                      {columns.map((c) => (
                        <label
                          key={c.field}
                          className="flex items-center gap-3 py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors duration-150 cursor-pointer group"
                        >
                          <input
                            type="checkbox"
                            checked={
                              (visibleColumns.find((v) => v.field === c.field)
                                ?.isVisible ?? true) !== false
                            }
                            onChange={() => toggleColumn(c.field)}
                            className="rounded text-blue-500 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 group-hover:text-gray-900 flex-1">
                            {c.title}
                          </span>
                          {handleColumnSort && c.sortable && (
                            <Icons
                              name="qbs-sort-icon"
                              className="w-3 h-3 text-gray-400"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Content */}
      <div
        className="overflow-auto flex-1 relative"
        style={{ maxHeight: typeof height === 'number' ? height : undefined }}
      >
        <table className="min-w-full table-fixed">
          {header}
          {isLoading ? null : (
            <tbody className="divide-y divide-gray-100">
              {data.map((row, idx) => {
                const rowKey = row?.[dataRowKey] ?? idx
                const isSelected = selectedRowKey === rowKey
                const isHovered = hoveredRow === rowKey

                return (
                  <tr
                    key={rowKey}
                    className={`
                      transition-all duration-150
                      ${
                        isSelected
                          ? 'bg-blue-50 ring-1 ring-inset ring-blue-200'
                          : idx % 2 === 0
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-gray-50 hover:bg-gray-100'
                      }
                      ${isHovered ? 'shadow-[0_1px_6px_rgba(0,0,0,0.06)]' : ''}
                    `}
                    onMouseEnter={() => setHoveredRow(rowKey)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    {renderedColumns.map((col) => (
                      <td
                        key={col.field}
                        className={`
                          px-6 py-3 text-sm text-gray-800 align-middle transition-colors duration-150
                          ${
                            col.align === 'right'
                              ? 'text-right'
                              : col.align === 'center'
                                ? 'text-center'
                                : 'text-left'
                          }
                          ${isHovered ? 'text-gray-900' : ''}
                        `}
                      >
                        {(() => {
                          const content = renderCell(col, row)
                          const anyCol: any = col as any
                          if (typeof anyCol.rowClick === 'function') {
                            return (
                              <button
                                type="button"
                                className={`$${'underline-offset-2'} ${
                                  anyCol.link
                                    ? 'text-blue-600 hover:underline'
                                    : 'hover:opacity-80'
                                }`}
                                title={anyCol.toolTip}
                                onClick={() => anyCol.rowClick(row)}
                              >
                                {content}
                              </button>
                            )
                          }
                          return content
                        })()}
                      </td>
                    ))}

                    {/* Actions Column */}
                    {!!actionProps.length && (
                      <td className="px-6 py-4">
                        {externalActions ? (
                          <button
                            className={`
                              w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300
                              ${
                                isSelected
                                  ? 'bg-blue-500 text-white rotate-45 shadow-md'
                                  : 'bg-gray-100 text-gray-600 hover:bg-blue-500 hover:text-white hover:shadow-md'
                              }
                            `}
                            title={isSelected ? 'Hide actions' : 'Show actions'}
                            onClick={() => {
                              const nextKey = isSelected ? null : rowKey
                              setSelectedRowKey(nextKey)
                              setSelectedRow(nextKey === null ? null : row)
                            }}
                          >
                            <span className="text-lg font-light leading-none transition-transform duration-300">
                              +
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {actionProps.map((a, i) => {
                              const isHidden = a.hide ? a.hide(row) : false
                              if (isHidden) return null

                              const actionKey = `${a.title}-${rowKey}`
                              const isAnimating = actionAnimation === actionKey

                              return (
                                <button
                                  key={i}
                                  className={`
                                    ${getActionVariantStyles(a.variant)}
                                    ${isAnimating ? 'animate-pulse scale-110' : ''}
                                    ${isHovered ? 'opacity-100' : 'opacity-90'}
                                  `}
                                  title={a.toolTip || a.title}
                                  onClick={() => handleActionClick(a, row)}
                                >
                                  <span
                                    className={`transition-transform duration-200 ${isAnimating ? 'scale-125' : ''}`}
                                  >
                                    {a.icon}
                                  </span>
                                  <span className="hidden sm:inline">
                                    {a.title}
                                  </span>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          )}
        </table>
        {isLoading ? loader : data.length === 0 ? empty : null}
      </div>

      {/* External Action Bar */}
      {externalActions && selectedRow && !!actionProps.length && (
        <div className="border-t bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 animate-slideUp">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-gray-700 mr-2">
              Actions for:{' '}
              <strong className="text-blue-600">
                {title ?? selectedRowKey}
              </strong>
            </span>
            <div className="flex flex-wrap gap-2">
              {actionProps.map((a, i) => {
                const isHidden = a.hide ? a.hide(selectedRow) : false
                if (isHidden) return null

                const actionKey = `${a.title}-${selectedRowKey}`
                const isAnimating = actionAnimation === actionKey

                return (
                  <button
                    key={i}
                    className={`
                      ${getActionVariantStyles(a.variant)}
                      ${isAnimating ? 'animate-bounce scale-110' : ''}
                      transition-all duration-300
                    `}
                    title={a.toolTip || a.title}
                    onClick={() => handleActionClick(a, selectedRow)}
                  >
                    <span
                      className={`transition-transform duration-200 ${isAnimating ? 'rotate-12 scale-125' : ''}`}
                    >
                      {a.icon}
                    </span>
                    <span>{a.title}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {paginationView}

      {/* Custom CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default SmartTable
