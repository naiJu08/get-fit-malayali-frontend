export type InputData = {
  title: string
  id: string
  grouped: boolean
  editable?: boolean
  children: Child[]
}

interface Child {
  rowTitle: string
  columns: Column[]
}

interface Column {
  data: DataEntry[]
  name?: string
}

export interface DataEntry {
  value: string
  name: string
  editable?: boolean
  label?: string
}

// Define the types for the output tabularColumns
export type TabularColumn = {
  title: string
  id: string
  type?: string
  editable?: boolean
  children: TabularChild[]
}

interface TabularChild {
  title: string
  id: number
  editable?: boolean
}
export interface SubmissionEntry {
  employee_role: string
  engagement?: string
  age?: string
  [key: string]: number | string | undefined
}

export interface SubmissionFormat {
  entries: SubmissionEntry[]
}
