// Developmental milestones — 6 to 12 months
const MILESTONES = {
  "Gross motor": [
    "Sits without support",
    "Rolls both directions",
    "Pushes up to hands & knees",
    "Crawls / scoots",
    "Pulls to stand",
    "Cruises along furniture",
    "Stands briefly unsupported",
    "First steps",
  ],
  "Fine motor": [
    "Transfers object hand to hand",
    "Rakes small objects",
    "Pincer grasp (thumb + finger)",
    "Bangs two objects together",
    "Drops & picks up on purpose",
    "Points with index finger",
    "Stacks two blocks",
    "Self-feeds finger foods",
  ],
  "Language": [
    "Babbles consonants (ba, da, ga)",
    "Responds to own name",
    "Understands 'no'",
    "Mimics sounds",
    "First word with meaning",
    "Says mama / dada specifically",
    "Waves bye-bye",
    "Follows simple 1-step request",
  ],
  "Social / cognitive": [
    "Shows stranger awareness",
    "Object permanence (looks for hidden toy)",
    "Plays peekaboo",
    "Shows preferred toys",
    "Imitates gestures",
    "Looks where you point",
    "Shares attention (joint focus)",
    "Shows affection",
  ],
};

function MilestonesSection() {
  const { FInput, FCheck } = window;
  return (
    <section className="card">
      <header className="card-head">
        <div>
          <div className="kicker">04 — Growth</div>
          <h2 className="display">Milestones (6–12 mo)</h2>
        </div>
        <p className="sub">Tick what you saw <em>today</em>. Milestones aren't a race — most babies hit each one across a wide window. Use this to celebrate, not to worry. If a domain is silent for weeks, raise it at the next pediatric visit.</p>
      </header>

      <div className="milestone-grid">
        {Object.entries(MILESTONES).map(([domain, items]) => (
          <div key={domain} className="milestone-col">
            <div className="milestone-head">{domain}</div>
            <ul className="milestone-list">
              {items.map((m) => (
                <li key={m}>
                  <label className="ms-row">
                    <FCheck field={`ms.${domain}.${m}`} />
                    <span>{m}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="callout">
        <div className="callout-label">First today</div>
        <FInput className="big-line" field="ms.firstToday" placeholder="Anything new — a sound, a step, a face, a food…" />
      </div>
    </section>
  );
}

window.MilestonesSection = MilestonesSection;
