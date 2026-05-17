// Mood & temperament tracker
const MOODS = [
  { key: "bright",   label: "Bright",   glyph: "◔" },
  { key: "calm",     label: "Calm",     glyph: "◐" },
  { key: "fussy",    label: "Fussy",    glyph: "◑" },
  { key: "tired",    label: "Tired",    glyph: "◓" },
  { key: "upset",    label: "Upset",    glyph: "●" },
];
const WINDOWS = ["Morning", "Midday", "Afternoon", "Evening"];

function MoodSection() {
  const { FInput, FCheck, useField } = window;

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="kicker">03 — Inner weather</div>
          <h2 className="display">Mood & temperament</h2>
        </div>
        <p className="sub">Babies cycle through states quickly. Naming what you observe — and what came before it — helps you spot patterns (overtiredness, hunger, teething, overstimulation) before the meltdown.</p>
      </header>

      <div className="mood-grid">
        {WINDOWS.map((w) => {
          const [pick, setPick] = useField(`mood.${w}.pick`, "");
          return (
            <div key={w} className="mood-cell">
              <div className="mood-label">{w}</div>
              <div className="mood-buttons">
                {MOODS.map((m) => (
                  <button
                    key={m.key}
                    className={`mood-btn ${pick === m.key ? "is-on" : ""}`}
                    onClick={() => setPick(pick === m.key ? "" : m.key)}
                  >
                    <span className="mood-glyph">{m.glyph}</span>
                    <span className="mood-name">{m.label}</span>
                  </button>
                ))}
              </div>
              <FInput className="mood-note" field={`mood.${w}.note`} placeholder="What was happening? Triggers, soothers…" />
            </div>
          );
        })}
      </div>

      <div className="two-col">
        <div className="mini-card">
          <div className="mini-label">Soothed by today</div>
          <div className="check-list">
            {["Babywearing", "Walks", "Music", "White noise", "Pacifier", "Swaddle/lovey", "Bath", "Outside", "Quiet room", "Nursing/bottle"].map((s) => (
              <label key={s} className="chip"><FCheck field={`mood.soothe.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
        </div>
        <div className="mini-card">
          <div className="mini-label">Possible signals</div>
          <div className="check-list">
            {["Tired cues", "Hunger cues", "Teething", "Overstimulated", "Growth spurt", "Separation", "Constipation", "Coming down with something"].map((s) => (
              <label key={s} className="chip"><FCheck field={`mood.signal.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

window.MoodSection = MoodSection;
