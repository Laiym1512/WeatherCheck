import { useState, useEffect } from 'react'
import styles from './Home.module.scss'
import cloudIcon from '../image/cloud.svg'
import rainIcon from '../image/rain.svg'

// OpenWeatherMap's Current Weather Data endpoint — the free-tier one, not
// One Call (which needs a separate paid subscription). Get a key at
// https://openweathermap.org/appid; new keys can take up to ~2 hours to
// activate. Put it in .env as VITE_OPENWEATHER_API_KEY (see .env.example).
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const OPENWEATHER_URL = 'https://api.openweathermap.org/data/2.5/weather'
const INITIAL_HISTORY = []
const TODAY_STORAGE_KEY = 'weatherToday'
const HISTORY_STORAGE_KEY = 'weatherSearchHistory'
// Placeholder data matching the mockup — used as the initial state until a
// real search replaces it via handleSubmit below.
const DEFAULT_TODAY = {
}
// Maps a weather API "condition" string (OpenWeatherMap's `weather[0].main`
// uses values like "Clear", "Clouds", "Rain", "Drizzle", "Thunderstorm",
// "Snow", "Mist"/"Fog"/"Haze", ...) down to one of the three icon variants
// this page knows how to draw. Matching on substrings rather than an exact
// list keeps it working across providers/casing without a giant lookup table.
function getWeatherVariant(condition, cloudPercent = 0) {
  const normalized = (condition ?? '').toLowerCase()

  if (/rain|drizzle|thunderstorm|storm/.test(normalized)) {
    return 'rainy'
  }
  // Treat "Clear" and low cloud cover (few clouds, e.g. 0–20%) as sunny —
  // OpenWeatherMap only labels it "Clear" at exactly 0%, so text alone
  // misses days like New York's "few clouds" / 16% here.
  if (/clear|sun/.test(normalized) || cloudPercent < 20) {
    return 'sunny'
  }
  return 'cloudy'
}


function SearchIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="16.65" y1="16.65" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7h16M9 7V4h6v3m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"
      />
    </svg>
  )
} 

function loadToday() {
  try {
    const raw = localStorage.getItem(TODAY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY)
    return raw ? JSON.parse(raw) : INITIAL_HISTORY
  } catch {
    // Corrupted or unavailable storage — fall back to the placeholder list
    // rather than crashing the page.
    return INITIAL_HISTORY
  }
}


// Matches the mockup's "01-09-2022 09:41am" format (DD-MM-YYYY, 12h clock).
function formatDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  const day = pad(date.getDate())
  const month = pad(date.getMonth() + 1)
  const year = date.getFullYear()
  const hours24 = date.getHours()
  const minutes = pad(date.getMinutes())
  const suffix = hours24 >= 12 ? 'pm' : 'am'
  const hours12 = hours24 % 12 || 12
  return `${day}-${month}-${year} ${pad(hours12)}:${minutes}${suffix}`
}

function Home() {
  const [country, setCountry] = useState('')
  const [history, setHistory] = useState(loadHistory)
  const [today, settoday] = useState(() => loadToday() ?? DEFAULT_TODAY)
  const [status, setStatus] = useState('idle') // idle | loading | error
  const [error, setError] = useState(null)
  const [hasResult, setHasResult] = useState(() => loadToday() !== null)
  // Recomputed from today.condition — once this is wired to a real API
  // response, this line doesn't need to change, only today.condition does.
  const weatherVariant = getWeatherVariant(today.condition, today.cloudPercent)

  const searchWeather = async (query) => {
    const trimmed = query.trim()
    if (!trimmed) return

    if (!OPENWEATHER_API_KEY) {
      setStatus('error')
      setError('Missing VITE_OPENWEATHER_API_KEY — see .env.example.')
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const url = `${OPENWEATHER_URL}?q=${encodeURIComponent(trimmed)}&appid=${OPENWEATHER_API_KEY}&units=metric`
      const res = await fetch(url)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        const code = data?.cod ?? res.status
        const reason = data?.message ?? `Request failed (${res.status})`
        throw new Error(`${code}: ${reason}`)
      }

      const data = await res.json()
      const now = formatDate(new Date())

      const nexttoday = {
        temp: Math.round(data.main.temp),
        high: Math.round(data.main.temp_max),
        low: Math.round(data.main.temp_min),
        location: `${data.name}, ${data.sys.country}`,
        date: now,
        humidity: data.main.humidity,
        condition: data.weather?.[0]?.main ?? 'Clouds',
        cloudPercent: data.clouds?.all ?? 0,
      }

      settoday(nexttoday)
      setHasResult(true)
      setHistory((prev) => [
        { id: `${nexttoday.location}-${Date.now()}`, location: nexttoday.location, date: now },
        ...prev,
      ])
      setStatus('idle')
    } catch (err) {
      setStatus('error')
      setError(err.message)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    searchWeather(country)
  }

  const handleDelete = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  useEffect(() => {
    if (hasResult) {
      localStorage.setItem(TODAY_STORAGE_KEY, JSON.stringify(today))
    }
  }, [today, hasResult])

  useEffect(() => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history))
  }, [history])
    

  return (  
  <div>
      <form className={styles.searchBar} onSubmit={handleSubmit}>
        <label className={styles.searchField}>
          <span className={styles.searchLabel}>Country</span>
          <input
            type="text"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
            className={styles.searchInput}
          />
        </label>
        <button type="submit" className={styles.searchButton} aria-label="Search">
          <SearchIcon className={styles.searchButtonIcon} />
        </button>
      </form>
      {status === 'error' && (
        <div className={styles.ErrorBox}>{error}</div>
      )}
      {status === 'loading' && (
        <div className={styles.loadingbg}>
            <div className={styles.spinner} role="status" aria-label="Loading weather data" />
        </div>
      )}
      <div className={styles.page} style={{ display: hasResult ? 'block' : 'none' }}>
        <section className={styles.todayCard}>
                    <div
                      className={styles.weatherGlyph}
                      style={{ display: weatherVariant === 'sunny' ? 'block' : 'none' }}
                    >
                      <div className={`${styles.sun} sun`}>
                        <div className="ray_box">
                          <div className="ray ray1"></div>
                          <div className="ray ray2"></div>
                          <div className="ray ray3"></div>
                          <div className="ray ray4"></div>
                          <div className="ray ray5"></div>
                          <div className="ray ray6"></div>
                          <div className="ray ray7"></div>
                          <div className="ray ray8"></div>
                          <div className="ray ray9"></div>
                          <div className="ray ray10"></div>
                        </div>
                      </div>
                      <div className={styles.cloud}>
                        <img src={cloudIcon} alt="" />
                      </div>
                    </div>
                    <div
                      className={styles.weatherGlyph}
                      style={{ display: weatherVariant === 'rainy' ? 'block' : 'none' }}
                    >
                      <div className={styles.cloud}>
                        <img src={cloudIcon} alt="" />
                      </div>
                      <div className={styles.rain}>
                        <img src={rainIcon} alt="" />
                      </div>
                    </div>
                    <div
                      className={styles.weatherGlyph}
                      style={{ display: weatherVariant === 'cloudy' ? 'block' : 'none' }}
                    >
                      <div className={styles.cloud}>
                        <img src={cloudIcon} alt="" />
                      </div>
                    </div>
            <h2 className={styles.todayTitle}>Today&apos;s Weather</h2>
            <div className='row'>
              <div className="col-md-3 col-sm-5 col-5">
                <p className={styles.temp}>{today.temp}°</p>
                <p className={styles.range}>
                      H: {today.high}° L: {today.low}°
                </p>
                <div className={styles.metaLocation}>{today.location}</div>
              </div>
              <div className="col-md-9 col-sm-7 col-7">
                <div className={styles.meta}>
                    <div className={styles.metaCondition}>{today.condition}</div>
                    <div className={styles.metaHumidity}>Humidity: {today.humidity}%</div>
                    <div className={styles.metaDate}>{today.date}</div>
                 </div>
              </div>
            </div>
        </section>

        <section className={styles.historyCard}>
            <h3 className={styles.historyTitle}>Search History</h3>
            <ul className={styles.historyList}>
                  {history.map((item) => (
                    <li key={item.id} className={styles.historyItem}>
                      <div className='row'>
                        <div className={`${styles.historyLocation} col-md-6 col-sm-6 col-12`}>{item.location}</div>
                        <div className={`${styles.historyDate} col-md-6 col-sm-6 col-12`}>{item.date}</div>
                      </div>
                      <div className={styles.historyActions}>
                        <button
                          type="button"
                          className={styles.historyButton}
                          aria-label={`Search again for ${item.location}`}
                          onClick={() => {
                            setCountry(item.location)
                            searchWeather(item.location)
                          }}
                        >
                          <SearchIcon className={styles.historyIcon} />
                        </button>
                        <button
                          type="button"
                          className={styles.historyButton}
                          aria-label={`Remove ${item.location} from history`}
                          onClick={() => handleDelete(item.id)}
                        >
                          <TrashIcon className={styles.historyIcon} />
                        </button>
                      </div>
                    </li>
                  ))}
                  {history.length === 0 && <li className={styles.historyEmpty}>No searches yet.</li>}
            </ul>
        </section>
      </div>
    </div>
  )
}

export default Home
