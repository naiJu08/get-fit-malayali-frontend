// // deepDebounce.ts
// export function deepDebounce<F extends (...args: any[]) => void>(
//   func: F,
//   wait: number,
//   immediate?: boolean // This makes the 'immediate' parameter optional with a default value of 'false'
// ): (...args: Parameters<F>) => void {
//   let timeout: ReturnType<typeof setTimeout> | null

//   return function (this: any, ...args: Parameters<F>) {
//     // If you're not using `this` context, you can remove `this: any`
//     const later = () => {
//       timeout = null
//       if (!immediate) func(...args)
//     }

//     const callNow = immediate && timeout === null

//     if (timeout !== null) {
//       clearTimeout(timeout)
//     }

//     timeout = setTimeout(later, wait)

//     if (callNow) {
//       func(...args)
//     }
//   }
// }

export function deepDebounce<F extends (...args: any[]) => Promise<any>>(
  func: F,
  wait: number,
  immediate = false
): (...args: Parameters<F>) => Promise<any> {
  let timeout: ReturnType<typeof setTimeout> | null

  return (...args: Parameters<F>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    return new Promise((resolve, reject) => {
      const later = () => {
        timeout = null
        if (!immediate) {
          const result = func(...args)
          if (result && typeof result.then === 'function') {
            result.then(resolve).catch(reject)
          } else {
            return result
          }
        }
      }

      const callNow = immediate && !timeout

      timeout = setTimeout(later, wait)

      if (callNow) {
        func(...args)
          .then(resolve)
          .catch(reject)
      }
    })
  }
}
