// Outdoor / reading / songs / play
function OutdoorReadingSection() {
  const { FInput, FCheck } = window;
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="kicker">05 — Outside & connection</div>
          <h2 className="display">Fresh air, books, songs</h2>
        </div>
        <p className="sub">Daily outdoor light supports circadian rhythm and vitamin D. Reading and singing — even for minutes — build vocabulary, attention, and bond. Aim for both, every day.</p>
      </header>

      <div className="three-col">
        <div className="mini-card">
          <div className="mini-label">Outdoor time</div>
          <div className="dur-row">
            <span className="dur-prefix">Total</span>
            <FInput className="dur-input" field="out.minutes" placeholder="0" /> <span className="unit">min</span>
          </div>
          <div className="check-list">
            {["Stroller walk", "Yard / park", "Carrier", "Sun on skin (≤15 min)", "Hat & SPF if sunny"].map((s) => (
              <label key={s} className="chip"><FCheck field={`out.activity.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
          <FInput className="mini-note" field="out.note" placeholder="Where did we go? What did Lucas notice?" />
        </div>

        <div className="mini-card">
          <div className="mini-label">Books read</div>
          <ol className="book-list">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i}>
                <span className="num">{i}.</span>
                <FInput field={`book.${i}`} placeholder="title" />
              </li>
            ))}
          </ol>
          <div className="hint">Aim for 3+ board books a day. Re-reads count — repetition is how language sticks.</div>
        </div>

        <div className="mini-card">
          <div className="mini-label">Songs & rhymes</div>
          <div className="check-list">
            {["Itsy Bitsy Spider", "Wheels on the Bus", "Twinkle Twinkle", "Pat-a-cake", "Row Row Row", "Family song", "Made-up song", "Music in another language"].map((s) => (
              <label key={s} className="chip"><FCheck field={`song.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
          <FInput className="mini-note" field="song.note" placeholder="A song that landed today…" />
        </div>
      </div>

      <div className="two-col">
        <div className="mini-card">
          <div className="mini-label">Tummy time & active play</div>
          <div className="dur-row">
            <span className="dur-prefix">Tummy time</span>
            <FInput className="dur-input" field="play.tummyMin" placeholder="0" /> <span className="unit">min</span>
          </div>
          <div className="check-list">
            {["Rolling practice", "Sitting practice", "Crawling / cruising", "Reaching for toys", "Cause & effect toys", "Mirror play", "Sensory bin", "Container play"].map((s) => (
              <label key={s} className="chip"><FCheck field={`play.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-label">Screens</div>
          <div className="hint" style={{ marginBottom: 8 }}>AAP guidance under 18 mo: only video calls with family. Replace solo screens with face-time, narration, and play.</div>
          <div className="check-list">
            {["No solo screens today", "Video call w/ family", "Background TV avoided"].map((s) => (
              <label key={s} className="chip"><FCheck field={`screens.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

window.OutdoorReadingSection = OutdoorReadingSection;
