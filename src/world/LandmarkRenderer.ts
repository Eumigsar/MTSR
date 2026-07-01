import * as PIXI from 'pixi.js'
import { K, H } from './constants'

// World X center of the Temple zone (Zone 5: 2160–2700)
const TEMPLE_WORLD_X = 2430
// Horiz Y in viewport (buildMountains uses H*0.58 ≈ 325)
const HORIZ_Y = Math.round(H * 0.58)

// Draws a simplified temple silhouette visible from all zones.
// Lives inside the mountains container (parallax 0.06×) and adds
// a small extra per-frame x offset to reach total ~0.10× effective parallax.
//
// Visual behaviour as camX increases (player moves right):
//   Zone 1 (camX≈0)   → small, upper-right, heavy fog
//   Zone 3 (camX≈900) → medium, centre-right, moderate fog
//   Zone 5 (camX≈2250)→ large, clear, no fog
export class LandmarkRenderer {
  private readonly container: PIXI.Container
  private readonly fog: PIXI.Graphics
  private readonly haze: PIXI.Graphics

  constructor(mountains: PIXI.Container) {
    this.container = new PIXI.Container()
    // Y=285 places the landmark just above the mountain horizon
    this.container.y = HORIZ_Y - 50
    this.container.x = 680

    const silhouette = this._buildSilhouette()
    this.fog  = this._buildFog()
    this.haze = this._buildHaze()

    this.container.addChild(silhouette, this.haze, this.fog)
    mountains.addChild(this.container)
  }

  private _buildSilhouette(): PIXI.Graphics {
    const g = new PIXI.Graphics()

    // ── Background mountain ──────────────────────────────────────────
    // Large peak centred on the temple
    g.poly([-120, 8, -10, -230, 110, 8]).fill({ color: K.mtnF, alpha: 0.92 })
    g.poly([-60,  8,  40, -170, 115, 8]).fill({ color: K.mtnM, alpha: 0.80 })
    // Overlapping secondary peak (left)
    g.poly([-160, 8, -85, -130, -20, 8]).fill({ color: K.mtnM, alpha: 0.70 })
    // Snow cap
    g.poly([-10, -230, 0, -248, 16, -228, 5, -212]).fill({ color: 0xEDF4F8, alpha: 0.88 })

    // ── Temple enclosure wall ────────────────────────────────────────
    g.rect(-96, -14, 192, 16).fill({ color: K.stoneD, alpha: 0.92 })
    g.rect(-94, -16, 188, 4).fill({ color: K.stone, alpha: 0.85 })
    // Gate archway
    g.rect(-13, -14, 26, 14).fill({ color: 0x180C04, alpha: 0.9 })
    g.rect(-13, -28, 26, 14).fill({ color: K.wood, alpha: 0.85 })

    // ── Stone steps ─────────────────────────────────────────────────
    for (let s = 0; s < 4; s++) {
      g.rect(-15 + s * 1.5, 5 + s * 5, 30 - s * 3, 5).fill({ color: K.stoneL, alpha: 0.70 - s * 0.08 })
    }

    // ── Side wings (flanking buildings) ─────────────────────────────
    // Left wing
    g.rect(-92, -58, 44, 44).fill({ color: K.wallS, alpha: 0.88 })
    g.poly([-96, -58, -70, -78, -44, -58]).fill({ color: K.roof, alpha: 0.92 })
    g.poly([-99, -58, -103, -64, -96, -60]).fill({ color: K.roofM, alpha: 0.88 })
    g.poly([-41, -58, -37, -64, -44, -60]).fill({ color: K.roofM, alpha: 0.88 })
    // Right wing
    g.rect( 48, -54, 40, 40).fill({ color: K.wallS, alpha: 0.88 })
    g.poly([ 44, -54,  68, -72,  92, -54]).fill({ color: K.roof, alpha: 0.92 })
    g.poly([ 41, -54,  37, -60,  44, -56]).fill({ color: K.roofM, alpha: 0.88 })
    g.poly([ 91, -54,  95, -60,  88, -56]).fill({ color: K.roofM, alpha: 0.88 })

    // ── Main pagoda (5 tiers) ────────────────────────────────────────
    const TIERS = 5
    const BASE_W = 60
    const SHRINK = 0.80
    const TIER_H = 22
    const ROOF_OH = 12
    let tw = BASE_W
    let ty = -14  // bottom of first tier (at wall top)
    for (let i = 0; i < TIERS; i++) {
      const rw = tw / 2
      // Wall body
      g.rect(-rw + 5, ty - TIER_H, rw * 2 - 10, TIER_H).fill({ color: K.wall, alpha: 0.90 - i * 0.02 })
      // Roof
      g.poly([-(rw + ROOF_OH), ty - TIER_H, 0, ty - TIER_H - 14, rw + ROOF_OH, ty - TIER_H]).fill({ color: K.roof, alpha: 0.94 })
      // Upswept roof tips
      g.poly([-(rw + ROOF_OH), ty - TIER_H, -(rw + ROOF_OH + 5), ty - TIER_H - 7, -(rw + ROOF_OH - 3), ty - TIER_H - 2]).fill({ color: K.roofE, alpha: 0.90 })
      g.poly([ rw + ROOF_OH,  ty - TIER_H,  rw + ROOF_OH + 5,  ty - TIER_H - 7,   rw + ROOF_OH - 3,  ty - TIER_H - 2]).fill({ color: K.roofE, alpha: 0.90 })
      // Red lanterns on each tier
      const lx = rw * 0.45
      g.circle(-lx, ty - TIER_H * 0.5, 2.8).fill({ color: K.lanR, alpha: 0.88 })
      g.circle( lx, ty - TIER_H * 0.5, 2.8).fill({ color: K.lanR, alpha: 0.88 })

      ty -= TIER_H
      tw *= SHRINK
    }
    // Golden spire / finial
    g.rect(-2.5, ty - 30, 5, 30).fill({ color: K.gold, alpha: 0.92 })
    g.poly([-5, ty, 0, ty - 10, 5, ty]).fill({ color: K.goldL, alpha: 0.90 })
    // Decorative orb at top of spire
    g.circle(0, ty - 32, 4).fill({ color: K.goldL, alpha: 0.88 })

    // ── Bell tower (left side) ───────────────────────────────────────
    g.rect(-86, -110, 28, 52).fill({ color: K.wall, alpha: 0.85 })
    g.poly([-90, -110, -72, -128, -54, -110]).fill({ color: K.roof, alpha: 0.92 })
    g.poly([-93, -110, -96, -116, -90, -112]).fill({ color: K.roofM, alpha: 0.88 })
    g.poly([-51, -110, -48, -116, -54, -112]).fill({ color: K.roofM, alpha: 0.88 })
    // Bell silhouette
    g.ellipse(-72, -100, 5, 7).fill({ color: K.gold, alpha: 0.75 })

    // ── Torii gate (right side, partially visible) ──────────────────
    g.rect(66, -14, 4, 60).fill({ color: K.colR, alpha: 0.80 })
    g.rect(84, -14, 4, 60).fill({ color: K.colR, alpha: 0.80 })
    g.rect(62, -60, 30, 6).fill({ color: K.colR, alpha: 0.82 })
    g.rect(65, -52, 24, 5).fill({ color: K.colRD, alpha: 0.80 })

    return g
  }

  private _buildFog(): PIXI.Graphics {
    const g = new PIXI.Graphics()
    // Colour matches sky horizon (K.skyH ≈ C0D8EC)
    g.rect(-130, -260, 260, 280).fill({ color: K.skyH })
    g.alpha = 0.78
    return g
  }

  private _buildHaze(): PIXI.Graphics {
    const g = new PIXI.Graphics()
    // Softer bottom haze band that blends temple into sky/mountains
    g.rect(-140, -20, 280, 40).fill({ color: K.skyH, alpha: 0.55 })
    g.rect(-130, -10, 260, 18).fill({ color: K.hillN, alpha: 0.25 })
    return g
  }

  // Call every frame from the game ticker with the smoothed camera x.
  update(camX: number): void {
    const dist = Math.max(0, Math.min(1, (TEMPLE_WORLD_X - camX) / TEMPLE_WORLD_X))
    // dist = 1 → player at Zone 1 start (far from temple)
    // dist = 0 → player at temple

    // Scale: tiny at full distance, near-full at temple
    const sc = 0.10 + (1 - dist) * 0.88
    this.container.scale.set(sc)

    // Overall alpha: very faint at distance, solid near temple
    this.container.alpha = 0.22 + (1 - dist) * 0.74

    // Fog density: heavy when far, zero when at temple
    this.fog.alpha  = Math.min(0.82, dist * 0.94)
    this.haze.alpha = Math.min(0.65, dist * 0.72)

    // Add small per-frame parallax beyond the mountains layer's 0.06×
    // so total effective parallax ≈ 0.10× (temple moves slightly faster than mtns)
    this.container.x = 680 - camX * 0.04
  }
}
