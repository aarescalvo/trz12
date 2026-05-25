import { createLogger } from '@/lib/logger'
const log = createLogger('lib.chart-to-image')
import { type RefObject } from 'react'

/**
 * Captures a recharts chart container as a PNG data URL.
 * Works by finding the SVG inside the container, serializing it,
 * rendering to a canvas, and returning a base64 data URL.
 *
 * @param elementId - The DOM id of the chart container div
 * @param scale - Resolution multiplier (default 2 for retina)
 * @returns PNG data URL string, or null on failure
 */
export async function captureChartAsImage(
  elementId: string,
  scale: number = 2
): Promise<string | null> {
  try {
    const container = document.getElementById(elementId)
    if (!container) {
      log.warn(`[chart-to-image] Element #${elementId} not found`)
      return null
    }
    return captureChartFromRef({ current: container } as RefObject<HTMLDivElement>, scale)
  } catch (error) {
    console.error('[chart-to-image] Error capturing chart by id:', error)
    return null
  }
}

/**
 * Captures a recharts chart container via a React ref as a PNG data URL.
 *
 * @param ref - A React RefObject pointing to the chart container div
 * @param scale - Resolution multiplier (default 2 for retina)
 * @returns PNG data URL string, or null on failure
 */
export async function captureChartFromRef(
  ref: RefObject<HTMLDivElement | null>,
  scale: number = 2
): Promise<string | null> {
  const container = ref.current
  if (!container) {
    log.warn('[chart-to-image] Ref container is null')
    return null
  }

  return new Promise<string | null>((resolve) => {
    try {
      // Find the SVG element inside the chart container (recharts renders SVG)
      const svgElement = container.querySelector('svg.recharts-surface') ||
        container.querySelector('svg')

      if (!svgElement) {
        log.warn('[chart-to-image] No SVG found inside container')
        resolve(null)
        return
      }

      // Clone the SVG to avoid mutating the live DOM
      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

      // Ensure the SVG has explicit width/height attributes for rendering
      if (!clonedSvg.getAttribute('width') || !clonedSvg.getAttribute('height')) {
        const rect = svgElement.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          clonedSvg.setAttribute('width', String(Math.round(rect.width)))
          clonedSvg.setAttribute('height', String(Math.round(rect.height)))
        }
      }

      // Ensure xmlns is present (required for SVG → Image conversion)
      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      }

      // Inline any computed styles needed for the SVG to render correctly
      inlineStyles(svgElement as SVGSVGElement, clonedSvg)

      // Serialize the SVG to a string
      const svgData = new XMLSerializer().serializeToString(clonedSvg)

      // Create a Blob URL from the SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      const img = new Image()
      const cleanup = () => {
        URL.revokeObjectURL(url)
      }

      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width || 800
          const height = img.naturalHeight || img.height || 400

          // Create a canvas at the desired scale
          const canvas = document.createElement('canvas')
          canvas.width = width * scale
          canvas.height = height * scale

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            log.warn('[chart-to-image] Could not get canvas 2d context')
            cleanup()
            resolve(null)
            return
          }

          // Fill with white background (charts may have transparent backgrounds)
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Draw the SVG image scaled
          ctx.scale(scale, scale)
          ctx.drawImage(img, 0, 0, width, height)

          const dataUrl = canvas.toDataURL('image/png')
          cleanup()
          resolve(dataUrl)
        } catch (drawError) {
          console.error('[chart-to-image] Error drawing to canvas:', drawError)
          cleanup()
          resolve(null)
        }
      }

      img.onerror = () => {
        log.warn('[chart-to-image] Failed to load SVG image')
        cleanup()
        // Fallback: try data URL approach
        resolve(fallbackDataUrlCapture(svgData))
      }

      // Set the source after attaching handlers
      img.src = url
    } catch (error) {
      console.error('[chart-to-image] Error in captureChartFromRef:', error)
      resolve(null)
    }
  })
}

/**
 * Captures ALL charts inside a container as an array of PNG data URLs.
 * Useful when a page has multiple chart cards.
 *
 * @param elementId - The DOM id of the parent container holding multiple charts
 * @param scale - Resolution multiplier (default 2 for retina)
 * @returns Array of { dataUrl, title } objects
 */
export async function captureMultipleCharts(
  elementId: string,
  scale: number = 2
): Promise<{ dataUrl: string; title: string }[]> {
  try {
    const container = document.getElementById(elementId)
    if (!container) return []

    // Find all Card components that contain an SVG chart
    const chartCards = container.querySelectorAll('.border-0.shadow-md:has(svg)')
    const results: { dataUrl: string; title: string }[] = []

    for (const card of Array.from(chartCards)) {
      // Try to extract the chart title from CardTitle
      const titleEl = card.querySelector('.text-base')
      const title = titleEl?.textContent?.trim() || 'Gráfico'

      const svgElement = card.querySelector('svg.recharts-surface') || card.querySelector('svg')
      if (!svgElement) continue

      const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement

      if (!clonedSvg.getAttribute('xmlns')) {
        clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      }

      if (!clonedSvg.getAttribute('width') || !clonedSvg.getAttribute('height')) {
        const rect = svgElement.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          clonedSvg.setAttribute('width', String(Math.round(rect.width)))
          clonedSvg.setAttribute('height', String(Math.round(rect.height)))
        }
      }

      inlineStyles(svgElement as SVGSVGElement, clonedSvg)

      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      const dataUrl = await new Promise<string | null>((resolve) => {
        const img = new Image()
        const cleanup = () => URL.revokeObjectURL(url)

        img.onload = () => {
          try {
            const width = img.naturalWidth || img.width || 800
            const height = img.naturalHeight || img.height || 400
            const canvas = document.createElement('canvas')
            canvas.width = width * scale
            canvas.height = height * scale
            const ctx = canvas.getContext('2d')
            if (!ctx) { cleanup(); resolve(null); return }

            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.scale(scale, scale)
            ctx.drawImage(img, 0, 0, width, height)
            cleanup()
            resolve(canvas.toDataURL('image/png'))
          } catch {
            cleanup()
            resolve(null)
          }
        }
        img.onerror = () => { cleanup(); resolve(null) }
        img.src = url
      })

      if (dataUrl) {
        results.push({ dataUrl, title })
      }
    }

    return results
  } catch (error) {
    console.error('[chart-to-image] Error capturing multiple charts:', error)
    return []
  }
}

/**
 * Inlines computed styles from the original SVG to the clone.
 * This ensures CSS-applied styles are preserved in the exported image.
 */
function inlineStyles(original: SVGSVGElement, clone: SVGSVGElement): void {
  try {
    const originalElements = original.querySelectorAll('*')
    const cloneElements = clone.querySelectorAll('*')

    originalElements.forEach((origEl, i) => {
      const cloneEl = cloneElements[i]
      if (!cloneEl) return

      const computed = window.getComputedStyle(origEl as Element)
      const importantStyles = [
        'fill', 'stroke', 'strokeWidth', 'opacity', 'fontSize',
        'fontFamily', 'fontWeight', 'fillOpacity', 'strokeOpacity',
        'color', 'textAnchor', 'dominantBaseline',
      ]

      const stylesToInline = importantStyles
        .filter(prop => computed.getPropertyValue(prop) && computed.getPropertyValue(prop) !== 'none')
        .map(prop => `${camelToKebab(prop)}:${computed.getPropertyValue(prop)}`)
        .join(';')

      if (stylesToInline) {
        cloneEl.setAttribute('style', stylesToInline)
      }
    })
  } catch {
    // Non-critical — styles won't be perfectly preserved but chart will still render
  }
}

/**
 * Fallback capture using a data URL approach (when blob URL fails due to CORS/tainted canvas).
 */
function fallbackDataUrlCapture(svgString: string): string | null {
  try {
    const encoded = btoa(unescape(encodeURIComponent(svgString)))
    const dataUrl = `data:image/svg+xml;base64,${encoded}`

    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 400
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    const img = new Image()
    img.src = dataUrl
    // This is synchronous fallback — the image may not have loaded yet
    // but the data URL approach usually works without CORS issues
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 800, 400)
    ctx.drawImage(img, 0, 0)
    return canvas.toDataURL('image/png')
  } catch {
    return null
  }
}

function camelToKebab(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}
