import * as PIXI from 'pixi.js'
import { K } from './constants'

// ─── Infrastructure drawing helpers ───────────────────────────────────────────
// Used by zone builders for fixed infrastructure that has no atlas sprite yet.
// All helpers write into the Graphics object passed in — caller adds to infra layer.

export function drawDirt(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.dirt)
  for (let i = 0; i < Math.floor(w / 28); i++) {
    const rx = x + ((((i * 1103515245 + 12345 + 13 * 214013) >>> 0) & 0x7fffffff) / 0x7fffffff) * w
    const ry = y + ((((i * 1103515245 + 12345 + 14 * 214013) >>> 0) & 0x7fffffff) / 0x7fffffff) * h
    const rw = 14 + ((((i * 1103515245 + 12345 + 15 * 214013) >>> 0) & 0x7fffffff) / 0x7fffffff) * 10
    const rh =  5 + ((((i * 1103515245 + 12345 + 16 * 214013) >>> 0) & 0x7fffffff) / 0x7fffffff) * 4
    g.ellipse(rx, ry, rw, rh).fill({ color: K.dirtL, alpha: 0.28 })
  }
}

export function drawWater(g: PIXI.Graphics, x: number, y: number, w: number, h: number) {
  g.rect(x, y, w, h).fill(K.wD)
  g.rect(x, y, w, h * 0.35).fill({ color: K.wM, alpha: 0.55 })
  for (let i = 0; i < 5; i++) {
    g.rect(x + w * 0.04, y + h * (0.12 + i * 0.17), w * 0.92, 3).fill({ color: K.wL, alpha: 0.28 })
  }
}

export function drawStoneWall(g: PIXI.Graphics, x: number, y: number, w: number, h = 42) {
  g.rect(x, y, w, h).fill(K.stoneD)
  const bw = 38, bh = 20
  for (let row = 0; row * bh < h; row++) {
    for (let col = 0; col * bw < w + bw; col++) {
      const ox = row % 2 === 0 ? 0 : bw / 2
      const bx = x + col * bw - ox, by = y + row * bh
      const l = Math.max(bx + 1, x), r = Math.min(bx + bw - 2, x + w)
      if (r > l) g.rect(l, by + 1, r - l, bh - 2).fill(K.stone)
    }
  }
}

export function drawFence(g: PIXI.Graphics, x: number, y: number, w: number) {
  g.rect(x, y - 12, w, 4).fill(K.woodD)
  g.rect(x, y - 24, w, 4).fill(K.woodD)
  for (let i = 0; i * 18 < w; i++) {
    g.rect(x + i * 18, y - 36, 10, 36).fill(K.wood)
    g.rect(x + i * 18, y - 38, 10,  5).fill({ color: 0x000000, alpha: 0.25 })
  }
}

export function drawBridge(g: PIXI.Graphics, x: number, y: number, w: number) {
  for (let i = 0; i < Math.floor(w / 12); i++) g.rect(x + i * 12, y - 12, 10, 14).fill(K.wood)
  g.rect(x, y - 12, w, 14).stroke({ color: K.woodD, width: 1 })
  g.rect(x, y - 28, w, 5).fill(K.woodD)
  g.rect(x, y + 2,  w, 5).fill(K.woodD)
  for (let i = 0; i * 22 < w; i++) g.rect(x + i * 22, y - 28, 4, 32).fill(K.woodL)
}

export function drawLantern(cont: PIXI.Container, x: number, y: number) {
  const g = new PIXI.Graphics()
  g.moveTo(x, y).lineTo(x, y + 9).stroke({ color: K.woodD, width: 2 })
  g.ellipse(x, y + 22, 18, 18).fill({ color: K.lanG, alpha: 0.1 })
  g.rect(x - 8, y + 9,  16, 26).fill(K.lanR)
  for (let i = 1; i < 4; i++) g.rect(x - 8 + 16 * i / 4 - 0.5, y + 11, 1, 22).fill({ color: 0x880000, alpha: 0.45 })
  g.rect(x - 10, y + 7,  20, 5).fill(K.gold)
  g.rect(x - 10, y + 32, 20, 5).fill(K.gold)
  g.rect(x - 7,  y + 11, 14, 22).fill({ color: K.lanG, alpha: 0.22 })
  for (let i = 0; i < 3; i++) g.moveTo(x - 5 + i * 5, y + 37).lineTo(x - 5 + i * 5, y + 46).stroke({ color: K.gold, width: 1 })
  cont.addChild(g)
}

// ─── Ysort-compatible prop factories ─────────────────────────────────────────
// Each returns a Container positioned at (0,0) = foot/base centre.
// Caller sets container.x / container.y to place in world space.

export function makeWell(): PIXI.Container {
  const c = new PIXI.Container()
  const g = new PIXI.Graphics()
  g.rect(-18, -8, 36, 8).fill(K.stone)
  g.ellipse(0, -8, 18, 6).fill(K.stoneL)
  g.ellipse(0, -8, 11, 4).fill(K.stoneD)
  g.rect(-14, -40, 4, 32).fill(K.wood)
  g.rect( 10, -40, 4, 32).fill(K.wood)
  g.rect(-16, -44, 32, 4).fill(K.woodD)
  g.moveTo(0, -40).lineTo(0, -16).stroke({ color: K.woodD, width: 1.5 })
  g.rect(-5, -26, 10, 8).fill(K.woodL)
  g.rect(-5, -26, 10, 2).fill(K.woodD)
  c.addChild(g)
  return c
}

export function makeDummy(variant = 0): PIXI.Container {
  const c = new PIXI.Container()
  const g = new PIXI.Graphics()
  g.rect(-10, -4, 20, 4).fill(K.woodD)
  g.rect( -4, -10,  8, 10).fill(K.woodD)
  g.rect( -3, -56,  6, 50).fill(K.wood)
  g.rect(-22, -44, 19, 5).fill(K.woodL)
  g.rect(  3, -44, 19, 5).fill(K.woodL)
  const armY = variant === 0 ? -30 : variant === 1 ? -32 : -28
  g.rect(-16, armY, 13, 4).fill(K.wood)
  g.rect(  3, armY, 13, 4).fill(K.wood)
  g.rect( -4, -60,  8, 4).fill(K.woodD)
  c.addChild(g)
  return c
}

export function makeStoneLantern(): PIXI.Container {
  const c = new PIXI.Container()
  const g = new PIXI.Graphics()
  g.rect(-14, -6,  28, 6).fill(K.stoneL)
  g.rect( -7, -18, 14, 12).fill(K.stone)
  g.rect(-11, -22, 22, 4).fill(K.stoneL)
  g.rect( -4, -32,  8, 10).fill(K.stone)
  g.rect( -9, -36, 18, 4).fill(K.stoneL)
  g.rect( -7, -52, 14, 16).fill(K.stoneD)
  g.rect( -5, -50, 10, 12).fill({ color: K.lanG, alpha: 0.40 })
  g.rect( -9, -56, 18, 4).fill(K.stone)
  g.ellipse(0, -60, 4, 5).fill(K.stoneL)
  c.addChild(g)
  return c
}

export function makeIncenseBurner(): PIXI.Container {
  const c = new PIXI.Container()
  const g = new PIXI.Graphics()
  g.moveTo(-10, 0).lineTo(-8, -14).stroke({ color: K.stoneD, width: 3 })
  g.moveTo( 10, 0).lineTo(  8, -14).stroke({ color: K.stoneD, width: 3 })
  g.moveTo(  0, 0).lineTo(  0, -14).stroke({ color: K.stoneD, width: 3 })
  g.rect(-14, -44, 28, 30).fill(K.stone)
  g.rect(-11, -46, 22, 4).fill(K.stoneL)
  g.rect(-12, -14, 24, 4).fill(K.stoneL)
  g.rect(-18, -38, 4, 10).fill(K.stoneD)
  g.rect( 14, -38, 4, 10).fill(K.stoneD)
  g.moveTo(-4, -44).lineTo(-6, -70).stroke({ color: K.woodD, width: 1.5 })
  g.moveTo( 0, -44).lineTo( 0, -72).stroke({ color: K.woodD, width: 1.5 })
  g.moveTo( 4, -44).lineTo( 4, -70).stroke({ color: K.woodD, width: 1.5 })
  g.ellipse(-6, -70, 3, 2).fill({ color: K.lanG, alpha: 0.60 })
  g.ellipse( 0, -72, 3, 2).fill({ color: K.lanG, alpha: 0.60 })
  g.ellipse( 4, -70, 3, 2).fill({ color: K.lanG, alpha: 0.60 })
  c.addChild(g)
  return c
}

export function drawSign(cont: PIXI.Container, x: number, y: number, text: string) {
  const g = new PIXI.Graphics()
  g.rect(x - 2,  y - 80, 4,  80).fill(K.woodD)
  g.rect(x - 28, y - 76, 56, 38).fill(K.wood)
  g.rect(x - 26, y - 74, 52, 34).fill(K.woodL)
  cont.addChild(g)
  const t = new PIXI.Text({ text, style: { fontSize: 11, fill: '#2A1008', fontFamily: '"Noto Serif SC",serif', fontWeight: '700' } })
  t.anchor.set(0.5, 0.5); t.x = x; t.y = y - 57
  cont.addChild(t)
}
