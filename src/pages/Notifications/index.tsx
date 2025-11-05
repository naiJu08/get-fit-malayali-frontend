import React, { useEffect, useState } from 'react'
import { QbsTable } from 'qbs-react-grid'
import { Button, DialogModal } from '../../components/common'
import Icons from '../../components/common/icons'
import { TableColumns } from '../../common/types'
import { calcWindowHeight } from '../../utilities/calcHeight'
import { getSortedColumnName } from '../../utilities/parsers'
import { useNotifications } from './api'

function Notifications() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [columns, setColumns] = useState<TableColumns[]>([])
  const [sortType, setSortType] = useState<'asc' | 'desc' | undefined>(
    undefined
  )
  const [sortColumn, setSortColumn] = useState<string | undefined>(undefined)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const [ordering, setOrdering] = useState<string>('')

  useEffect(() => {
    setColumns([
      {
        title: 'ID',
        field: 'id',
        sortable: true,
        sortKey: 'id',
        colWidth: 120,
      },
      {
        title: 'Title',
        field: 'title',
        sortable: true,
        sortKey: 'title',
        colWidth: 280,
      },
      {
        title: 'Type',
        field: 'notification_type',
        sortable: true,
        sortKey: 'notification_type',
        colWidth: 160,
      },
      {
        title: 'Scheduled At',
        field: 'scheduled_at',
        sortable: true,
        sortKey: 'scheduled_at',
        colWidth: 200,
      },
      {
        title: 'Sent By',
        field: 'sent_by',
        sortable: true,
        sortKey: 'sent_by',
        colWidth: 180,
      },
    ])
  }, [])
  const { items, total, current_page, isFetching } = useNotifications({
    page,
    per_page: pageSize,
    search: '',
    ordering,
  })

  const handleSort = (orderColumn: any, orderDirection: any) => {
    setSortColumn(orderColumn)
    setSortType(orderDirection)
    const ord = getSortedColumnName(orderColumn, orderDirection)
    setOrdering(ord)
  }

  return (
    <div className="w-full p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <Button primary label="Create" onClick={() => setIsCreateOpen(true)} />
      </div>

      <div className="w-full">
        <QbsTable
          data={items}
          dataRowKey="id"
          toolbar={true}
          search={false}
          height={
            items.length === 0 ? calcWindowHeight(218) : calcWindowHeight(300)
          }
          isLoading={isFetching}
          sortType={sortType}
          sortColumn={sortColumn}
          handleColumnSort={handleSort}
          emptyTitle="No records to display"
          emptySubTitle=""
          columns={columns}
          pagination={true}
          paginationProps={{
            onPagination: (row: number) => setPage(row),
            total: total,
            currentPage: current_page ?? page,
            rowsPerPage: Number(pageSize),
            onRowsPerPage: (count: number) => {
              setPageSize(count)
              setPage(1)
            },
            dropOptions: [10, 20, 30, 50, 100],
          }}
          renderSortIcon={(sortType?: 'asc' | 'desc' | undefined) => {
            return sortType === 'asc' ? (
              <Icons name="ascending-icon" />
            ) : sortType === 'desc' ? (
              <Icons name="descending-icon" />
            ) : (
              <Icons name="qbs-sort-icon" />
            )
          }}
        />
      </div>

      <DialogModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create Notification"
        subTitle="Fill in the details to create a notification."
        actionLabel="Create"
        onSubmit={() => setIsCreateOpen(false)}
        small
        headborder
        body={
          <div className="flex flex-col gap-3 py-3">
            <div className="text-sm text-secondary">
              This is a placeholder modal. Hook up your form fields here.
            </div>
          </div>
        }
      />
    </div>
  )
}

export default Notifications
