import { useState } from 'react'

const useParsedValue = (val?: string) => {
  const [showMore, setShowMore] = useState(false)

  if (!val) {
    return { parsedValue: '--', showMore, setShowMore }
  }

  const lines = val.split('\n')
  const lineCount = lines.length

  if (lineCount > 3) {
    // const truncatedLines = lines.slice(0, 3).join('\n')
    // const remainingLines = lines.slice(3).join('\n')

    return {
      parsedValue: (
        <>
          {!showMore && (
            <>
              <p style={{ whiteSpace: 'pre-wrap' }} className="sentence-wrap">
                {val}
              </p>
              <button
                onClick={() => setShowMore(true)}
                className="text-link cursor-pointer text-primary"
              >
                View More
              </button>
            </>
          )}
          {showMore && (
            <>
              <p style={{ whiteSpace: 'pre-wrap' }}>{val}</p>
              <button
                onClick={() => setShowMore(false)}
                className="text-link cursor-pointer text-primary"
              >
                View Less
              </button>
            </>
          )}
        </>
      ),
      showMore,
      setShowMore,
    }
  } else {
    return {
      parsedValue: lines.map((line, index) => (
        <p key={index} style={{ whiteSpace: 'pre-wrap' }}>
          {line}
        </p>
      )),
      showMore,
      setShowMore,
    }
  }
}

export default useParsedValue

// const useParsedValue = (val?: string) => {
//   const [showMore, setShowMore] = useState(false)

//   if (!val) {
//     return { parsedValue: '--', showMore, setShowMore }
//   }

//   const words = val.split(/\s+/)
//   const wordCount = words.length

//   if (wordCount > 50) {
//     const truncatedText = words.slice(0, 50).join(' ')
//     const remainingText = val.substring(truncatedText.length).trimStart()

//     return {
//       parsedValue: (
//         <>
//           <p style={{ whiteSpace: 'pre-wrap' }}>{truncatedText}</p>
//           {!showMore && (
//             <button
//               onClick={() => setShowMore(true)}
//               className="text-link cursor-pointer text-primary"
//             >
//               View More
//             </button>
//           )}
//           {showMore && (
//             <>
//               <p style={{ whiteSpace: 'pre-wrap' }}>{remainingText}</p>
//               <button
//                 onClick={() => setShowMore(false)}
//                 className="text-link cursor-pointer text-primary"
//               >
//                 View Less
//               </button>
//             </>
//           )}
//         </>
//       ),
//       showMore,
//       setShowMore,
//     }
//   } else {
//     return {
//       parsedValue: val.split('\n').map((line, index) => (
//         <p key={index} style={{ whiteSpace: 'pre-wrap' }}>
//           {line}
//           <br />
//         </p>
//       )),
//       showMore,
//       setShowMore,
//     }
//   }
// }

// export default useParsedValue
