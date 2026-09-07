import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const curated = JSON.parse(await readFile(resolve(root, 'curated/kerala.json'), 'utf8'))
const international = {
  1998: { movies: [{ title: 'Titanic' }], music: [{ title: 'The Boy Is Mine', artist: 'Brandy & Monica' }], sports: [{ headline: 'France wins the FIFA World Cup', detail: 'A home-tournament triumph in Paris.' }], events: [{ headline: 'Good Friday Agreement signed', detail: 'A landmark accord in Northern Ireland.' }] },
  2005: { movies: [{ title: 'Star Wars: Episode III – Revenge of the Sith' }], music: [{ title: 'We Belong Together', artist: 'Mariah Carey' }], sports: [{ headline: 'Liverpool win in Istanbul', detail: 'The Champions League final became an instant classic.' }], events: [{ headline: 'YouTube launches', detail: 'The internet was about to get a whole lot more watchable.' }] },
  2015: { movies: [{ title: 'Star Wars: The Force Awakens' }], music: [{ title: 'Uptown Funk', artist: 'Mark Ronson ft. Bruno Mars' }], sports: [{ headline: 'Australia win the Cricket World Cup', detail: 'The hosts lifted the trophy at the MCG.' }], events: [{ headline: 'Paris Agreement adopted', detail: 'Countries agreed on a shared climate framework.' }] }
}
await mkdir(resolve(root, 'years'), { recursive: true })
for (const year of Object.keys(curated)) {
  const document = { year: Number(year), regional: { state: 'Kerala', ...curated[year] }, international: international[year], dataConfidence: 'partial' }
  await writeFile(resolve(root, `years/${year}.json`), `${JSON.stringify(document, null, 2)}\n`)
}
console.log(`Generated ${Object.keys(curated).length} static year files.`)
