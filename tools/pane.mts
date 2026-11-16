// The pane as the mod draws it, redrawn by hand: the mod's own tree needs the engine, which node does not have.
// Change the pane's rows or button labels in plugin/hooks/register.tsx and this follows by hand.
export const COLOR = {
  bg: '#1c2230',
  panel: '#232a3a',
  text: '#e6e9ee',
  dim: '#8b95a7',
  button: '#323c50',
  accent: '#5b8fe0',
} as const

export const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif"
export const MONO = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
export const TITLE = 'Your turn'
export const PANE = { width: 320, height: 340 } as const

const ITEMS = [
  { text: 'Push the branch', command: 'git push origin main' },
  { text: 'Restart the app', age: '2d ago' },
  { text: 'Upload the social preview' },
]

const button = (x: number, y: number, width: number, label: string) =>
  `<rect x="${x}" y="${y}" width="${width}" height="26" rx="6" fill="${COLOR.button}"/>
<text x="${x + width / 2}" y="${y + 18}" font-size="13" text-anchor="middle" fill="${COLOR.text}">${label}</text>`

export const pane = () => {
  const parts = [
    `<rect width="${PANE.width}" height="${PANE.height}" rx="12" fill="${COLOR.panel}"/>`,
    `<text x="20" y="34" font-size="15" font-weight="700" fill="${COLOR.dim}">${TITLE}</text>`,
  ]
  let y = 68
  for (const item of ITEMS) {
    parts.push(`<text x="20" y="${y}" font-size="15" fill="${COLOR.text}">${item.text}</text>`)
    if (item.age !== undefined) {
      y += 20
      parts.push(`<text x="20" y="${y}" font-size="13" fill="${COLOR.dim}">${item.age}</text>`)
    }
    y += 10
    if (item.command !== undefined) {
      parts.push(`<text x="20" y="${y + 12}" font-size="13" font-family="${MONO}" fill="${COLOR.dim}">${item.command}</text>`)
      y += 22
      parts.push(button(20, y, 118, 'Copy command'), button(146, y, 56, 'Done'))
    } else {
      parts.push(button(20, y, 56, 'Done'))
    }
    y += 26 + 30
  }
  parts.push(button(20, y - 12, 76, 'Clear all'))
  return parts.join('\n')
}
