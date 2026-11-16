// Usage: node tools/make-hero.mts > docs/hero.svg
// The README's width= must match W; nothing checks that.
import { COLOR, MONO, PANE, SANS, TITLE, pane } from './pane.mts'

const W = 760
const H = 340
const LEFT = 28
const COLUMN = 356

const reply = [
  { text: 'Done. Two commits on the branch.', color: COLOR.text },
  { text: '', color: COLOR.dim },
  { text: `**${TITLE}**`, color: COLOR.accent },
  { text: '- Push the branch', color: COLOR.dim },
  { text: '- Restart the app', color: COLOR.dim },
  { text: '- Upload the social preview', color: COLOR.dim },
].map((line, i) => `<text x="${LEFT}" y="${52 + i * 22}" font-size="14" font-family="${MONO}" fill="${line.color}">${line.text}</text>`)

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="${SANS}">
<rect width="${W}" height="${H}" rx="14" fill="${COLOR.bg}"/>
${reply.join('\n')}
<rect x="${LEFT}" y="212" width="${COLUMN}" height="100" rx="12" fill="${COLOR.panel}"/>
<text x="${LEFT + 18}" y="244" font-size="15">✋</text>
<text x="${LEFT + 44}" y="244" font-size="15" fill="${COLOR.text}">${TITLE} 3</text>
<rect x="${LEFT + 14}" y="262" width="${COLUMN - 28}" height="36" rx="8" fill="${COLOR.bg}"/>
<text x="${LEFT + 28}" y="285" font-size="14" fill="${COLOR.dim}">Reply…</text>
<g transform="translate(${W - PANE.width - LEFT} 24)">
${pane()}
</g>
</svg>
`)
