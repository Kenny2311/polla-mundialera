import Image from "next/image"
import { getGroupStageResults } from "@/lib/api/football"
import { calcularResumenParticipantes } from "@/lib/scoring"
import { calcularTablasGrupo } from "@/lib/standings"
import { esPorApi } from "@/lib/data/teams"
import { RankingScroll } from "@/components/dashboard/ranking-scroll"
import type { MatchResult } from "@/lib/api/football"
import { readExcelLocal } from "@/lib/api/read-excel"

function formatChile(utcDate: string) {
  const d = new Date(utcDate)
  const dia = d.toLocaleDateString("es-PE", { timeZone: "America/Lima", weekday: "short" })
    .replace(".", "")
  const hora = d.toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
  return { dia, hora }
}

function formatHora(utcDate: string) {
  return new Date(utcDate).toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

const PODIO_SLOTS = [
  { pos: 2, stageH: "h-8",  colorClass: "text-medal-silver", bgClass: "bg-medal-silver" },
  { pos: 1, stageH: "h-12", colorClass: "text-medal-gold",   bgClass: "bg-medal-gold"   },
  { pos: 3, stageH: "h-6",  colorClass: "text-medal-bronze", bgClass: "bg-medal-bronze" },
] as const

export default async function ProyeccionPage() {
  const resultados = await getGroupStageResults()

  const jugados = resultados.filter((r) => r.status === "FINISHED").length
  const total   = resultados.length
  const pct     = total > 0 ? Math.round((jugados / total) * 100) : 0
  const enVivo  = resultados.find((r) => r.status === "IN_PLAY") ?? null

  const pendientes = resultados
    .filter((r) => r.status === "TIMED" || r.status === "SCHEDULED")
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())

  const proximo   = pendientes[0] ?? null
  const proximos5 = pendientes.slice(0, 5)

  const { participantes, predicciones } = readExcelLocal("predicciones.xlsx")
  const resumen = calcularResumenParticipantes(predicciones, participantes, resultados)
  const ranking = resumen
    .sort((a, b) => b.puntosTotal - a.puntosTotal || a.participante.localeCompare(b.participante))
    .map((r, i) => ({ ...r, posicion: i + 1 }))

  const top3  = ranking.slice(0, 3)
  const tablas = calcularTablasGrupo(resultados)

  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ══════════════════════════════════════════════════════
          ÁREA PRINCIPAL (izq 30% + der 70%)
      ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── COLUMNA IZQUIERDA 30% ── */}
        <div className="w-[30%] flex flex-col gap-3 p-4 overflow-hidden border-r border-border">

          {/* Título */}
          <header className="flex items-center gap-2 shrink-0">
            <Image src="/logos/Quiniela-mundialera-32.png" alt="Logo" width={22} height={22} />
            <h1 className="display-title text-xl text-text">
              Quiniela <span className="text-flesan-red">Mundialera</span>
              <span className="text-muted"> · Piso 12</span>
            </h1>
          </header>

          {/* Franja estado */}
          <div className="surface p-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-1.5">
                  <span className="font-display text-3xl font-black italic text-text tabular">{jugados}</span>
                  <span className="label-meta text-[10px] text-muted">/ {total} partidos</span>
                </div>
                <div className="h-1 bg-border w-full mb-1">
                  <div className="h-full bg-flesan-red" style={{ width: `${pct}%` }} />
                </div>
                <p className="label-eyebrow text-[10px]">{pct}% · Fase de grupos</p>
              </div>

              <div className="w-px h-10 bg-border shrink-0" />

              {enVivo ? (
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-status-ok animate-pulse shrink-0" />
                    <span className="label-meta text-[10px] text-status-ok">En vivo</span>
                  </div>
                  <p className="font-label text-[11px] font-bold text-text leading-tight">
                    {esPorApi[enVivo.equipoLocal] ?? enVivo.equipoLocal}
                    <span className="text-muted font-normal"> vs </span>
                    {esPorApi[enVivo.equipoVisitante] ?? enVivo.equipoVisitante}
                  </p>
                </div>
              ) : proximo ? (
                <div className="flex flex-col gap-0.5">
                  <p className="label-eyebrow text-[9px] mb-0.5">Próximo</p>
                  <p className="font-label text-[11px] font-bold text-text leading-tight">
                    {esPorApi[proximo.equipoLocal] ?? proximo.equipoLocal}
                    <span className="text-muted font-normal"> vs </span>
                    {esPorApi[proximo.equipoVisitante] ?? proximo.equipoVisitante}
                  </p>
                  <p className="label-meta text-[9px] text-faint">
                    {formatHora(proximo.utcDate)} h · Grupo {proximo.grupo}
                  </p>
                </div>
              ) : (
                <p className="label-meta text-[10px] text-muted">Fase completada</p>
              )}
            </div>
          </div>

          {/* Podio */}
          <section className="shrink-0">
            <p className="label-eyebrow brand-bullet text-[10px] mb-2">Podio (Top 3)</p>
            <div className="flex items-end gap-2">
              {PODIO_SLOTS.map(({ pos, stageH, colorClass, bgClass }) => {
                const e = top3.find((x) => x.posicion === pos)
                return (
                  <div key={pos} className="flex-1 flex flex-col">
                    <div className="surface p-2 text-center">
                      <span className={`font-display text-xl font-black italic ${colorClass}`}>{pos}°</span>
                      {e ? (
                        <>
                          <p className="font-label text-lg font-bold text-text mt-1 leading-tight truncate">
                            {e.alias}
                          </p>
                          <p className="label-meta text-[9px] text-faint mt-0.5 truncate">
                            {e.participante}
                          </p>
                          <p className={`font-display text-xl font-black italic mt-1 tabular ${colorClass}`}>{e.puntosTotal}</p>
                          <p className="label-meta text-[9px] text-faint">pts</p>
                        </>
                      ) : <p className="text-faint text-xs mt-2">—</p>}
                    </div>
                    <div className={`${stageH} ${bgClass} opacity-80`} />
                  </div>
                )
              })}
            </div>
          </section>

          {/* Clasificación con scroll */}
          <section className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <p className="label-eyebrow brand-bullet text-[10px] mb-2 shrink-0">Clasificación</p>
            <div className="surface flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Cabecera fija */}
              <div className="grid grid-cols-[2.5rem_1fr_4.5rem] gap-x-3 px-3 py-2 border-b border-border shrink-0">
                <span className="label-meta text-[9px] text-faint">#</span>
                <span className="label-meta text-[9px] text-faint">Jugador</span>
                <span className="label-meta text-[9px] text-faint text-right">Pts</span>
              </div>
              {/* Lista con scroll */}
              <RankingScroll ranking={ranking} />
            </div>
          </section>

        </div>

        {/* ── COLUMNA DERECHA 70% ── */}
        <div className="w-[70%] flex flex-col gap-3 p-4 overflow-hidden">

          <header className="shrink-0">
            <h2 className="display-title text-2xl text-text">
              Resultados <span className="text-flesan-red">por Grupo</span>
            </h2>
          </header>

          {/* ✅ Wrapper con scroll — el grid crece libremente adentro */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="grid grid-cols-3 gap-3">
              {tablas.map(({ grupo, filas }) => (
                <section key={grupo}>
                  <p className="label-eyebrow text-[9px] brand-bullet mb-1.5">Grupo {grupo}</p>
                  <div className="surface">
                    <div className="grid grid-cols-[1fr_1.5rem_1.5rem_1.5rem_2.5rem_2.5rem] gap-x-1 px-2 py-1.5 border-b border-border">
                      <span className="label-meta text-[8px] text-faint">Equipo</span>
                      <span className="label-meta text-[8px] text-faint text-center">PJ</span>
                      <span className="label-meta text-[8px] text-faint text-center">PG</span>
                      <span className="label-meta text-[8px] text-faint text-center">PP</span>
                      <span className="label-meta text-[8px] text-faint text-center">DG</span>
                      <span className="label-meta text-[8px] text-faint text-right">PT</span>
                    </div>
                    {filas.map((f, i) => (
                      <div
                        key={f.equipoApi}
                        className="grid grid-cols-[1fr_1.5rem_1.5rem_1.5rem_2.5rem_2.5rem] gap-x-1 px-2 py-1.5 border-b border-border last:border-0 items-center"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className={`font-display text-[10px] font-black italic shrink-0 ${i === 0 ? "text-flesan-red" : "text-faint"}`}>
                            {i + 1}
                          </span>
                          {f.iso2 && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={`https://flagcdn.com/w40/${f.iso2}.png`}
                              alt={f.equipo}
                              width={14}
                              height={14}
                              className="w-[14px] h-[14px] rounded-full object-cover shrink-0"
                            />
                          )}
                          <span className="font-label text-[10px] font-semibold text-text truncate">{f.equipo}</span>
                        </div>
                        <span className="label-meta text-[9px] text-center text-muted">{f.pj}</span>
                        <span className="label-meta text-[9px] text-center text-muted">{f.pg}</span>
                        <span className="label-meta text-[9px] text-center text-muted">{f.pp}</span>
                        <span className={`label-meta text-[9px] text-center font-bold ${f.dg > 0 ? "text-status-ok" : f.dg < 0 ? "text-flesan-red" : "text-muted"}`}>
                          {f.dg > 0 ? `+${f.dg}` : f.dg}
                        </span>
                        <span className="font-display text-xs font-black italic text-text text-right tabular">{f.pts}</span>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          FRANJA INFERIOR: PRÓXIMOS 5 PARTIDOS
      ══════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-t border-border bg-surface px-5 py-0 h-14 flex items-center gap-6">
        <p className="label-eyebrow text-[10px] text-flesan-red shrink-0 brand-bullet">Próximos</p>
        <div className="flex-1 flex items-center gap-0 overflow-hidden">
          {proximos5.length === 0 ? (
            <span className="label-meta text-[10px] text-faint">No hay partidos programados</span>
          ) : (
            proximos5.map((m) => {
              const { dia, hora } = formatChile(m.utcDate)
              const local = esPorApi[m.equipoLocal] ?? m.equipoLocal
              const visit = esPorApi[m.equipoVisitante] ?? m.equipoVisitante
              return (
                <div key={m.apiId} className="flex items-center shrink-0">
                  <div className="flex flex-col px-5 py-1 border-l border-border first:border-l-0">
                    <span className="font-label text-xs font-bold text-text leading-tight">
                      {local} <span className="text-muted font-normal">vs</span> {visit}
                    </span>
                    <span className="label-meta text-[10px] text-faint capitalize">
                      {dia} · {hora}h
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

    </div>
  )
}