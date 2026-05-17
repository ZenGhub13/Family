// Main app
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "density": "default",
  "dark": false,
  "babyName": "Lucas",
  "showSchedule": true,
  "showFeeding": true,
  "showMood": true,
  "showMilestones": true,
  "showOutdoor": true,
  "showMeds": true,
  "showHandoff": true
}/*EDITMODE-END*/;

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function Sheet() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const { FInput } = window;

  useEffect(() => {
    document.body.classList.toggle("is-dark", !!tweaks.dark);
    document.body.classList.remove("density-compact", "density-roomy");
    if (tweaks.density === "compact") document.body.classList.add("density-compact");
    if (tweaks.density === "roomy") document.body.classList.add("density-roomy");
  }, [tweaks.dark, tweaks.density]);

  const name = tweaks.babyName || "Lucas";

  return (
    <div className="page">
      <window.GithubSync />
      {/* Masthead */}
      <header className="masthead">
        <div>
          <div className="masthead-eyebrow">
            <span className="dot"></span>
            <span>The {name} Daily</span>
            <span>·</span>
            <span>Vol. 1</span>
            <span>·</span>
            <span>For the parents & caregivers of {name}</span>
          </div>
          <h1 className="masthead-title">{name} <span className="amp">&amp;</span> the day</h1>
          <p className="masthead-sub">A small, complete record — what we fed, what we noticed, what we'll need to remember tomorrow.</p>
        </div>
        <div className="masthead-meta">
          <div className="row"><span>Date</span><FInput field="meta.date" defaultValue={todayISO()} /></div>
          <div className="row"><span>Age today</span><FInput field="meta.age" placeholder="e.g. 9 months, 14 days" /></div>
          <div className="row"><span>Weather</span><FInput field="meta.weather" placeholder="sunny, 64°F" /></div>
          <div className="row"><span>Filed by</span><FInput field="meta.filedBy" placeholder="Mom / Dad / Nanny" /></div>
        </div>
      </header>

      {/* Top strip */}
      <div className="topstrip">
        <div className="topstrip-cell">
          <span className="topstrip-label">Wake</span>
          <FInput field="meta.wake" placeholder="—:—" />
        </div>
        <div className="topstrip-cell">
          <span className="topstrip-label">Last asleep</span>
          <FInput field="meta.lastAsleep" placeholder="—:—" />
        </div>
        <div className="topstrip-cell">
          <span className="topstrip-label">Mood, in a word</span>
          <FInput field="meta.moodWord" placeholder="bright, fussy…" />
        </div>
        <div className="topstrip-cell">
          <span className="topstrip-label">Word of the day</span>
          <FInput field="meta.wordOfDay" placeholder="a sound, sign, or first…" />
        </div>
      </div>

      {tweaks.showSchedule && <window.ScheduleSection />}
      {tweaks.showFeeding && <window.FeedingSection />}
      {tweaks.showMood && <window.MoodSection />}
      {tweaks.showMilestones && <window.MilestonesSection />}
      {tweaks.showOutdoor && <window.OutdoorReadingSection />}
      {tweaks.showMeds && <window.MedsSection />}
      {tweaks.showHandoff && <window.HandoffSection />}

      <div className="colophon">
        <span>The {name} Daily</span>
        <span>Print or save · One sheet, every day</span>
        <span>Made with care</span>
      </div>

      {/* Tweaks panel */}
      <window.TweaksPanel title="Tweaks">
        <window.TweakSection title="Look & feel">
          <window.TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={(v) => setTweak("density", v)}
            options={[
              { value: "compact", label: "Compact" },
              { value: "default", label: "Default" },
              { value: "roomy", label: "Roomy" },
            ]}
          />
          <window.TweakToggle
            label="Dark mode"
            value={tweaks.dark}
            onChange={(v) => setTweak("dark", v)}
          />
          <window.TweakText
            label="Baby's name"
            value={tweaks.babyName}
            onChange={(v) => setTweak("babyName", v)}
          />
        </window.TweakSection>

        <window.TweakSection title="Sections">
          <window.TweakToggle label="Today's schedule"  value={tweaks.showSchedule}   onChange={(v) => setTweak("showSchedule", v)} />
          <window.TweakToggle label="Feeding"           value={tweaks.showFeeding}    onChange={(v) => setTweak("showFeeding", v)} />
          <window.TweakToggle label="Mood"              value={tweaks.showMood}       onChange={(v) => setTweak("showMood", v)} />
          <window.TweakToggle label="Milestones"        value={tweaks.showMilestones} onChange={(v) => setTweak("showMilestones", v)} />
          <window.TweakToggle label="Outdoor & books"   value={tweaks.showOutdoor}    onChange={(v) => setTweak("showOutdoor", v)} />
          <window.TweakToggle label="Meds & health"     value={tweaks.showMeds}       onChange={(v) => setTweak("showMeds", v)} />
          <window.TweakToggle label="Handoff notes"     value={tweaks.showHandoff}    onChange={(v) => setTweak("showHandoff", v)} />
        </window.TweakSection>

        <window.TweakSection title="Output">
          <window.TweakButton label="Print today's sheet" onClick={() => window.print()} />
        </window.TweakSection>
      </window.TweaksPanel>
    </div>
  );
}

function App() {
  return (
    <window.FormProvider>
      <Sheet />
    </window.FormProvider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
