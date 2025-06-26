import { useEffect } from 'react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './AdminPage.css'; // Optional CSS for styling the table

function AdminPage() {
  const [selectedGames, setSelectedGames] = useState([]);

  const [searchParams, setSearchParams] = useSearchParams();
  const [hasInitialized, setHasInitialized] = useState(false);

  const [year, setYear] = useState(searchParams.get('year') || '2025');
  const [week, setWeek] = useState(searchParams.get('week') || '1');
  const [games, setGames] = useState([]);
  const [statusMsg, setStatusMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultSource, setResultSource] = useState(null);

  // Sorting state
  const [sortKey, setSortKey] = useState('startDate');
  const [sortDirection, setSortDirection] = useState('asc');

  // Filtering state
  const [conferenceFilter, setConferenceFilter] = useState('');
  const [classificationFilter, setClassificationFilter] = useState('');

  // Scroll to top button state
  const [showScrollButton, setShowScrollButton] = useState(false);

  console.log('year updated:', year);

  useEffect(() => {
    const handleScroll = () => {
      console.log('ScrollY:', window.scrollY);
      setShowScrollButton(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update year and week from search params when they change
  useEffect(() => {
    if (!hasInitialized) {
      const yearParam = searchParams.get('year');
      const weekParam = searchParams.get('week');

      if (yearParam && weekParam) {
        setYear(prev => prev !== yearParam ? yearParam : prev);
        setWeek(prev => prev !== weekParam ? weekParam : prev);
        fetchScores(); // load scores from cache/API
      }

      setHasInitialized(true); // mark init done
    }
  }, [hasInitialized, searchParams]);

  // Load the slate whenever the games change
  useEffect(() => {
    if (games.length > 0) {
      loadSlate();
    }
  }, [games]);

  // Handle sorting when a column header is clicked
  const handleSort = (key) => {
    if (key === sortKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleYearChange = (val) => {
    setYear(val);
    searchParams.set('year', val);
    setSearchParams(searchParams);
  };

  const handleWeekChange = (val) => {
    setWeek(val);
    searchParams.set('week', val);
    setSearchParams(searchParams);
  };

  // Fetch scores from the API
  const fetchScores = async ({ refresh = false } = {}) => {
    setLoading(true);
    setStatusMsg('Fetching games...');
    try {
      const response = await fetch(`/api/fetch-scores?year=${year}&week=${week}&refresh=${refresh}`);
      const data = await response.json();
      setGames(data.games || []);
      setSortKey('startDate'); // Reset sort to date
      setSortDirection('asc'); // Reset sort direction  
      setSelectedGames([]); // Clear selected games on new fetch
      setStatusMsg(`✅ Fetched ${data.games?.length || 0} games · Last refreshed ${getRelativeTime(data.timestamp)}`);
    } catch (err) {
      console.error(err);
      setStatusMsg('Error fetching games.');
    } finally {
      setLoading(false);
    }
  };

  // Load the slate when the component mounts or when new scores are fetched
  const loadSlate = async () => {
    try {
      const response = await fetch(`/api/load-pickem?year=${year}&week=${week}`);
      const data = await response.json();

      if (!Array.isArray(data.selectedGames)) {
        setSelectedGames([]);
        console.log('No slate found for this week.');
        return;
      }

      const fetchedIds = new Set(games.map(g => g.id));
      const validGames = data.selectedGames.filter(g => fetchedIds.has(g.id));

      setSelectedGames(validGames);
      console.log(`Loaded ${validGames.length} valid saved games from slate.`);
    } catch (err) {
      console.error('Error loading slate:', err);
    }
  };

  // Save the current slate of selected games
  const saveSlate = async () => {
    try {
      const response = await fetch('/api/save-pickem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year,
          week,
          selectedGames: selectedGames.map(({ id, homeTeam, awayTeam, startDate, homeSpread, awaySpread, overUnder }) => ({
            id,
            homeTeam,
            awayTeam,
            startDate,
            homeSpread,
            awaySpread,
            overUnder,
          }))
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('Slate saved successfully!');
      } else {
        alert('Failed to save slate.');
      }
    } catch (err) {
      console.error('Error saving slate:', err);
      alert('Unexpected error saving slate.');
    }
  };


  // Sorting
  const sortedGames = [...games].sort((a, b) => {
    const aVal = a[sortKey] || '';
    const bVal = b[sortKey] || '';
    if (typeof aVal === 'string') {
      return sortDirection === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  // Filtering
  const filteredGames = sortedGames.filter((game) => {
    const homeConf = game.homeConference || '';
    const awayConf = game.awayConference || '';
    const homeClass = game.homeClassification || '';
    const awayClass = game.awayClassification || '';

    const matchesConf =
      !conferenceFilter || homeConf === conferenceFilter || awayConf === conferenceFilter;

    const matchesClass =
      !classificationFilter || homeClass === classificationFilter || awayClass === classificationFilter;

    return matchesConf && matchesClass;
  });

  // Function to get a pretty formatted time string
  function formatTimestamp(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Function to get relative time from a past ISO date
  function getRelativeTime(pastISO) {
    const now = new Date();
    const past = new Date(pastISO);
    const diff = now - past; // in ms

    if (isNaN(diff)) return 'Invalid date';

    const MINUTE = 60 * 1000;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;

    const parts = [];

    const units = [
      { label: 'year', value: Math.floor(diff / YEAR) },
      { label: 'month', value: Math.floor((diff % YEAR) / MONTH) },
      { label: 'day', value: Math.floor((diff % MONTH) / DAY) },
      { label: 'hour', value: Math.floor((diff % DAY) / HOUR) },
      { label: 'minute', value: Math.floor((diff % HOUR) / MINUTE) },
      { label: 'second', value: Math.floor((diff % MINUTE) / 1000) },
    ];

    for (const unit of units) {
      if (unit.value > 0) {
        parts.push(`${unit.value} ${unit.label}${unit.value !== 1 ? 's' : ''}`);
      }
    }

    return parts.length > 0 ? parts.slice(0, 3).join(' ') + ' ago' : 'just now';
  }


  // *****************************************************************
  // Render the AdminPage component
  // This component allows admins to fetch and manage weekly games
  // *****************************************************************
  return (


    <section className="admin-page">

      <div className="admin-panels">

        {/* Fetch panel for importing weekly games */}
        <div className="fetch-panel">
          <h2>Import Weekly Games</h2>

          {/*  Filters for year, week, and conference */}
          <div className="filters-row">
            <label>Year:</label>
            <input
              type="number"
              value={year}
              onChange={(e) => handleYearChange(e.target.value)}
            />

            {/*
            <label>Week:</label>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              list="week-marks"
              value={week}
              onChange={(e) => handleWeekChange(e.target.value)}
              style={{ width: '160px' }}
            />
            <datalist id="week-marks">
              {[...Array(15)].map((_, i) => (
                <option key={i} value={i + 1} label={`${i + 1}`} />
              ))}
            </datalist>
            <span className="week-display">Week {week}</span>
*/}

            <label>Week:</label>
            <input type="number" value={week} onChange={(e) => handleWeekChange(e.target.value)} />

            <button onClick={() => fetchScores()} disabled={loading}>
              {loading ? 'Fetching...' : 'Fetch Scores'}
            </button>

            <button onClick={() => fetchScores({ refresh: true })} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh Scores'}
            </button>


            <div className="filter-conference">
              <label>Filter by Conference:</label>
              <select value={conferenceFilter} onChange={(e) => setConferenceFilter(e.target.value)}>
                <option value="">All</option>
                <option value="Big Ten">Big Ten</option>
                <option value="SEC">SEC</option>
                <option value="Big 12">Big 12</option>
                <option value="Pac-12">Pac-12</option>
                <option value="ACC">ACC</option>
                {/* Add more as needed */}
              </select>
            </div>

          </div>

          {/* Status message for fetch operation */}
          <p>{statusMsg} {resultSource && (
            <small style={{ color: resultSource === 'cache' ? 'gray' : 'green' }}>
              Results loaded from {resultSource === 'cache' ? 'cache' : 'live API'}.
            </small>
          )}
          </p>

          {/* Table to display fetched games */}
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th onClick={() => handleSort('startDate')}>Date</th>
                <th>Time</th>
                <th onClick={() => handleSort('homeTeam')}>Home</th>
                <th onClick={() => handleSort('homeConference')}>Home conference</th>
                <th>Pts</th>
                <th onClick={() => handleSort('awayTeam')}>Away</th>
                <th onClick={() => handleSort('awayConference')}>Away conference</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {filteredGames.map((game) => {
                const kickoff = game.startDate ? new Date(game.startDate) : null;
                const date = kickoff
                  ? kickoff.toLocaleDateString('en-US', { timeZone: 'America/New_York' })
                  : 'TBD';
                const time = kickoff
                  ? kickoff.toLocaleTimeString('en-US', {
                    timeZone: 'America/New_York',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  : 'TBD';

                return (
                  <tr key={game.id} className={selectedGames.some(g => g.id === game.id) ? 'selected-row' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedGames.some(g => g.id === game.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          const isAlreadySelected = selectedGames.some(g => g.id === game.id);

                          if (isChecked && selectedGames.length >= 10 && !isAlreadySelected) {
                            alert('You can only select up to 10 games for Pick\'em.');
                            return;
                          }

                          if (isChecked) {
                            setSelectedGames([...selectedGames, game]);
                          } else {
                            setSelectedGames(selectedGames.filter(g => g.id !== game.id));
                          }
                        }}

                      />
                    </td>
                    <td>{date}</td>
                    <td>{time}</td>
                    <td>{game.homeTeam}</td>
                    <td>{game.homeConference}</td>
                    <td>{game.homePoints ?? '-'}</td>
                    <td>{game.awayTeam}</td>
                    <td>{game.awayConference}</td>
                    <td>{game.awayPoints ?? '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>


        <div className="pickem-panel">

          <h3>Selected for Pick’em ({selectedGames.length})</h3>
          {selectedGames.length === 0 ? (
            <p>No games selected yet.</p>
          ) : (
            <ul>
              {selectedGames.map(game => (
                <li key={game.id}>
                  {game.awayTeam} @ {game.homeTeam} ({new Date(game.startDate).toLocaleDateString('en-US')})
                </li>
              ))}
            </ul>
          )}

          {/* Button to clear all selected games */}
          <button
            onClick={async () => {
              setSelectedGames([]);

              try {
                const res = await fetch(`/api/delete-pickem?year=${year}&week=${week}`, {
                  method: 'DELETE'
                });

                const result = await res.json();
                if (result.success) {
                  console.log('Slate deleted from server.');
                } else {
                  console.warn('Could not delete slate:', result.error);
                }
              } catch (err) {
                console.error('Error deleting slate:', err);
              }
            }}
          >
            Clear All
          </button>

          {/* Save button to save selected games as a Pick'em slate */}
          <button onClick={saveSlate} disabled={selectedGames.length === 0}>
            Save Pick’em Slate
          </button>

          {/* Button to scroll to top of the page */}
          {showScrollButton && (
            <button className="scroll-to-top-in-panel" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              ↑ Back to Top
            </button>
          )}

        </div>
      </div>
    </section >
  );
}

export default AdminPage;
// AdminPage.jsx