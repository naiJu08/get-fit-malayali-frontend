// import TextEditor from '../../components/common/TextEditer/index'
// import { useState } from 'react'

export default function Dashboard() {
  // const [content, setContent] = useState<string>('<p>Initial content</p>')

  // const handleEditorChange = (html: string) => {
  //   setContent(html)
  // }
  // console.log(content)
  return (
    <div className="minHeight-dashboard">
      <div className="flex flex-col gap-1">
        <div>
          {/* <TextEditor
            value={content}
            label={'Rich Text Editor'}
            onChange={handleEditorChange}
            placeholder="Enter text here..."
          /> */}
          {/* <h3>Output:</h3>
          <div
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
          /> */}
        </div>
        <div>
          <img
            className="max-w-[550px] w-auto mb-12"
            src="/images/dashboard.png"
            alt=""
          />
        </div>
        <p className="text-center text-4xl font-extrabold text-primaryText tracking-wide">
          Dashboard Coming Soon
        </p>
      </div>
    </div>
  )
}
