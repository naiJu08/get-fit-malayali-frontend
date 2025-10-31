import React, { JSX, ReactNode } from 'react'
import { FieldErrors } from 'react-hook-form'

export interface ButtonDropdownItemProps {
  icon?: string
  label?: string

  hidden?: boolean
  disabled?: boolean
  [key: string]: any
}
export interface ButtonDropDownProps {
  onClick: (data?: any) => void
  items: ButtonDropdownItemProps[]
}
export interface ButtonProps {
  label?: string
  icon?: string
  type?: 'button' | 'submit' | 'reset'
  iconAlignment?: 'left' | 'right'
  onClick?: (e?: any) => void
  outlined?: boolean
  primary?: boolean
  className?: string
  fullwidth?: boolean
  dropdown?: ButtonDropDownProps
  size?: 'xs' | 'sm' | 'md' | 'common'
  isLoading?: boolean
  disabled?: boolean
  hidden?: boolean
  isPrimary?: boolean
  tooltip?: string
}
export interface FabProps {
  icon?: string
  type?: 'button' | 'submit' | 'reset'
  onClick?: (e: any) => void
  outlined?: boolean
  primary?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string

  isLoading?: boolean
  disabled?: boolean
}
export interface SwitchButtonProps {
  id: string
  name: string
  label?: string
  disabled?: boolean

  handleChange?: (e: any) => void
}
export interface CheckboxProps {
  id: string
  name?: string
  className?: string
  label?: string
  disabled?: boolean
  intermediate?: boolean
  checked?: boolean
  handleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  errors?: any
  required?: any
  placeholder?: any
  hideRequired?: any
}
export type ToggleSwitchProps = {
  id: string
  checked?: boolean
  disabled?: boolean
  className?: string
  onChange: (checked: boolean) => void
}

export interface IconsProps {
  name: string
  className?: string
  onClick?: (e: any) => void
  toolTip?: string
}

export interface IconProps {
  stroke?: number
  className?: string
}
export interface ButtonLoaderProps {
  position?: 'left' | 'right' | 'center'
}
export interface LoaderProps {
  isActive?: boolean
}
export interface ApiResponse {
  data: any[]
}
export interface TextFieldProps {
  id: string
  name: string
  label?: string
  type?: string
  fullwidth?: boolean
  disabled?: boolean
  placeholder?: string
  required?: boolean
  isTotal?: boolean
  fieldEdit?: boolean
  tabularForm?: boolean
  edited?: boolean
  totalCount?: boolean
  onEditComplete?: () => void
  onEditCancel?: () => void
  adorement?: JSX.Element
  autoComplete?: boolean
  autoFocus?: boolean
  register?: any
  setFocus?: any
  errors?: any
  onChange?: (value: any) => void
  value?: string
  onBlur?: () => void
  ref?: any
  hidden?: boolean
  actionLabel?: string
  handleAction?: () => void
  disableAction?: boolean
  handleDisableAction?: (val: boolean) => void
  allowPositiveOnly?: boolean
  digitsOnly?: boolean
  errorFlag?: boolean
  toLowercase?: boolean
}

export interface FileUploadProps {
  id: string
  name: string
  subName: string
  label?: string
  type?: string
  fullwidth?: boolean
  disabled?: boolean
  isMultiple?: boolean
  required?: boolean
  errors?: FieldErrors
  handleDeleteFile?: (data?: any) => void
  onChange?: (value: any) => void
  value?: any
  supportedFiles?: string
  sizeLimit?: number
  buttonLabel?: string
  iconName?: string
  selectedFiles?: any
  supportedExtensions?: string[]
  setSelectedFiles?: (selectedFiles: any) => void
  needConfirmation?: boolean
  setAttachmentName?: (value: any) => void
  accept?: string
}

export interface FieldViewProps {
  label?: string
  value?: string | any
  fullwidth?: boolean
  spacing?: boolean
  link?: string
  required?: boolean
  image?: boolean
  hidden?: boolean
  truncate?: boolean
  type?: string
}
export interface QueryParams {
  page: number
  search?: string
  page_size?: number | string
  ordering?: string
  type?: string
  currentDomain?: string
}
export interface SearchParams {
  search?: string
}

export interface TextAreaProps {
  id: string
  name: string
  label?: string
  rows?: number
  fullwidth?: boolean
  disabled?: boolean
  placeholder?: string
  required?: boolean
  fieldEdit?: boolean
  edited?: boolean
  onEditComplete?: () => void
  onChange?: (value: any) => void
  onEditCancel?: () => void
  adorement?: JSX.Element
  autoComplete?: boolean
  autoFocus?: boolean
  register?: any
  setFocus?: any
  value?: string
  errors?: FieldErrors
  maxLength?: number
  wordCount?: number
  classNames?: string
  desc?: string
  errorFlag?: boolean
}
export interface MenuExplorerProps {
  FunctionId: string
  ParentId: string | null
  FunctionType: number
  FunctionName: string
  PathName: string | null
  Create: boolean
  Modify: boolean
  Delete: boolean
  Favourite: boolean
  SymbolName: string | null
  TaskTypeId: string | null
  ComponentName: string | null
  HelpDocPath: string | null
  childView?: boolean
}

export interface FavouriteMenuProps {
  FunctionId: string
  ParentId: string | null
  FunctionType: number
  FunctionName: string
  PathName: string | null
  Create: boolean
  Modify: boolean
  Delete: boolean
  Favourite: boolean
  SymbolName: string | null
  TaskTypeId: string | null
  ComponentName: string | null
  HelpDocPath: string | null
  childView?: boolean
}
export interface FavouriteSideNavProps {
  favMenuData: FavouriteMenuProps[]
  onSetFavorites: (menu: FavouriteMenuProps) => void
}

export interface TableProps {
  columns: {
    title: string
    field: string
    type?: string
    sort?: boolean
  }[]
  data?: any[]
  handleSort?: (key: string, name: string) => void
  rowData?: any
  actionDropDown?: {
    title: string
    slug: string
    iconName: string
    id: string
    isWarning?: boolean
  }[]
  handleMenuActions?: (slug: string, rowData?: any) => void
  onSearch?: (val?: string) => void
  search?: boolean
  searchValue?: string
  handleSearchValue?: (val?: string) => void
  asyncSearch?: boolean
  title?: string
  toolBar?: boolean
}
export type PageProps = {
  paginationProps: {
    total?: number
    rowsPerPage?: number
    dropOptions?: number[]
    currentPage?: number
    maxPage?: number
    onRowsPerPage?: (row: number, page: number) => void
    onPagination?: (row: number, page: number) => void
  }
}
export interface SideNavProps {
  menuData: MenuExplorerProps[]
  favMenuData: FavouriteMenuProps[]
  handleChildView: (id: string) => void
  handleButtonClick: (
    buttonRef: HTMLDivElement,
    menu: MenuExplorerProps
  ) => void
  selectedButtonRef?: HTMLDivElement
  handleSetFav: (menu: MenuExplorerProps) => void
  onSetFavorites: (menu: MenuExplorerProps) => void
  open: boolean
  sectionId: string
}
export interface ConfirmModalProps {
  isOpen: boolean
  modalId?: string | undefined
  isCloseIcon?: boolean
  disabled?: boolean
  topIcon?: string
  onClose?: (type?: string, key?: string | undefined) => void
  onSubmit?: () => void
  actionLabel?: string
  actionLoader?: boolean
  title?: any
  type?: string
  subTitle?: any
  body?: React.ReactElement
  secondaryAction?: () => void
  secondaryActionLabel?: string
  small?: boolean
  backdropCancel?: boolean
  scrollDisable?: boolean
  fromModal?: boolean
}

export interface DialogModalProps {
  isOpen: boolean
  modalId?: string | undefined
  isCloseIcon?: boolean
  disabled?: boolean
  onClose?: (type?: string, key?: string | undefined) => void
  onSubmit?: () => void
  actionLabel?: string
  actionLoader?: boolean
  title?: any
  subTitle?: any
  type?: string
  body?: React.ReactElement
  actionBody?: React.ReactElement
  secondaryAction?: () => void
  secondaryActionLabel?: string
  small?: boolean
  backdropCancel?: boolean
  scrollDisable?: boolean
  fromModal?: boolean
  className?: string
  stylelabel?: string
  headborder?: boolean
  tall?: boolean
}
export interface TabItemProps {
  label: string
  id: string | number
  disabled?: boolean
  hide?: boolean
}
export interface TabProps {
  data: TabItemProps[]
  activeTab: string | number
  onClick: (item: TabItemProps) => void

  children: React.ReactNode
}
export interface BreadcrumbItemProps {
  label: string
  link?: string
  icon?: string
}
export interface BreadcrumbProps {
  items: BreadcrumbItemProps[]
}

export interface SearchProps {
  placeholder: string
  handleChange: (value: string) => void
  searchValue: string | undefined
  handleSearch: (value?: string) => void
}

export type Nodes = {
  id: string
  name: string
}

export type PrimaryFilter = {
  desc: string
  type: string
  descId?: string
  async?: boolean
  hidden?: boolean
  paginationEnabled?: boolean
  nextBlock?: number | undefined
  getData?: (value?: string, nextBlock?: number) => any
  name: string
  objectId?: string
  data?: any[]
  isPrimary?: boolean
  initialLoad?: boolean
  slug?: string
  selectedItems?: any
  selectRange?: boolean
  descSecondary?: string
}
export type FilterProps = {
  [key: string]: string | any
}

export type FilterParams = {
  title: string
  isChecked: boolean
  slug: string
}
export type AdvanceFilter = {
  filterParams: FilterParams[]
  isDetailed: boolean
}
export interface StoreFilterParams {
  page: number
  page_size?: number | string
  per_page?: number | string
  search: string
  ordering?: string
  filters: Record<string, unknown>
  filterProps: FilterProps
  status__code?: string
  type?: string
  status_code?: string
  sortColumn?: string
  sortType: 'asc' | 'desc' | undefined
  lead_status_group?: string
}
export interface FormBuilderProps {
  wordCount: any
  maxLength: number | undefined
  setAttachmentName?: (value: any) => void
  needConfirmation?: boolean | undefined
  fileDeleteFlag?: boolean | undefined
  value: any[] | undefined
  name: string
  desc?: string
  descId?: string
  label?: string
  type: string
  inputType?: string
  allowPositiveOnly?: boolean
  digitsOnly?: boolean
  initialLoad?: boolean
  id: string
  uppercase?: boolean
  notDataMessage?: string
  data?: any[]
  required?: boolean
  hideRequired?: boolean
  placeholder?: string
  getData?: (value?: string, page?: number) => any[]
  disabled?: boolean
  async?: boolean
  paginationEnabled?: boolean
  nextBlock?: number
  maxDate?: Date
  minDate?: Date
  isDuplicateCheck?: boolean
  handleAction?: () => void
  actionLabel?: string
  isMultiple?: boolean
  className?: string
  selectedItems: any[] | undefined
  spacing?: number
  formSpacing?: number
  acceptedFiles?: string
  fileUploadLabel?: string
  supportedExtensions?: string[]
  fileSize?: number
  handleCallBack?: (data?: any) => void
  selectedFiles?: any
  hidden?: boolean
  handleDeleteFile?: (data?: any) => void
  setDeleteModal?: (flag?: boolean) => void
  toCapitalize?: boolean
  group_data?: any
  accept?: string
  startPlaceholder?: string
  endPlaceholder?: string
  subName?: string
  subId?: string
  subData?: any[]
  toLowercase?: boolean
}
interface Content {
  cell: ReactNode | string
  toolTip?: string
}
export type TableColumns = {
  title: string
  field: string
  sortable?: boolean
  resizable?: boolean
  fixed?: boolean
  align?: 'left' | 'right' | 'center'
  colWidth?: number
  renderCell?: (rowData: any) => Content
  customCell?: boolean
  isVisible?: boolean
  link?: boolean
  rowClick?: (rowData: any) => void
  sortKey?: string
}

export type AssessorDataType = {
  user: any
  password: string
  phone: string
  organisation: string
  job_role: string
  join_date: string
  assessor_type: string
  description: string
  status: string
  profile_image: any
  datetime_created: any
  datetime_updated: any
  profile_image_name: string
}

export type OrganisationDataType = {
  id: any
  name: string
  size: string
  sector: string
  overview: string
  join_date: string
  email: string
  contact_number: string
  country?: string
}
export type Group = {
  name: string
}

export type User = {
  first_name: string
  last_name: string
  status: string
  username: string
  id: string
  job_title: string
  last_login: string | null
  datetime_created: string
  datetime_updated: string
  group: Group
}

export type AdminListResponse = {
  employee_type: string
  user: User
}

export type AccreditationDataType = {
  accreditation: string
  org_name: string
}
