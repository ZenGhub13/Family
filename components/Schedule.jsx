// Daily schedule — preset hourly template
const SCHEDULE = [
  { time: "8:00 AM",            activity: "Wake up",             note: "Gentle wake, diaper change, cuddles" },
  { time: "8:00 – 8:30 AM",     activity: "Breakfast",           note: "First meal, before milk" },
  { time: "9:00 – 9:30 AM",     activity: "Morning milk",        note: "" },
  { time: "9:30 – 11:00 AM",    activity: "Active play",         note: "Floor time, motor skills" },
  { time: "11:00 AM – 1:00 PM", activity: "Nap 1",               note: "2 hours" },
  { time: "1:00 – 1:30 PM",     activity: "Post-nap milk",       note: "" },
  { time: "1:30 – 2:00 PM",     activity: "Cereal lunch",        note: "" },
  { time: "2:00 – 4:00 PM",     activity: "Play & outdoor time", note: "Fresh air, stroller or yard" },
  { time: "4:00 – 5:00 PM",     activity: "Nap 2",               note: "1 hour" },
  { time: "5:00 – 5:30 PM",     activity: "Post-nap milk",       note: "" },
  { time: "5:30 – 6:00 PM",     activity: "Congee dinner",       note: "" },
  { time: "6:00 – 7:30 PM",     activity: "Bath & wind down",    note: "Lotion, massage, pajamas, books" },
  { time: "7:30 – 8:00 PM",     activity: "Bedtime milk",        note: "Dim lights, quiet voices" },
  { time: "8:30 PM",            activity: "Sleep",               note: "White noise on, room 68–72°F" },
];

function ScheduleSection() {
  const { FInput, useField } = window;
  return (
    <section className="card schedule">
      <header className="card-head">
        <div>
          <div className="kicker">01 — Rhythm</div>
          <h2 className="display">Today's schedule</h2>
        </div>
        <p className="sub">A predictable rhythm helps regulate sleep, hunger, and mood. Tick each block as it happens; jot any deviation in the margin.</p>
      </header>

      <ol className="sched-list">
        {SCHEDULE.map((row, i) => {
          const [done, setDone] = useField(`sched.${i}.done`, false);
          return (
            <li key={i} className={`sched-row ${done ? "is-done" : ""}`}>
              <button className="check" onClick={() => setDone(!done)} aria-label={`Mark ${row.activity} done`}>
                <span className="check-box">{done ? "✓" : ""}</span>
              </button>
              <div className="sched-time">{row.time}</div>
              <div className="sched-body">
                <div className="sched-act">{row.activity}</div>
                {row.note && <div className="sched-note">{row.note}</div>}
              </div>
              <FInput className="sched-actual" field={`sched.${i}.actual`} placeholder="actual / notes…" />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

window.ScheduleSection = ScheduleSection;
