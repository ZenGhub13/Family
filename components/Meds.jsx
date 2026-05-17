// Medications, vitamins, health log
const MED_DEFAULTS = [
  { name: "Vitamin D drops", dose: "400 IU" },
  { name: "Iron (if prescribed)", dose: "" },
  { name: "", dose: "" },
  { name: "", dose: "" },
];

function MedsSection() {
  const { FInput, FCheck } = window;
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="kicker">06 — Health</div>
          <h2 className="display">Medications, vitamins, body</h2>
        </div>
        <p className="sub">Always log who gave what, when. Two-caregiver dosing accidents are common — checkmarks save you from doubling up.</p>
      </header>

      <table className="log-table">
        <thead>
          <tr>
            <th style={{ width: "30%" }}>Item</th>
            <th style={{ width: "16%" }}>Dose</th>
            <th style={{ width: "14%" }}>Time</th>
            <th style={{ width: "14%" }}>Given by</th>
            <th>Notes / reaction</th>
          </tr>
        </thead>
        <tbody>
          {MED_DEFAULTS.map((r, i) => (
            <tr key={i}>
              <td><FInput field={`med.${i}.name`} defaultValue={r.name} placeholder="medication or supplement" /></td>
              <td><FInput field={`med.${i}.dose`} defaultValue={r.dose} /></td>
              <td><FInput field={`med.${i}.time`} placeholder="—:—" /></td>
              <td><FInput field={`med.${i}.by`} placeholder="initials" /></td>
              <td><FInput field={`med.${i}.notes`} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="three-col">
        <div className="mini-card">
          <div className="mini-label">Body check</div>
          <div className="vital-row"><span>Temperature</span><FInput field="body.temp" placeholder="°F" /></div>
          <div className="vital-row"><span>Weight (if weighed)</span><FInput field="body.weight" placeholder="lb" /></div>
          <div className="vital-row"><span>Teeth count</span><FInput field="body.teeth" placeholder="#" /></div>
          <div className="check-list" style={{ marginTop: 8 }}>
            {["Diaper rash check", "Cradle cap check", "Nails trimmed/filed", "Gums wiped", "Teeth brushed (rice-grain fluoride)"].map((s) => (
              <label key={s} className="chip"><FCheck field={`body.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
        </div>

        <div className="mini-card">
          <div className="mini-label">Symptoms watch</div>
          <div className="check-list">
            {["Fever", "Cough", "Runny nose", "Rash", "Vomiting", "Loose stool", "Constipation", "Pulling ear", "Drooling++/teething"].map((s) => (
              <label key={s} className="chip"><FCheck field={`sym.${s}`} /> <span>{s}</span></label>
            ))}
          </div>
          <FInput className="mini-note" field="sym.note" placeholder="When started, what tried…" />
        </div>

        <div className="mini-card warn">
          <div className="mini-label">Call the pediatrician if</div>
          <ul className="warn-list">
            <li>Rectal temp ≥ 100.4°F (38°C)</li>
            <li>Fewer than 4 wet diapers in 24 h</li>
            <li>Refuses fluids for 8+ h</li>
            <li>Unusual lethargy or limpness</li>
            <li>Difficulty breathing or blue lips</li>
            <li>Persistent vomiting or bloody stool</li>
            <li>Inconsolable for 2+ hours</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

window.MedsSection = MedsSection;
