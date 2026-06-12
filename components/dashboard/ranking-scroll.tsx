"use client"

import { useRef, useEffect } from "react"
import type { EntradaRanking } from "./podio"

const MEDALS = ["🥇", "🥈", "🥉"]
const MEDAL_COLORS = ["text-medal-gold", "text-medal-silver", "text-medal-bronze"]
const SPEED = 28 // px/s

export function RankingScroll({ ranking }: { ranking: EntradaRanking[] }) {
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const inner = innerRef.current
    if (!inner) return

    let rafId: number
    let offset = 0
    let last = performance.now()

    function tick(now: number) {
      const dt = (now - last) / 1000
      last = now
      const halfH = inner!.scrollHeight / 2
      if (halfH <= 0) { rafId = requestAnimationFrame(tick); return }
      offset += SPEED * dt
      if (offset >= halfH) offset -= halfH
      inner!.style.transform = `translateY(-${offset}px)`
      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Double the list for seamless loop
  const doubled = [...ranking, ...ranking]

  return (
    <div className="overflow-hidden flex-1 min-h-0">
      <div ref={innerRef}>
        {doubled.map((e, i) => (
          <div
            key={`${e.participante}-${i}`}
            className="grid grid-cols-[2.5rem_1fr_4.5rem] gap-x-3 px-3 py-4 border-b border-border items-center"
          >
            <span className={`font-display text-2xl italic font-black ${MEDAL_COLORS[e.posicion - 1] ?? "text-faint"}`}>
              {MEDALS[e.posicion - 1] ?? <span>{e.posicion}</span>}
            </span>
            <div className="min-w-0">
              <p className="font-label text-sm font-bold text-text leading-tight truncate">{e.alias}</p>
              <p className="label-meta text-[10px] text-faint mt-0.5">{e.participante}</p>
            </div>
            <span className="font-display text-3xl italic font-black tabular text-text text-right">{e.puntosTotal}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
