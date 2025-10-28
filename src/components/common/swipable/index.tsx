import _ from 'lodash'
import { useEffect, useRef } from 'react'
import Icons from '../icons'

function SwipableCard(props: any) {
  const listElementRef = useRef<any>()
  const wrapperRef = useRef<any>()
  const backgroundRef = useRef<any>()
  const buttonsRef = useRef<any>()
  const dragStartXRef = useRef(0)
  const leftRef = useRef(0)
  const draggedRef = useRef(false)

  useEffect(() => {
    window.addEventListener('mouseup', onDragEndMouse)
    window.addEventListener('touchend', onDragEndTouch)
    return () => {
      window.removeEventListener('mouseup', onDragEndMouse)
      window.removeEventListener('touchend', onDragEndTouch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onDragStartMouse(evt: any) {
    onDragStart(evt.clientX)
    window.addEventListener('mousemove', onMouseMove)
  }

  function onDragStartTouch(evt: any) {
    const touch = evt.targetTouches[0]
    onDragStart(touch.clientX)
    window.addEventListener('touchmove', onTouchMove)
  }

  function onDragStart(clientX: any) {
    draggedRef.current = true
    dragStartXRef.current = clientX

    listElementRef.current.className = 'ListItem'

    requestAnimationFrame(updatePosition)
  }

  function updatePosition() {
    if (listElementRef.current) {
      if (draggedRef.current) {
        requestAnimationFrame(updatePosition)
      }

      listElementRef.current.style.transform = `translateX(${leftRef.current}px)`

      // Fade the opacity
      const opacity = Number((Math.abs(leftRef.current) / 100).toFixed(2))
      if (
        opacity < 1 &&
        opacity?.toString() !== backgroundRef.current.style.opacity
      ) {
        // backgroundRef.current.style.opacity = opacity.toString();
      }
      if (opacity >= 1) {
        backgroundRef.current.style.opacity = '1'
      }
    }
  }

  function onMouseMove(evt: any) {
    const left = evt.clientX - dragStartXRef.current
    if (left < 0) {
      leftRef.current = left
    } else {
      leftRef.current = 0
    }
  }

  function onTouchMove(evt: any) {
    const touch = evt.targetTouches[0]
    const left = touch.clientX - dragStartXRef.current

    if (left < 0) {
      leftRef.current = left
    } else {
      if (leftRef.current < 0) {
        leftRef.current = leftRef.current + left
      } else {
        leftRef.current = 0
      }
    }
  }

  function onDragEndMouse() {
    window.removeEventListener('mousemove', onMouseMove)
    onDragEnd()
  }

  function onDragEndTouch() {
    window.removeEventListener('touchmove', onTouchMove)
    onDragEnd()
  }

  function onDragEnd() {
    if (draggedRef.current) {
      draggedRef.current = false
      const threshold = props.threshold || 0.3

      if (
        leftRef.current <
        listElementRef.current.offsetWidth * threshold * -1
      ) {
        leftRef.current = -buttonsRef.current.offsetWidth

        // wrapperRef.current.style.maxHeight = 0
        onSwiped()
      } else {
        leftRef.current = 0
      }

      listElementRef.current.className = 'BouncingListItem'
      listElementRef.current.style.transform = `translateX(${leftRef.current}px)`
    }
  }

  function onSwiped() {
    if (props.onSwipe) {
      props.onSwipe()
    }
  }

  return (
    <>
      <div className="swipe-Wrapper" ref={wrapperRef}>
        <div className="swipe-Background" ref={backgroundRef}>
          <div className="swipe-buttons" ref={buttonsRef}>
            {_.includes(props.actions, 'view') && !props.isCompany && (
              <button onClick={() => props.fireEvent('view')}>
                <Icons name="view" />
              </button>
            )}
            {_.includes(props.actions, 'edit') && (
              <button onClick={() => props.fireEvent('edit')}>
                <Icons name="edit" />
              </button>
            )}
            {_.includes(props.actions, 'delete') && (
              <button
                className="dButton"
                onClick={() => props.fireEvent('delete')}
              >
                <Icons name="delete" />
              </button>
            )}
          </div>
        </div>
        <div
          className="ListItem"
          ref={listElementRef}
          onMouseDown={onDragStartMouse}
          onTouchStart={onDragStartTouch}
        >
          <div
            className="w-full"
            onClick={() =>
              _.includes(props.actions, 'view') ? props.fireEvent('view') : null
            }
          >
            {props.children}
          </div>
        </div>
      </div>
    </>
  )
}

export default SwipableCard
