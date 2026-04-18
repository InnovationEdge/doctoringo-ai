/**
 * Advanced debugging and performance monitoring tools
 * Only active in development mode
 */

export const isDevelopment = process.env.NODE_ENV === 'development'

// Performance monitoring
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map()
  private enabled: boolean = isDevelopment

  start(label: string): () => void {
    if (!this.enabled) return () => {}

    const startTime = performance.now()

    return () => {
      const duration = performance.now() - startTime
      this.recordMetric(label, duration)

      if (duration > 100) {
        console.warn(`⚠️ Slow operation: ${label} took ${duration.toFixed(2)}ms`)
      } else {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`)
      }
    }
  }

  private recordMetric(label: string, duration: number) {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, [])
    }
    this.metrics.get(label)!.push(duration)
  }

  getMetrics(label: string): { min: number; max: number; avg: number; count: number } | null {
    const values = this.metrics.get(label)
    if (!values || values.length === 0) return null

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      count: values.length
    }
  }

  getAllMetrics() {
    const result: Record<string, ReturnType<typeof this.getMetrics>> = {}
    this.metrics.forEach((_, label) => {
      result[label] = this.getMetrics(label)
    })
    return result
  }

  clear() {
    this.metrics.clear()
  }
}

export const perfMonitor = new PerformanceMonitor()

// Render tracking for debugging unnecessary re-renders
export function useWhyDidYouUpdate(name: string, props: any) {
  if (!isDevelopment) return

  const previousProps = React.useRef<any>(undefined)

  React.useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props })
      const changedProps: any = {}

      allKeys.forEach(key => {
        if (previousProps.current[key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current[key],
            to: props[key]
          }
        }
      })

      if (Object.keys(changedProps).length > 0) {
        console.log(`[${name}] Re-render caused by:`, changedProps)
      }
    }

    previousProps.current = props
  })
}

// Bundle size analysis
export function logBundleInfo() {
  if (!isDevelopment) return

  // @ts-ignore
  if (window.performance && window.performance.getEntriesByType) {
    // @ts-ignore
    const resources = window.performance.getEntriesByType('resource')
    let totalSize = 0
    const resourcesByType: Record<string, { count: number; size: number }> = {}

    resources.forEach((resource: any) => {
      const type = resource.initiatorType || 'other'
      const size = resource.transferSize || 0

      if (!resourcesByType[type]) {
        resourcesByType[type] = { count: 0, size: 0 }
      }

      resourcesByType[type].count++
      resourcesByType[type].size += size
      totalSize += size
    })

    console.table(resourcesByType)
    console.log(`📦 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
  }
}

// Memory monitoring
export function logMemoryUsage() {
  if (!isDevelopment) return

  // @ts-ignore
  if (window.performance && window.performance.memory) {
    // @ts-ignore
    const memory = window.performance.memory
    console.log('💾 Memory Usage:', {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`
    })
  }
}

// API call monitoring
class APIMonitor {
  private calls: Map<string, { count: number; totalTime: number; errors: number }> = new Map()
  private enabled: boolean = isDevelopment

  track(endpoint: string, duration: number, isError: boolean = false) {
    if (!this.enabled) return

    if (!this.calls.has(endpoint)) {
      this.calls.set(endpoint, { count: 0, totalTime: 0, errors: 0 })
    }

    const stats = this.calls.get(endpoint)!
    stats.count++
    stats.totalTime += duration
    if (isError) stats.errors++
  }

  getStats() {
    const result: Record<string, any> = {}
    this.calls.forEach((stats, endpoint) => {
      result[endpoint] = {
        ...stats,
        avgTime: stats.count > 0 ? (stats.totalTime / stats.count).toFixed(2) + 'ms' : '0ms',
        errorRate: stats.count > 0 ? ((stats.errors / stats.count) * 100).toFixed(2) + '%' : '0%'
      }
    })
    return result
  }

  logStats() {
    if (!this.enabled) return
    console.table(this.getStats())
  }

  clear() {
    this.calls.clear()
  }
}

export const apiMonitor = new APIMonitor()

// Component render counter
const renderCounts = new Map<string, number>()

export function trackRender(componentName: string) {
  if (!isDevelopment) return

  const count = (renderCounts.get(componentName) || 0) + 1
  renderCounts.set(componentName, count)

  if (count > 10 && count % 10 === 0) {
    console.warn(`🔄 ${componentName} has rendered ${count} times`)
  }
}

export function getRenderCounts() {
  if (!isDevelopment) return {}
  return Object.fromEntries(renderCounts)
}

export function clearRenderCounts() {
  renderCounts.clear()
}

// Global debug utilities
if (isDevelopment) {
  // @ts-ignore
  window.__DEBUG__ = {
    perfMonitor,
    apiMonitor,
    logBundleInfo,
    logMemoryUsage,
    getRenderCounts,
    clearRenderCounts
  }

  console.log(`
🔧 Debug tools available:
  window.__DEBUG__.perfMonitor.getAllMetrics() - View performance metrics
  window.__DEBUG__.apiMonitor.logStats() - View API call statistics
  window.__DEBUG__.logBundleInfo() - View bundle size breakdown
  window.__DEBUG__.logMemoryUsage() - View memory usage
  window.__DEBUG__.getRenderCounts() - View component render counts
  `)
}

// React import for hooks
import React from 'react'
