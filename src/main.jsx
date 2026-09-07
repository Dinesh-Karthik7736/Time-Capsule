import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toPng } from 'html-to-image'
import './styles.css'
import './enhancements.css'

const now = new Date().getFullYear()
const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Other']
const youtube = year => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${year} biggest songs movies sports highlights`)}`
const fallback = year => ({
  movies: [{ title: `${year} on the big screen`, language: 'Archive update pending', watchUrl: youtube(year) }],
  music: [{ title: `${year} on repeat`, artist: 'Open a free YouTube mix', playUrl: youtube(year) }],
  sports: [{ headline: `${year} sports reel`, detail: 'The archive is preparing this year’s highlight reel.', videoUrl: youtube(year) }],
  events: [{ headline: `The world in ${year}`, detail: 'We are cataloguing this year’s headlines.', sourceUrl: `https://en.wikipedia.org/wiki/${year}` }]
})

function App() {
  const [birthDate, setBirthDate] = useState('2004-11-12')
  const [state, setState] = useState('Kerala')
  const [data, setData] = useState(null)
  const [mode, setMode] = useState('regional')
  const [notice, setNotice] = useState('')
  const reduce = useReducedMotion()
  async function reveal(event) {
    event.preventDefault()
    const date = new Date(`${birthDate}T12:00:00`)
    const year = date.getFullYear()
    if (!birthDate || Number.isNaN(date.valueOf()) || year < 1950 || year > now) return setNotice(`Choose a birth date from 1950 to ${now}.`)
    setNotice('')
    try {
      const response = await fetch(`/data/years/${year}.json`)
      if (!response.ok) throw new Error('archive missing')
      setData({ ...await response.json(), selectedState: state, birthDate })
    } catch { setData({ year, regional: fallback(year), india: fallback(year), international: fallback(year), dataConfidence: 'sparse', selectedState: state, birthDate }) }
  }
  return data ? <Dashboard data={data} mode={mode} setMode={setMode} onReset={() => setData(null)} reduce={reduce} /> : <Landing {...{ birthDate, setBirthDate, state, setState, notice, reveal }} />
}

function Landing({ birthDate, setBirthDate, state, setState, notice, reveal }) {
  return <main className="landing"><header className="masthead"><span>TIME CAPSULE</span><span>INDIA EDITION</span></header><section className="hero" aria-labelledby="headline"><div className="stamp" aria-hidden="true">YEAR<br />ZERO</div><div className="intro"><p className="kicker">Open the box</p><h1 id="headline">What was the world like when <em>you</em> arrived?</h1><p>Movies, music, headlines and sporting glory — filed by your exact birth date.</p></div><form className="catalogue" onSubmit={reveal}><label htmlFor="birth-date">Your birth date</label><input id="birth-date" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} min="1950-01-01" max={new Date().toISOString().slice(0, 10)} required /><label htmlFor="state">Your home state</label><select id="state" value={state} onChange={e => setState(e.target.value)}>{states.map(item => <option key={item}>{item}</option>)}</select>{notice && <p className="error" role="alert">{notice}</p>}<button type="submit">Crack it open</button></form></section><footer>Built from public records, with a soft spot for the good stuff.</footer></main>
}

function Dashboard({ data, mode, setMode, onReset, reduce }) {
  const content = mode === 'regional' ? (data.selectedState === 'Kerala' ? data.regional : data.india || data.regional) : data.international
  const sparse = data.dataConfidence !== 'full' || (mode === 'regional' && data.selectedState !== 'Kerala')
  return <main className={`dashboard ${mode}`}><header className="dashboard-head"><button className="wordmark" onClick={onReset}>TIME CAPSULE</button><button className="back" onClick={onReset}>Start over</button></header><AnimatePresence mode="wait"><motion.div key={`${data.year}-${mode}`} initial={reduce ? false : { scale: .75, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 17 }}><section className="year-banner"><span>Filed under</span><strong>{data.year}</strong><p>{formatBirthday(data.birthDate)} · {mode === 'regional' ? data.selectedState : 'International edition'}</p></section><div className="mode-switch" role="group" aria-label="Content region"><button className={mode === 'regional' ? 'active' : ''} onClick={() => setMode('regional')}>Regional</button><button className={mode === 'international' ? 'active' : ''} onClick={() => setMode('international')}>International</button></div>{sparse && <p className="digging">We’re still digging up {data.year}’s records — here’s what we’ve got so far{mode === 'regional' && data.selectedState !== 'Kerala' ? ` for ${data.selectedState}. India-wide highlights fill the capsule meanwhile` : ''}.</p>}<section className="capsule-grid"><MovieStrip items={content.movies} /><MusicShelf items={content.music} /><Scoreboard items={content.sports} /><ClippingStrip items={content.events} /></section><ShareCard data={data} mode={mode} content={content} /></motion.div></AnimatePresence><footer className="credits">Movies: TMDb. Historical event summaries: Wikipedia, CC BY-SA. Listen/watch links open YouTube search in a new tab. TMDb data is not endorsed or certified by TMDb.</footer></main>
}

function MovieStrip({ items = [] }) { return <section className="movies section"><h2>Movies</h2><div className="tickets">{items.map((x, i) => <article className="ticket" key={`${x.title}-${i}`}>{x.posterUrl && <img src={x.posterUrl} alt={`${x.title} poster`} loading="lazy" />}<span>ADMIT ONE</span><strong>{x.title}</strong><small>{x.language || 'Cinema'}</small>{x.watchUrl && <a href={x.watchUrl} target="_blank" rel="noreferrer">Watch trailer</a>}</article>)}</div></section> }
function MusicShelf({ items = [] }) { return <section className="music section"><h2>Music</h2><div className="records">{items.map((x, i) => <article className="record" key={`${x.title}-${i}`}><span>{i + 1}</span><strong>{x.title}</strong><small>{x.artist}</small>{x.playUrl && <a href={x.playUrl} target="_blank" rel="noreferrer">Listen free</a>}</article>)}</div></section> }
function Scoreboard({ items = [] }) { return <section className="sports section"><h2>Sports</h2>{items.map((x, i) => <article className="score" key={i}><strong>{x.headline}</strong><span>{x.detail}</span>{x.videoUrl && <a href={x.videoUrl} target="_blank" rel="noreferrer">Watch highlights</a>}</article>)}</section> }
function ClippingStrip({ items = [] }) { return <section className="events section"><h2>Big events</h2>{items.map((x, i) => <article className="clipping" key={i}><strong>{x.headline}</strong><p>{x.detail}</p>{x.sourceUrl && <a href={x.sourceUrl} target="_blank" rel="noreferrer">Read the record</a>}</article>)}</section> }
function formatBirthday(value) { return value ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${value}T12:00:00`)) : 'A date worth filing' }

function ShareCard({ data, mode, content }) {
  const ref = useRef(null)
  async function download() { try { await document.fonts?.ready; const url = await toPng(ref.current, { pixelRatio: 3, cacheBust: true, width: 1080, height: 1080, style: { width: '1080px', height: '1080px', maxWidth: 'none', padding: '92px', borderWidth: '10px', boxShadow: '20px 20px #1c1b19' } }); const link = document.createElement('a'); link.download = `my-time-capsule-${data.birthDate || data.year}.png`; link.href = url; document.body.appendChild(link); link.click(); link.remove() } catch { alert('The card could not be exported. Please try again after the page finishes loading.') } }
  return <section className="share-wrap"><div className="share-card" ref={ref}><span>TIME CAPSULE · {formatBirthday(data.birthDate)}</span><strong>I arrived in {data.year}</strong><p>{mode === 'regional' ? data.selectedState : 'The world'} was watching <b>{content.movies[0]?.title}</b>, listening to <b>{content.music[0]?.title}</b>, and making headlines.</p><div className="card-stamp">ARCHIVE<br />OPENED</div><i>Open the box. Keep the story.</i></div><button className="download" onClick={download}>Download your capsule card</button></section>
}

createRoot(document.getElementById('root')).render(<App />)
