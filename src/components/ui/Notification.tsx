import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

interface NotificationConfig {
  message: ReactNode
  description?: ReactNode
  duration?: number
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'
  icon?: ReactNode
  style?: React.CSSProperties
  className?: string
  key?: string
  onClick?: () => void
  onClose?: () => void
}

interface NotificationItem extends NotificationConfig {
  id: string
  type: 'success' | 'error' | 'info' | 'warning' | 'open'
}

interface NotificationContextType {
  success: (config: NotificationConfig) => void
  error: (config: NotificationConfig) => void
  info: (config: NotificationConfig) => void
  warning: (config: NotificationConfig) => void
  open: (config: NotificationConfig) => void
  destroy: (key?: string) => void
}

const NotificationContext = createContext<NotificationContextType | null>(null)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

const NotificationItem: React.FC<{
  notification: NotificationItem
  onClose: () => void
}> = ({ notification, onClose }) => {
  const defaultIcons = {
    success: (
      <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
    ),
    error: (
      <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
    ),
    info: (
      <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
        <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
    open: null,
  }

  return (
    <div
      className={clsx(
        'w-[384px] max-w-[calc(100vw-32px)] p-4 rounded-2xl shadow-xl',
        'bg-white dark:bg-[#2f2f2f]',
        'border border-gray-200 dark:border-gray-700',
        'animate-slide-up cursor-pointer',
        notification.className
      )}
      style={notification.style}
      onClick={() => {
        notification.onClick?.()
        onClose()
      }}
    >
      <div className="flex gap-3">
        {(notification.icon || defaultIcons[notification.type]) && (
          <div className="flex-shrink-0">
            {notification.icon || defaultIcons[notification.type]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 dark:text-white text-sm">
            {notification.message}
          </div>
          {notification.description && (
            <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {notification.description}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-lg"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const addNotification = useCallback((
    type: NotificationItem['type'],
    config: NotificationConfig
  ) => {
    const id = config.key || `notification-${Date.now()}-${Math.random()}`

    // Remove existing notification with same key
    if (config.key) {
      setNotifications(prev => prev.filter(n => n.id !== config.key))
    }

    const newNotification: NotificationItem = {
      ...config,
      id,
      type,
      duration: config.duration ?? 4500,
    }

    setNotifications(prev => [...prev, newNotification])

    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
        config.onClose?.()
      }, newNotification.duration)
    }

    return id
  }, [removeNotification])

  const contextValue: NotificationContextType = {
    success: useCallback((config) => addNotification('success', config), [addNotification]),
    error: useCallback((config) => addNotification('error', config), [addNotification]),
    info: useCallback((config) => addNotification('info', config), [addNotification]),
    warning: useCallback((config) => addNotification('warning', config), [addNotification]),
    open: useCallback((config) => addNotification('open', config), [addNotification]),
    destroy: useCallback((key?: string) => {
      if (key) {
        setNotifications(prev => prev.filter(n => n.id !== key))
      } else {
        setNotifications([])
      }
    }, []),
  }

  // Group notifications by placement
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const placement = notification.placement || 'topRight'
    if (!acc[placement]) {
      acc[placement] = []
    }
    acc[placement].push(notification)
    return acc
  }, {} as Record<string, NotificationItem[]>)

  const placementStyles = {
    topLeft: 'top-4 left-4',
    topRight: 'top-4 right-4',
    bottomLeft: 'bottom-4 left-4',
    bottomRight: 'bottom-4 right-4',
  }

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' && createPortal(
        <>
          {Object.entries(groupedNotifications).map(([placement, items]) => (
            <div
              key={placement}
              className={clsx(
                'fixed z-[9999] flex flex-col gap-3',
                placementStyles[placement as keyof typeof placementStyles]
              )}
            >
              {items.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onClose={() => {
                    removeNotification(notification.id)
                    notification.onClose?.()
                  }}
                />
              ))}
            </div>
          ))}
        </>,
        document.body
      )}
    </NotificationContext.Provider>
  )
}

// Standalone notification API for compatibility with antd notification
let globalNotificationFn: NotificationContextType | null = null

export const setGlobalNotification = (notificationFn: NotificationContextType) => {
  globalNotificationFn = notificationFn
}

export const notification = {
  success: (config: NotificationConfig) => globalNotificationFn?.success(config),
  error: (config: NotificationConfig) => globalNotificationFn?.error(config),
  info: (config: NotificationConfig) => globalNotificationFn?.info(config),
  warning: (config: NotificationConfig) => globalNotificationFn?.warning(config),
  open: (config: NotificationConfig) => globalNotificationFn?.open(config),
  destroy: (key?: string) => globalNotificationFn?.destroy(key),
}

export default NotificationProvider
