export type Direction = 'horizontal' | 'vertical'
export type ExportFormat = 'image/png' | 'image/jpeg' | 'image/webp'

export type LayoutImage = {
  height: number
  id: string
  width: number
}

export type LayoutOptions = {
  direction: Direction
  gap: number
  normalizeCrossAxis: boolean
}

export type PositionedImage = {
  height: number
  id: string
  width: number
  x: number
  y: number
}

export type RenderPlan = {
  height: number
  items: PositionedImage[]
  referenceSize: number | null
  width: number
}

const MAX_CANVAS_EDGE = 16384
const MAX_CANVAS_AREA = 134_217_728

export function buildRenderPlan(images: LayoutImage[], options: LayoutOptions): RenderPlan {
  if (images.length === 0) {
    return {
      width: 1,
      height: 1,
      items: [],
      referenceSize: null,
    }
  }

  const gap = Number.isFinite(options.gap) ? Math.max(0, options.gap) : 0
  const referenceSize = options.normalizeCrossAxis
    ? getMedian(
        images.map((image) =>
          options.direction === 'horizontal' ? image.height : image.width,
        ),
      )
    : null

  const sizedImages = images.map((image) => {
    if (options.direction === 'horizontal') {
      const height = referenceSize ?? image.height
      const width = referenceSize ? image.width * (height / image.height) : image.width
      return { id: image.id, width, height }
    }

    const width = referenceSize ?? image.width
    const height = referenceSize ? image.height * (width / image.width) : image.height
    return { id: image.id, width, height }
  })

  if (options.direction === 'horizontal') {
    const width =
      sizedImages.reduce((sum, image) => sum + image.width, 0) + gap * (sizedImages.length - 1)
    const height = Math.max(...sizedImages.map((image) => image.height))
    let cursor = 0

    return {
      width: Math.max(1, Math.ceil(width)),
      height: Math.max(1, Math.ceil(height)),
      referenceSize,
      items: sizedImages.map((image) => {
        const positioned = {
          ...image,
          x: cursor,
          y: (height - image.height) / 2,
        }
        cursor += image.width + gap
        return positioned
      }),
    }
  }

  const width = Math.max(...sizedImages.map((image) => image.width))
  const height =
    sizedImages.reduce((sum, image) => sum + image.height, 0) + gap * (sizedImages.length - 1)
  let cursor = 0

  return {
    width: Math.max(1, Math.ceil(width)),
    height: Math.max(1, Math.ceil(height)),
    referenceSize,
    items: sizedImages.map((image) => {
      const positioned = {
        ...image,
        x: (width - image.width) / 2,
        y: cursor,
      }
      cursor += image.height + gap
      return positioned
    }),
  }
}

export function describeCanvasLimit(plan: RenderPlan) {
  if (plan.width > MAX_CANVAS_EDGE || plan.height > MAX_CANVAS_EDGE) {
    return `出力サイズが大きすぎます。最大辺は ${MAX_CANVAS_EDGE}px までにしてください。`
  }

  if (plan.width * plan.height > MAX_CANVAS_AREA) {
    return '出力ピクセル数が大きすぎるため、ブラウザで安全にレンダリングできません。'
  }

  return null
}

function getMedian(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  }

  return sorted[middle]
}
