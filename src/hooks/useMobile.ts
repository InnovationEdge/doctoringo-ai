import { useState, useEffect } from 'react'
import { debounce } from 'src/utils/performanceUtils'

const useIsMobile = (breakpoint = 768) => {
  // Initialize with current value to prevent layout shift
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < breakpoint
    }
    return false
  })

  useEffect(() => {
    // Debounce to 150ms - only update after user stops resizing
    // Prevents 10-60 state updates per second during resize
    const handleResize = debounce(() => {
      setIsMobile(window.innerWidth < breakpoint)
    }, 150)

    // Set initial value
    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [breakpoint])

  return isMobile
}

export default useIsMobile
