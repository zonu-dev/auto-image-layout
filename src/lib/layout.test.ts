import { describe, expect, it } from 'vitest'
import { buildRenderPlan, describeCanvasLimit } from './layout'

describe('buildRenderPlan', () => {
  it('normalizes image heights for horizontal layouts', () => {
    const plan = buildRenderPlan(
      [
        { id: 'a', width: 1200, height: 600 },
        { id: 'b', width: 300, height: 300 },
      ],
      {
        direction: 'horizontal',
        gap: 24,
        normalizeCrossAxis: true,
      },
    )

    expect(plan.referenceSize).toBe(450)
    expect(plan.height).toBe(450)
    expect(plan.width).toBe(1374)
    expect(plan.items.map((item) => [Math.round(item.width), Math.round(item.height)])).toEqual([
      [900, 450],
      [450, 450],
    ])
    expect(plan.items.map((item) => Math.round(item.x))).toEqual([0, 924])
  })

  it('centers mixed widths in a vertical layout when normalization is off', () => {
    const plan = buildRenderPlan(
      [
        { id: 'a', width: 900, height: 600 },
        { id: 'b', width: 400, height: 1200 },
      ],
      {
        direction: 'vertical',
        gap: 20,
        normalizeCrossAxis: false,
      },
    )

    expect(plan.referenceSize).toBeNull()
    expect(plan.width).toBe(900)
    expect(plan.height).toBe(1820)
    expect(plan.items.map((item) => Math.round(item.x))).toEqual([0, 250])
    expect(plan.items.map((item) => Math.round(item.y))).toEqual([0, 620])
  })
})

describe('describeCanvasLimit', () => {
  it('rejects oversize edge lengths', () => {
    const message = describeCanvasLimit({
      width: 20000,
      height: 1200,
      referenceSize: null,
      items: [],
    })

    expect(message).toContain('16384px')
  })

  it('rejects oversized total pixels', () => {
    const message = describeCanvasLimit({
      width: 12000,
      height: 12000,
      referenceSize: null,
      items: [],
    })

    expect(message).toContain('出力ピクセル数')
  })
})
