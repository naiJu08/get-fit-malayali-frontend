import { AutoComplete } from 'qbs-core'

import DialogModal from '../../../components/common/modal/DialogModal'

type CreateBatchForm = {
  selectedUsers: any[]
  name: string
  description: string
}

type CreateBatchDialogProps = {
  isOpen: boolean
  loading: boolean
  form: CreateBatchForm
  getUsers: (key?: string, nextBlock?: number) => Promise<any[]>
  onClose: () => void
  onSubmit: () => void
  onChange: (field: keyof CreateBatchForm, value: any) => void
}

const CreateBatchDialog = ({
  isOpen,
  loading,
  form,
  getUsers,
  onClose,
  onSubmit,
  onChange,
}: CreateBatchDialogProps) => {
  return (
    <DialogModal
      isOpen={isOpen}
      onClose={onClose}
      title={'Create Batch'}
      actionLabel={'Create'}
      actionLoader={loading}
      onSubmit={onSubmit}
      secondaryAction={onClose}
      secondaryActionLabel="Cancel"
      body={
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Batch name</label>
            <input
              className="textfield"
              value={form.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="Jan Fitness Cohort"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Description</label>
            <textarea
              className="textfield"
              value={form.description}
              onChange={(e) => onChange('description', e.target.value)}
              placeholder="Jan subscribers"
              rows={3}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Users</label>
            <AutoComplete
              placeholder="Search users"
              desc="value"
              descId="id"
              type={'auto_suggestion'}
              isMultiple={true}
              selectedItems={form.selectedUsers}
              value={''}
              async={true}
              initialLoad={true}
              paginationEnabled={true}
              getData={getUsers}
              name="batch-users"
              onChange={(value: any) => onChange('selectedUsers', value ?? [])}
            />
          </div>
        </div>
      }
    />
  )
}

export default CreateBatchDialog
