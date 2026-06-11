import * as XLSX from "xlsx"
import fs from "fs"
import path from "path"
import type { Prediccion, Participante } from "../data/predictions"

export type SheetData = {
  participantes: Participante[]
  predicciones: Prediccion[]
}

const COLUMNAS_IGNORAR = new Set([
  "Marca temporal",
  "Dirección de correo electrónico",
  "Puntuación",
  "Nombre colaborador",
  "Alias / Apodo (El que usará Ranking)",
])

function esColumnaPartido(header: string): boolean {
  return header.includes("vs") && header.includes("[") && header.includes("]")
}

function extraerPartidoBase(header: string): string {
  return header.substring(0, header.lastIndexOf("[")).trim()
}

function toInt(val: unknown): number | null {
  if (val === null || val === undefined || val === "") return null
  const n = Number(val)
  return isNaN(n) ? null : Math.round(n)
}

const PARTIDO_NO_BY_NOMBRE: Record<string, number> = {
  "México vs. Sudáfrica": 1,
  "Corea del Sur vs. Rep. Checa": 2,
  "Canadá vs. Bosnia": 3,
  "Estados Unidos vs. Paraguay": 4,
  "Haití vs. Escocia": 5,
  "Australia vs. Turquía": 6,
  "Brasil vs. Marruecos": 7,
  "Qatar vs. Suiza": 8,
  "Costa de Marfil vs. Ecuador": 9,
  "Alemania vs. Curazao": 10,
  "Países Bajos vs. Japón": 11,
  "Suecia vs. Túnez": 12,
  "Arabia Saudita vs. Uruguay": 13,
  "España vs. Cabo Verde": 14,
  "Irán vs. Nueva Zelanda": 15,
  "Bélgica vs. Egipto": 16,
  "Francia vs. Senegal": 17,
  "Irak vs. Noruega": 18,
  "Argentina vs. Argelia": 19,
  "Austria vs. Jordania": 20,
  "Ghana vs. Panamá": 21,
  "Inglaterra vs. Croacia": 22,
  "Portugal vs. Rep. del Congo": 23,
  "Uzbekistán vs. Colombia": 24,
  "Rep. Checa vs. Sudáfrica": 25,
  "Suiza vs. Bosnia": 26,
  "Canadá vs. Qatar": 27,
  "México vs. Corea del Sur": 28,
  "Brasil vs. Haití": 29,
  "Escocia vs. Marruecos": 30,
  "Turquía vs. Paraguay": 31,
  "Estados Unidos vs. Australia": 32,
  "Alemania vs. Costa de Marfil": 33,
  "Ecuador vs. Curazao": 34,
  "Países Bajos vs. Suecia": 35,
  "Túnez vs.  Japón": 36,
  "Uruguay vs. Cabo Verde": 37,
  "España vs.  Arabia Saudita": 38,
  "Bélgica vs. Irán": 39,
  "Nueva Zelanda vs. Egipto": 40,
  "Noruega vs. Senegal": 41,
  "Francia vs. Irak": 42,
  "Argentina vs. Austria": 43,
  "Jordania vs. Argelia": 44,
  "Inglaterra vs. Ghana": 45,
  "Panamá vs. Croacia": 46,
  "Portugal  vs. Uzbekistán": 47,
  "Colombia vs. Rep. del Congo": 48,
  "Escocia vs. Brasil": 49,
  "Marruecos vs. Haití": 50,
  "Suiza vs.  Canadá": 51,
  "Bosnia vs. Qatar": 52,
  "Rep. Checa vs.  México": 53,
  "Sudáfrica vs.  Corea del Sur": 54,
  "Curazao vs.  Costa de Marfil": 55,
  "Ecuador vs. Alemania": 56,
  "Japón vs.  Suecia": 57,
  "Túnez vs. Países Bajos": 58,
  "Turquía vs. Estados Unidos": 59,
  "Paraguay vs. Australia": 60,
  "Noruega vs. Francia": 61,
  "Senegal vs. Irak": 62,
  "Egipto vs. Irán": 63,
  "Nueva Zelanda vs. Bélgica": 64,
  "Cabo Verde vs.  Arabia Saudita": 65,
  "Uruguay vs. España": 66,
  "Panamá vs. Inglaterra": 67,
  "Croacia vs. Ghana": 68,
  "Argelia vs. Austria": 69,
  "Jordania vs. Argentina": 70,
  "Colombia vs. Portugal": 71,
  "Rep. del Congo vs. Uzbekistán": 72,
}

export function readExcelLocal(filename: string): SheetData {
  const filePath = path.join(process.cwd(), "data", filename)
  const buffer = fs.readFileSync(filePath)
  const workbook = XLSX.read(buffer, { type: "buffer", raw: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })

  const participantes: Participante[] = []
  const predicciones: Prediccion[] = []

  if (rows.length === 0) return { participantes, predicciones }

  const headers = Object.keys(rows[0])

  // Agrupar columnas por partido base → [colLocal, colVisit]
  const partidoMap = new Map<string, [string, string]>()
  for (const header of headers) {
    if (COLUMNAS_IGNORAR.has(header)) continue
    if (!esColumnaPartido(header)) continue
    const base = extraerPartidoBase(header)
    const existing = partidoMap.get(base)
    if (!existing) {
      partidoMap.set(base, [header, ""])
    } else {
      partidoMap.set(base, [existing[0], header])
    }
  }

  for (const row of rows) {
    const email = String(row["Dirección de correo electrónico"] ?? "").trim()
    const nombre = String(row["Nombre colaborador"] ?? "").trim()
    const alias = String(row["Alias / Apodo (El que usará Ranking)"] ?? "").trim()

    if (!email || !nombre) continue

    participantes.push({ nombre, alias: alias || nombre })

    for (const [base, [colLocal, colVisit]] of partidoMap) {
      if (!colLocal || !colVisit) continue

      const goles_local = toInt(row[colLocal])
      const goles_visitante = toInt(row[colVisit])

      if (goles_local === null || goles_visitante === null) continue

      const partido_no = PARTIDO_NO_BY_NOMBRE[base]
      if (!partido_no) continue  // ignorar partidos no mapeados

      predicciones.push({
        participante: nombre,
        partido_no,
        goles_local,
        goles_visitante,
      })
    }
  }

  return { participantes, predicciones }
}