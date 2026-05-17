// Feeding log — bottle, breast, solids, water
const FEED_DEFAULTS = [
  { type: "Milk" },  { type: "Solid" }, { type: "Milk" },
  { type: "Solid" }, { type: "Milk" },  { type: "Solid" }, { type: "Milk" },
];

function FeedingSection() {
  const { FInput, FSelect, FCheck, useField } = window;
  const [extraRows, setExtraRows] = useField("feed.extraRows", 0);
  const rowCount = FEED_DEFAULTS.length + Number(extraRows || 0);

  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="kicker">02 — Nourishment</div>
          <h2 className="display">Feeding</h2>
        </div>
        <p className="sub">Aim for ~24 oz of breastmilk or formula daily, plus 2–3 solid meals. Offer iron-rich foods (meat, lentils, fortified cereal) and a variety of textures. Water in an open or straw cup with meals — 4–8 oz total.</p>
      </header>

      <div className="feed-summary">
        <div className="stat">
          <FInput className="stat-num stat-input" field="feed.totals.milk" placeholder="—" />
          <div className="stat-lbl">Total milk (oz)</div>
        </div>
        <div className="stat">
          <FInput className="stat-num stat-input" field="feed.totals.solid" placeholder="—" />
          <div className="stat-lbl">Solid meals</div>
        </div>
        <div className="stat">
          <FInput className="stat-num stat-input" field="feed.totals.water" placeholder="—" />
          <div className="stat-lbl">Water (oz)</div>
        </div>
        <div className="stat">
          <FInput className="stat-num stat-input" field="feed.totals.new" placeholder="—" />
          <div className="stat-lbl">New foods tried</div>
        </div>
      </div>

      <table className="log-table">
        <thead>
          <tr>
            <th style={{ width: "14%" }}>Time</th>
            <th style={{ width: "16%" }}>Type</th>
            <th style={{ width: "18%" }}>Amount / portion</th>
            <th>Food, reaction, notes</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <tr key={i}>
              <td><FInput field={`feed.${i}.time`} placeholder="—:—" /></td>
              <td>
                <FSelect field={`feed.${i}.type`} defaultValue={FEED_DEFAULTS[i]?.type || "Milk"}>
                  <option>Milk</option>
                  <option>Breast</option>
                  <option>Solid</option>
                  <option>Snack</option>
                  <option>Water</option>
                </FSelect>
              </td>
              <td><FInput field={`feed.${i}.amount`} placeholder="oz / bites" /></td>
              <td><FInput field={`feed.${i}.notes`} placeholder="e.g. half an avocado, loved it" /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <button className="ghost-btn" onClick={() => setExtraRows(Number(extraRows || 0) + 1)}>+ add row</button>

      <div className="callout">
        <div className="callout-label">Allergens introduced (3-day rule)</div>
        <div className="allergen-grid">
          {["Egg", "Peanut", "Tree nuts", "Dairy", "Wheat", "Soy", "Fish", "Shellfish", "Sesame"].map((a) => (
            <label key={a} className="chip">
              <FCheck field={`feed.allergen.${a}`} /> <span>{a}</span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

window.FeedingSection = FeedingSection;
