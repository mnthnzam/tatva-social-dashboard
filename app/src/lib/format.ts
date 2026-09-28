export const n = (x: number | null | undefined): string => {
  if (x === null || x === undefined || Number.isNaN(x)) return '—'
  const r = Math.round(x)
  if (Math.abs(r) >= 1_000_000) return (r / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (Math.abs(r) >= 10_000) return (r / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return r.toLocaleString('en-US')
}

export const full = (x: number | null | undefined): string =>
  x === null || x === undefined ? '—' : Math.round(x).toLocaleString('en-US')

export const pct = (x: number, digits = 0): string => `${(x * 100).toFixed(digits)}%`

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const parseDate = (s: string): Date => {
  const [d, t] = s.split(' ')
  const [y, m, day] = d.split('-').map(Number)
  const [hh, mm] = (t || '00:00').split(':').map(Number)
  return new Date(y, m - 1, day, hh, mm)
}

export const day = (s: string | null): string => {
  if (!s) return 'Date TBC'
  const d = parseDate(s)
  return `${d.getDate()} ${MON[d.getMonth()]}`
}

export const dayLong = (s: string | null): string => {
  if (!s) return 'Date to be fixed'
  const d = parseDate(s)
  return `${DOW[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]}`
}

export const time = (s: string): string => {
  const d = parseDate(s)
  const h = d.getHours(), m = d.getMinutes()
  const ap = h >= 12 ? 'pm' : 'am'
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${ap}`
}

export const monthShort = (id: string): string => MON[Number(id.slice(5, 7)) - 1]

export const secs = (s: number | null): string => (s === null ? '—' : s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`)

export const plural = (k: number, one: string, many = one + 's') => `${k} ${k === 1 ? one : many}`
