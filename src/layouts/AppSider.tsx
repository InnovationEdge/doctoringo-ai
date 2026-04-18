import { Dispatch, SetStateAction, useCallback, useEffect, useRef } from 'react'
import useIsMobile from 'src/hooks/useMobile'
import SiderContent from 'core/components/SiderContent'
import { Drawer } from 'src/components/ui'

interface AppSiderProps {
    sidebarVisible: boolean
    setSidebarVisible: Dispatch<SetStateAction<boolean>>
}

const AppSider = ({
  setSidebarVisible,
  sidebarVisible
}: AppSiderProps) => {
  const isMobile = useIsMobile(1251)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Claude-style sidebar colors - always dark
  const backgroundColor = '#1a1a1a'
  const borderColor = '#2a2a2a'

  // Handle swipe gestures for mobile - swipe left to close, swipe right from edge to open
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0]
    if (touch) {
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const touch = e.changedTouches[0]
    if (!touch) return

    const touchEndX = touch.clientX
    const touchEndY = touch.clientY
    const deltaX = touchEndX - touchStartX.current
    const deltaY = Math.abs(touchEndY - touchStartY.current)

    // Only trigger if horizontal swipe is dominant (not scrolling)
    if (deltaY < 50) {
      // Swipe right from left edge to open (start position < 30px)
      if (deltaX > 80 && touchStartX.current < 30 && !sidebarVisible) {
        setSidebarVisible(true)
      }
      // Swipe left to close (when sidebar is open)
      if (deltaX < -80 && sidebarVisible) {
        setSidebarVisible(false)
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }, [sidebarVisible, setSidebarVisible])

  // Add touch listeners for swipe gestures on mobile
  useEffect(() => {
    if (!isMobile) return

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isMobile, handleTouchStart, handleTouchEnd])

  // Close drawer when clicking outside on mobile
  const handleDrawerClose = useCallback(() => {
    setSidebarVisible(false)
  }, [setSidebarVisible])

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000,
            height: '100vh',
            overflow: 'hidden',
            transition: 'width 0.2s ease-out',
            backgroundColor,
            borderRight: `1px solid ${borderColor}`,
            width: sidebarVisible ? 280 : 60,
          }}
        >
          <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <SiderContent
              collapsed={!sidebarVisible}
              onToggleCollapse={() => setSidebarVisible(prev => !prev)}
            />
          </div>
        </aside>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={handleDrawerClose}
          open={sidebarVisible}
          width="85vw"
          closable={false}
          styles={{
            body: {
              padding: 0,
              backgroundColor: '#1a1a1a',
              height: '100%',
              overflow: 'hidden'
            },
            header: {
              display: 'none'
            },
            wrapper: {
              boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)'
            },
            mask: {
              backgroundColor: 'rgba(0, 0, 0, 0.45)'
            }
          }}
        >
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            <SiderContent collapsed={false} />
          </div>
        </Drawer>
      )}
    </>
  )
}

export default AppSider
