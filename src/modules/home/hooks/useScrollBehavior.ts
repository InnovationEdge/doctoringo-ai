/**
 * Custom hook for managing scroll behavior in chat
 * Handles auto-scroll, scroll button visibility, and user scroll detection
 */
import { useState, useCallback, useEffect, RefObject } from 'react'

interface UseScrollBehaviorOptions {
  containerRef: RefObject<HTMLDivElement>
  endRef: RefObject<HTMLDivElement>
  threshold?: number
}

export function useScrollBehavior({
  containerRef,
  endRef,
  threshold = 100
}: UseScrollBehaviorOptions) {
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [userHasScrolled, setUserHasScrolled] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(false)

  // Handle scroll events to detect user scrolling
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold

      setShowScrollButton(!isNearBottom)

      // If user scrolls up, mark as user-scrolled
      if (!isNearBottom) {
        setUserHasScrolled(true)
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef, threshold])

  // Auto-scroll to bottom
  const scrollToBottom = useCallback((smooth = true) => {
    if (endRef.current) {
      endRef.current.scrollIntoView({
        behavior: smooth ? 'smooth' : 'auto',
        block: 'end'
      })
    }
  }, [endRef])

  // Reset scroll state (e.g., when starting new message)
  const resetScrollState = useCallback(() => {
    setUserHasScrolled(false)
    setShouldAutoScroll(true)
  }, [])

  // Auto-scroll effect
  useEffect(() => {
    if (shouldAutoScroll && !userHasScrolled) {
      scrollToBottom(false)
    }
  }, [shouldAutoScroll, userHasScrolled, scrollToBottom])

  return {
    showScrollButton,
    userHasScrolled,
    shouldAutoScroll,
    setShouldAutoScroll,
    setUserHasScrolled,
    scrollToBottom,
    resetScrollState
  }
}
