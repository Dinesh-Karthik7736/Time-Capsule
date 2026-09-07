import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { toPng } from 'html-to-image'
import './styles.css'

const now = new Date().getFullYear()
const states = ['Kerala', 'Tamil Nadu', 'Karnataka', 'Maharashtra', 'West Bengal', 'Delhi', 'Other']
const fallback = {
  movies: [{ title: 'India on the big screen', language: 'India-wide' }],
  music: [{ title: 'The songs everyone had on repeat', artist: 'India-wide soundtrack' }],
  sports: [{ headline: 'A year worth remembering', detail: 'India-wide sporting highlights are being catalogued.' }],
  events: [{ headline: 'The country in motion', detail: 'We are still filing the headlines for this state.' }]
}

function App() {
  const [year, setYear] = useState('1998')
  const [state, setState] = useState('Kerala')
  const [data, setData] = useState(null)
  const [mode, setMode] = useState('regional')
  const [notice, setNotice] = useState('')
  const shouldReduceMotion = useReducedMotion()

  async function reveal(event) {
    event.preventDefault()
    const value = Number(year)
    if (!Number.isInteger(value) || value < 1950 || value > now) {
      setNotice(`Choose a year from 1950 to ${now}.`)
      return
    }
    setNotice('')
    try {
      const response = await fetch(`/data/years/${value}.json`)
      if (!response.ok) throw new Error('Not curated yet')
      const found = await response.json()
      setData({ ...found, selectedState: state })
    } catch {
      setData({ year: value, regional: fallback, international: fallback, dataConfidence: 'sparse', selectedState: state })
    }
  }

  return data ? <Dashboard data={data} mode={mode} setMode={setMode} onReset={() => setData(null)} reduce={shouldReduceMotion} /> : (
    <main className="landing">
      <header className="masthead"><span>TIME CAPSULE</span><span>INDIA EDITION</span></header>
      <section className="hero" aria-labelledby="headline">
        <div className="stamp" aria-hidden="true">YEAR<br />ZERO</div>
        <div className="intro"><p className="kicker">Open the box</p><h1 id="headline">What was the world like when <em>you</em> arrived?</h1><p>Movies, music, headlines and sporting glory — filed by birth year.</p></div>
        <form className="catalogue" onSubmit={reveal}>
          <label htmlFor="year">Year of birth</label>
          <input id="year" value={year} onChange={e => setYear(e.target.value)} inputMode="numeric" min="1950" max={now} required />
          <label htmlFor="state">Your home state</label>
          <select id="state" value={state} onChange={e => setState(e.target.value)}>{states.map(item => <option key={item}>{item}</option>)}</select>
          {notice && <p className="error" role="alert">{notice}</p>}
          <button type="submit">Crack it open</button>
        </form>
      </section>
      <footer>Built from public records, with a soft spot for the good stuff.</footer>
    </main>
  )
}

function Dashboard({ data, mode, setMode, onReset, reduce }) {
  const content = mode === 'regional' && data.selectedState !== 'Kerala' ? { ...data.regional, ...fallback } : data[mode]
  const sparse = data.dataConfidence !== 'full' || (mode === 'regional' && data.selectedState !== 'Kerala')
  return <main className={`dashboard ${mode}`}>
    <header className="dashboard-head"><button className="wordmark" onClick={onReset}>TIME CAPSULE</button><button className="back" onClick={onReset}>Start over</button></header>
    <AnimatePresence mode="wait">
      <motion.div key={`${data.year}-${mode}`} initial={reduce ? false : { scale: .75, rotate: -4, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 17 }}>
        <section className="year-banner"><span>Filed under</span><strong>{data.year}</strong><p>{mode === 'regional' ? data.selectedState : 'International edition'}</p></section>
        <div className="mode-switch" role="group" aria-label="Content region"><button className={mode === 'regional' ? 'active' : ''} onClick={() => setMode('regional')}>Regional</button><button className={mode === 'international' ? 'active' : ''} onClick={() => setMode('international')}>International</button></div>
        {sparse && <p className="digging">We’re still digging up {data.year}’s records — here’s what we’ve got so far{mode === 'regional' && data.selectedState !== 'Kerala' ? ` for ${data.selectedState}` : ''}.</p>}
        <section className="capsule-grid">
          <MovieStrip items={content.movies} /><MusicShelf items={content.music} /><Scoreboard items={content.sports} /><ClippingStrip items={content.events} />
        </section>
        <ShareCard data={data} mode={mode} content={content} />
      </motion.div>
    </AnimatePresence>
    <footer className="credits">Made from curated public records. Wikipedia content is CC BY-SA. TMDb data is used under its terms and is not endorsed or certified by TMDb.</footer>
  </main>
}

function MovieStrip({ items }) { return <section className="movies section"><h2>Movies</h2><div className="tickets">{items.map((x, i) => <article className="ticket" key={`${x.title}-${i}`}><span>ADMIT ONE</span><strong>{x.title}</strong><small>{x.language || 'Cinema'}</small></article>)}</div></section> }
function MusicShelf({ items }) { return <section className="music section"><h2>Music</h2><div className="records">{items.map((x, i) => <article className="record" key={`${x.title}-${i}`}><span>{i + 1}</span><strong>{x.title}</strong><small>{x.artist}</small></article>)}</div></section> }
function Scoreboard({ items }) { return <section className="sports section"><h2>Sports</h2>{items.map((x, i) => <article className="score" key={i}><strong>{x.headline}</strong><span>{x.detail}</span></article>)}</section> }
function ClippingStrip({ items }) { return <section className="events section"><h2>Big events</h2>{items.map((x, i) => <article className="clipping" key={i}><strong>{x.headline}</strong><p>{x.detail}</p></article>)}</section> }

function ShareCard({ data, mode, content }) {
  const ref = useRef(null)
  async function download() {
    const url = await toPng(ref.current, { pixelRatio: 2 })
    const link = document.createElement('a'); link.download = `timecapsule-${data.year}.png`; link.href = url; link.click()
  }
  return <section className="share-wrap"><div className="share-card" ref={ref}><span>TIME CAPSULE</span><strong>I arrived in {data.year}</strong><p>{mode === 'regional' ? data.selectedState : 'The world'} was watching <b>{content.movies[0]?.title}</b>, listening to <b>{content.music[0]?.title}</b>, and making headlines.</p></div><button className="download" onClick={download}>Download your capsule card</button></section>
}

createRoot(document.getElementById('root')).render(<App />)
