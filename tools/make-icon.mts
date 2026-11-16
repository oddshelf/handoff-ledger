// Usage: node tools/make-icon.mts | rsvg-convert -o plugin/.claude-plugin/icon.png
// The marketplace takes the listing icon only from the first save or submission; a later change does not reach it.
const SIZE = 1024
const BG = '#1c2230'
const LINE = '#8b95a7'
const DONE = '#4f8ff7'
const BOX = 120
const GAP = 220
const LEFT = 232

const rows = [
  { done: true, width: 360 },
  { done: false, width: 440 },
  { done: false, width: 280 },
].map((row, i) => {
  const y = SIZE / 2 + (i - 1) * GAP - BOX / 2
  const box = row.done
    ? `<rect x="${LEFT}" y="${y}" width="${BOX}" height="${BOX}" rx="28" fill="${DONE}"/>
<path d="M${LEFT + 30} ${y + 62} l22 24 l40 -46" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<rect x="${LEFT + 8}" y="${y + 8}" width="${BOX - 16}" height="${BOX - 16}" rx="22" fill="none" stroke="${LINE}" stroke-width="16"/>`
  const line = `<rect x="${LEFT + BOX + 60}" y="${y + BOX / 2 - 16}" width="${row.width}" height="32" rx="16" fill="${row.done ? DONE : LINE}"${row.done ? ' opacity="0.55"' : ''}/>`
  return `${box}\n${line}`
})

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
<rect width="${SIZE}" height="${SIZE}" fill="${BG}"/>
${rows.join('\n')}
</svg>
`)
