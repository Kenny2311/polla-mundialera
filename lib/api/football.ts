const BASE_URL = "https://api.football-data.org/v4"

function fixEncoding(str: string): string {
  try {
    return decodeURIComponent(
      str.split("").map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0")).join("")
    )
  } catch {
    return str
  }
}

export type MatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"

export type MatchResult = {
  apiId: number
  utcDate: string
  status: MatchStatus
  grupo: string
  equipoLocal: string
  equipoVisitante: string
  golesLocal: number | null
  golesVisitante: number | null
}

type ApiMatch = {
  id: number
  utcDate: string
  status: string
  group: string
  homeTeam: { name: string }
  awayTeam: { name: string }
  score: {
    fullTime: { home: number | null; away: number | null }
  }
}

type ApiResponse = {
  matches: ApiMatch[]
}

export async function getGroupStageResults(): Promise<MatchResult[]> {
  const res = await fetch(
    `${BASE_URL}/competitions/WC/matches?season=2026&stage=GROUP_STAGE`,
    {
      headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY! },
      cache: "no-store",
    }
  )

  if (!res.ok) {
    throw new Error(`football-data.org error: ${res.status} ${res.statusText}`)
  }

  const data: ApiResponse = await res.json()

  const results = await Promise.all(
    data.matches.map(async (m) => {
      let golesLocal = m.score.fullTime.home
      let golesVisitante = m.score.fullTime.away

      if (m.status === "FINISHED" && (golesLocal === null || golesVisitante === null)) {
        try {
          const r = await fetch(`${BASE_URL}/matches/${m.id}`, {
            headers: { "X-Auth-Token": process.env.FOOTBALL_DATA_KEY! },
            cache: "no-store",
          })
          if (r.ok) {
            const d = await r.json()
            golesLocal = d.score.fullTime.home
            golesVisitante = d.score.fullTime.away
          }
        } catch {
          // mantener null si falla
        }
      }

      return {
        apiId: m.id,
        utcDate: m.utcDate,
        status: m.status as MatchStatus,
        grupo: m.group.replace("GROUP_", ""),
        equipoLocal: fixEncoding(m.homeTeam.name),
        equipoVisitante: fixEncoding(m.awayTeam.name),
        golesLocal,
        golesVisitante,
      }
    })
  )

  return results
}