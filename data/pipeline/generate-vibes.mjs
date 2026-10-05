import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const projectRoot = resolve(import.meta.dirname, '../..')
const dataRoot = resolve(projectRoot, 'public/data/years')
const envText = await readFile(resolve(projectRoot, '.env'), 'utf8').catch(() => '')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => line.split(/=(.*)/s).slice(0, 2)))
const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY
const model = env.GEMINI_MODEL || process.env.GEMINI_MODEL || 'gemini-3.8-flash'
if (!apiKey) throw new Error('GEMINI_API_KEY is required. Add it to your local .env file.')

const years = Array.from({ length: new Date().getFullYear() - 1949 }, (_, index) => 1950 + index)
const prompt = `Write one playful, Gen Z friendly, non-factual vibe caption for each year in this list: ${years.join(', ')}. These are decorative lines for a birth-year time capsule. Do not claim events, songs, films, trends, or historical facts. Keep each line under 12 words, warm and shareable, varied, and appropriate for all ages. Return only a JSON object mapping year strings to captions.`
let captions
let lastError
for (let attempt = 0; attempt < 3 && !captions; attempt += 1) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json' } })
    })
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}: ${(await response.text()).slice(0, 240)}`)
    const payload = await response.json()
    const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('')
    captions = JSON.parse(text)
  } catch (error) {
    lastError = error
    if (attempt < 2) await new Promise(resolveDelay => setTimeout(resolveDelay, 1500 * (attempt + 1)))
  }
}
if (!captions) console.warn(`Gemini is unavailable; using original local captions. ${lastError?.message || ''}`)
const localCaptions = ['Certified main-character origin story.', 'The vibes were immaculate; the lore is yours.', 'Born iconic. The timeline had no idea.', 'Your first day, instant plot twist.', 'A whole era started with you. Main character energy.']

for (const year of years) {
  const path = resolve(dataRoot, `${year}.json`)
  const document = JSON.parse(await readFile(path, 'utf8'))
  const caption = captions?.[String(year)] || localCaptions[(year - 1950) % localCaptions.length]
  if (typeof caption === 'string' && caption.trim()) document.vibeLine = caption.trim().slice(0, 140)
  await writeFile(path, `${JSON.stringify(document, null, 2)}\n`)
}
console.log(`Added playful vibe captions to ${years.length} year files${captions ? ' with Gemini' : ' with local copy'}.`)
