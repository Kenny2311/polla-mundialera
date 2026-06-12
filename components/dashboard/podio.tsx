export type EntradaRanking = {
  posicion: number
  participante: string
  alias: string
  puntosTotal: number
  partidosJugados: number
}

// Visual order left → right: 2°, 1°, 3°
const SLOTS = [
  { pos: 2, stageH: "h-12", stageBg: "bg-medal-silver", textColor: "text-medal-silver" },
  { pos: 1, stageH: "h-20", stageBg: "bg-medal-gold",   textColor: "text-medal-gold"   },
  { pos: 3, stageH: "h-8",  stageBg: "bg-medal-bronze", textColor: "text-medal-bronze" },
] as const

export function Podio({ top3 }: { top3: EntradaRanking[] }) {
  const byPos = Object.fromEntries(top3.map((e) => [e.posicion, e]))

  return (
    <section>
      <p className="label-eyebrow brand-bullet mb-4">Podio actual</p>

      <div className="flex items-end gap-2">
        {SLOTS.map(({ pos, stageH, stageBg, textColor }) => {
          const entry = byPos[pos]

          return (
            <div key={pos} className="flex-1 flex flex-col">
              {/* ── Card ── */}
              <div className="surface p-3 sm:p-4 text-center">
                {/* Posición */}
                <span className={`font-display text-3xl sm:text-4xl font-black italic ${textColor}`}>
                  {pos}°
                </span>

                {entry ? (
                  <>
                    <p className="text-red-500">
                      ALIAS: {entry.alias}
                    </p>

                    <p className="text-blue-500">
                      NOMBRE: {entry.participante}
                    </p>
                    <p className={`font-display text-2xl sm:text-3xl font-black italic mt-3 tabular ${textColor}`}>
                      {entry.puntosTotal}
                    </p>
                    <p className="label-meta text-[10px] text-faint">pts</p>
                  </>
                ) : (
                  <p className="text-faint text-sm mt-3">—</p>
                )}

              </div>

              {/* ── Stage ── */}
              <div className={`${stageH} ${stageBg} opacity-80`} />
            </div>
          )
        })}
      </div>
    </section>
  )
}
