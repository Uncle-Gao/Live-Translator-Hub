import { useEffect, useRef } from 'react'
import { useMotionValue } from 'framer-motion'

export default function useOverscrollBounce(containerRef) {
  const offsetY = useMotionValue(0)
  const overscrollRef = useRef(0)
  const velocityRef = useRef(0)
  const frameRef = useRef(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const springBack = () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)

      let lastTime = performance.now()

      const animate = (now) => {
        const dt = Math.min(now - lastTime, 32) / 16
        lastTime = now

        const stiffness = 0.08
        const damping = 0.78
        const force = -stiffness * overscrollRef.current
        velocityRef.current = (velocityRef.current + force) * damping
        overscrollRef.current += velocityRef.current * dt

        offsetY.set(overscrollRef.current)

        if (Math.abs(overscrollRef.current) > 0.05 || Math.abs(velocityRef.current) > 0.05) {
          frameRef.current = requestAnimationFrame(animate)
        } else {
          overscrollRef.current = 0
          velocityRef.current = 0
          offsetY.set(0)
        }
      }

      frameRef.current = requestAnimationFrame(animate)
    }

    const onWheel = (e) => {
      const { scrollTop, scrollHeight, clientHeight } = el
      const atTop = scrollTop <= 0
      const atBottom = scrollTop + clientHeight >= scrollHeight - 1

      if ((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0)) {
        e.preventDefault()
        const dampened = e.deltaY * 0.25
        overscrollRef.current -= dampened
        overscrollRef.current = Math.max(-160, Math.min(160, overscrollRef.current))
        velocityRef.current = -e.deltaY * 0.008
        offsetY.set(overscrollRef.current)
        springBack()
      }
    }

    el.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      el.removeEventListener('wheel', onWheel)
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
    // containerRef and offsetY are stable refs — intentionally omitted from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return offsetY
}
