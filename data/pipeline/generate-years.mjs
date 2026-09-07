import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const output = resolve(root, '../public/data/years')
const envText = await readFile(resolve(root, '../.env'), 'utf8').catch(() => '')
const env = Object.fromEntries(envText.split(/\r?\n/).filter(Boolean).map(line => line.split(/=(.*)/s).slice(0, 2)))
const tmdbKey = env.TMDB_API_KEY || process.env.TMDB_API_KEY
const startYear = 1950
const endYear = new Date().getFullYear()
const curated = JSON.parse(await readFile(resolve(root, 'curated/kerala.json'), 'utf8'))

if (!tmdbKey) throw new Error('TMDB_API_KEY is required. Copy .env.example to .env and fill it locally.')

const youtubeSearch = query => `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
const cleanText = text => (text || 'A year with plenty still worth uncovering.').replace(/\s+/g, ' ').split(/(?<=[.!?])\s/).slice(0, 2).join(' ').slice(0, 260)

async function getJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': 'TimeCapsuleDataPipeline/1.0 (static hobby project)' } })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response.json()
}

async function moviesFor(year, options, language) {
  const params = new URLSearchParams({ api_key: tmdbKey, primary_release_year: String(year), sort_by: 'popularity.desc', include_adult: 'false', 'vote_count.gte': '3' })
  Object.entries(options).forEach(([key, value]) => params.set(key, value))
  try {
    const payload = await getJson(`https://api.themoviedb.org/3/discover/movie?${params}`)
    return payload.results.slice(0, 4).map(movie => ({
      title: movie.title || movie.original_title,
      language,
      posterUrl: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : '',
      watchUrl: youtubeSearch(`${movie.title || movie.original_title} ${year} official trailer`)
    }))
  } catch (error) {
    console.warn(`TMDb movies unavailable for ${year}: ${error.message}`)
    return []
  }
}

async function wikipediaSummary(title, fallback) {
  try {
    const payload = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
    return { headline: payload.title || fallback, detail: cleanText(payload.extract), sourceUrl: payload.content_urls?.desktop?.page }
  } catch {
    return { headline: fallback, detail: 'The archive is still being catalogued. Explore the year’s films, playlists, and video reels.', sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}` }
  }
}

function musicFor(year, region) {
  const query = region === 'Kerala' ? `${year} Malayalam songs playlist` : `${year} biggest songs playlist`
  return [{ title: `${year} on repeat`, artist: region === 'Kerala' ? 'Malayalam throwback mix' : 'A year-defining music mix', playUrl: youtubeSearch(query) }]
}

function sportsFor(year, region) {
  const query = region === 'Kerala' ? `${year} Kerala sports highlights` : `${year} best sports highlights`
  return [{ headline: `${year} sports reel`, detail: 'Open the highlight reel and relive the season’s unforgettable moments.', videoUrl: youtubeSearch(query) }]
}

await mkdir(output, { recursive: true })
for (let year = startYear; year <= endYear; year += 1) {
  const [internationalMovies, keralaMovies, indiaMovies, worldEvent, indiaEvent] = await Promise.all([
    moviesFor(year, {}, 'International cinema'),
    moviesFor(year, { with_original_language: 'ml' }, 'Malayalam cinema'),
    moviesFor(year, { region: 'IN' }, 'Indian cinema'),
    wikipediaSummary(String(year), `The world in ${year}`),
    wikipediaSummary(`${year} in India`, `India in ${year}`)
  ])
  const kerala = curated[year] || {}
  const regional = {
    state: 'Kerala',
    movies: kerala.movies?.map(movie => ({ ...movie, watchUrl: youtubeSearch(`${movie.title} official trailer`) })) || keralaMovies,
    music: kerala.music?.map(track => ({ ...track, playUrl: youtubeSearch(`${track.title} ${track.artist}`) })) || musicFor(year, 'Kerala'),
    sports: kerala.sports?.map(item => ({ ...item, videoUrl: youtubeSearch(`${year} Kerala sports highlights`) })) || sportsFor(year, 'Kerala'),
    events: kerala.events?.map(item => ({ ...item, sourceUrl: indiaEvent.sourceUrl })) || [indiaEvent]
  }
  const india = { state: 'India', movies: indiaMovies, music: musicFor(year, 'India'), sports: sportsFor(year, 'India'), events: [indiaEvent] }
  const international = { movies: internationalMovies, music: musicFor(year, 'International'), sports: sportsFor(year, 'International'), events: [worldEvent] }
  const dataConfidence = regional.movies.length && international.movies.length ? 'partial' : 'sparse'
  await writeFile(resolve(output, `${year}.json`), `${JSON.stringify({ year, regional, india, international, dataConfidence }, null, 2)}\n`)
  console.log(`Filed ${year}`)
  await new Promise(resolveDelay => setTimeout(resolveDelay, 120))
}
console.log(`Generated ${endYear - startYear + 1} static year files.`)
