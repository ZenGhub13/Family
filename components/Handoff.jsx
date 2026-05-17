// Handoff log
function HandoffSection() {
  const { FInput, FTextarea, FCheck } = window;
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="kicker">07 — Handoff</div>
          <h2 className="display">Notes for the next caregiver</h2>
        </div>
        <p className="sub">A short, specific note saves the next person 30 minutes of figuring out. Include what worked, what didn't, and anything strange.</p>
      </header>

      <div className="handoff-grid">
        <div className="handoff-cell">
          <div className="handoff-label">Wins today</div>
          <FTextarea field="handoff.wins" placeholder="What surprised you? What clicked?" />
        </div>
        <div className="handoff-cell">
          <div className="handoff-label">Hard moments</div>
          <FTextarea field="handoff.hard" placeholder="Triggers, what helped, what to avoid…" />
        </div>
        <div className="handoff-cell">
          <div className="handoff-label">Heads up for tonight / tomorrow</div>
          <FTextarea field="handoff.tomorrow" placeholder="Wake-up time, low milk in fridge, dr appt, etc." />
        </div>
        <div className="handoff-cell">
          <div className="handoff-label">Questions for the pediatrician</div>
          <FTextarea field="handoff.peds" placeholder="Save these — bring to next visit." />
        </div>
      </div>

      <div className="two-col">
        <div className="mini-card">
          <div className="mini-label">Caregiver shifts</div>
          <table className="log-table compact">
            <thead><tr><th>From</th><th>To</th><th>Caregiver</th><th>Briefed by</th></tr></thead>
            <tbody>
              {[0, 1, 2].map((i) => (
                <tr key={i}>
                  <td><FInput field={`shift.${i}.from`} placeholder="—:—" /></td>
                  <td><FInput field={`shift.${i}.to`} placeholder="—:—" /></td>
                  <td><FInput field={`shift.${i}.who`} placeholder="name" /></td>
                  <td><FInput field={`shift.${i}.by`} placeholder="initials" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mini-card">
          <div className="mini-label">Parent self-care check</div>
          <div className="hint" style={{ marginBottom: 8 }}>You can't pour from an empty cup. Tick what you got today — and what you'll trade tomorrow.</div>
          <div className="check-list">
            {["Ate 3 meals", "Drank water", "10+ min outside", "Showered", "Moved my body", "Connected w/ partner", "5 min of quiet", "Asked for help"].map((s) => (
              <label key={s} className="chip"><FCheck field={`self.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

window.HandoffSection = HandoffSection;
