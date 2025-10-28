import { useState, FC } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface TextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
}

const TextEditor: FC<TextEditorProps> & { modules: any; formats: any } = ({
  value = '',
  onChange,
  placeholder,
  label,
}) => {
  const [editorValue, setEditorValue] = useState<string>(value)

  const handleChange = (content: string) => {
    setEditorValue(content)
    if (onChange) {
      onChange(content)
    }
  }

  return (
    <div>
      <label className=" py-1 text-common">{label}</label>
      <ReactQuill
        value={editorValue}
        onChange={handleChange}
        placeholder={placeholder || 'Start typing...'}
        modules={TextEditor.modules}
        formats={TextEditor.formats}
      />
    </div>
  )
}

// Define the Quill modules and formats you want to use
TextEditor.modules = {
  toolbar: [
    [{ header: '1' }, { header: '2' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['bold', 'italic', 'underline'],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
}

TextEditor.formats = [
  'header',
  'bold',
  'italic',
  'underline',
  'list',
  'bullet',
  'align',
  'link',
]

export default TextEditor
