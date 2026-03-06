/**
 * ThisIsFine — 20 minute pure CSS arc
 * No "use client" needed. All timing via @keyframes.
 *
 * Arc:
 *   Act I   (0-3min)    — calm, everything is probably fine
 *   Act II  (3-7min)    — mild concern, denial, reassurance
 *   Act III (7-11min)   — fragmentation begins, cracks show
 *   Act IV  (11-15min)  — full chaos, fires everywhere
 *   Act V   (15-18min)  — acceptance, philosophical
 *   Finale  (18-20min)  — back to "this is fine 🔥", peaceful
 */

export function ThisIsFine() {
    const phrases: { text: string; dur: number }[] = [
  
      // ── ACT I: Everything is fine (0–3min = 180s) ──────────────────────────
      { text: "// this is fine 🔥",                                dur: 15 },
      { text: "// loading your data...",                            dur: 9  },
      { text: "// this is fine 🔥",                                dur: 12 },
      { text: "// neurons are computing",                           dur: 9  },
      { text: "// this is fine 🔥",                                dur: 15 },
      { text: "// perfectly normal server activity",               dur: 9  },
      { text: "// this is fine 🔥",                                dur: 12 },
      { text: "// checking the numbers...",                         dur: 9  },
      { text: "// this is fine 🔥",                                dur: 9  },
      { text: "// everything is under control",                     dur: 9  },
      { text: "// this is fine 🔥",                                dur: 12 },
      { text: "// fetching usage data",                             dur: 9  },
      { text: "// this is fine 🔥",                                dur: 15 },
      // 145s so far, pad to 180
      { text: "// almost there probably",                           dur: 9  },
      { text: "// this is fine 🔥",                                dur: 12 },
      { text: "// we have it totally under control",                dur: 9  },
      // ~175s
  
      // ── ACT II: Mild concern, denial (3–7min = 180s) ───────────────────────
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// running slightly hot",                            dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// surface temperature: elevated",                   dur: 7  },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// not a meltdown. definitely not a meltdown.",      dur: 9  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// floor is lava (metaphorically)",                  dur: 7  },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// checking thermals...",                            dur: 5  },
      { text: "// thermals: spicy",                                 dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// the server is sweating a little",                 dur: 7  },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// someone left the oven on",                        dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// it's not the oven. it's cloudflare.",             dur: 7  },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// too hot to handle (but we're handling it)",       dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// close to the sun. wings intact. probably.",       dur: 9  },
      // ~178s
  
      // ── ACT III: Fragmentation begins (7–11min = 240s) ────────────────────
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      { text: "// this is...",                                      dur: 4  },
      { text: "// fine 🔥",                                         dur: 3  },
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      { text: "// neurons are",                                     dur: 3  },
      { text: "// firing 🔥",                                       dur: 3  },
      { text: "// this is fine 🔥🔥",                               dur: 7  },
      { text: "// meltdown: not imminent",                          dur: 7  },
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      { text: "// meltdown: slightly imminent",                     dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 7  },
      { text: "// this",                                            dur: 2  },
      { text: "// is",                                              dur: 2  },
      { text: "// fine",                                            dur: 2  },
      { text: "// 🔥",                                              dur: 2  },
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      { text: "// volcanic activity: detected",                     dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 7  },
      { text: "// too many neurons, not enough sunscreen",          dur: 9  },
      { text: "// this is fine 🔥🔥🔥",                             dur: 7  },
      { text: "// fine 🔥🔥",                                       dur: 3  },
      { text: "// this is...",                                      dur: 3  },
      { text: "// fine 🔥🔥🔥",                                     dur: 3  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// we are not chill",                                dur: 7  },
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      { text: "// approaching critical temp",                       dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 7  },
      { text: "// icecaps are concerned",                           dur: 7  },
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      // ~218s
  
      // ── ACT IV: Full chaos (11–15min = 240s) ──────────────────────────────
      { text: "// this is fine 🔥🔥🔥🔥",                           dur: 9  },
      { text: "// fine 🔥🔥🔥",                                     dur: 3  },
      { text: "// this 🔥",                                         dur: 2  },
      { text: "// is 🔥🔥",                                         dur: 2  },
      { text: "// fine 🔥🔥🔥",                                     dur: 2  },
      { text: "// this is fine 🔥🔥🔥🔥🔥",                         dur: 12 },
      { text: "// the floor",                                       dur: 2  },
      { text: "// is",                                              dur: 1  },
      { text: "// lava",                                            dur: 2  },
      { text: "// 🔥🔥🔥",                                          dur: 2  },
      { text: "// this is fine 🔥🔥🔥🔥",                           dur: 9  },
      { text: "// server temp: yes",                                dur: 5  },
      { text: "// this is fine 🔥🔥🔥🔥🔥",                         dur: 9  },
      { text: "// fire status: also yes",                           dur: 5  },
      { text: "// this",                                            dur: 1  },
      { text: "// 🔥",                                              dur: 1  },
      { text: "// is",                                              dur: 1  },
      { text: "// 🔥🔥",                                            dur: 1  },
      { text: "// fine",                                            dur: 1  },
      { text: "// 🔥🔥🔥",                                          dur: 1  },
      { text: "// this is fine 🔥🔥🔥🔥🔥",                         dur: 12 },
      { text: "// $8,000 detected",                                 dur: 7  },
      { text: "// this is fine 🔥🔥🔥🔥",                           dur: 7  },
      { text: "// just a little on fire",                           dur: 5  },
      { text: "// this is fine 🔥🔥🔥🔥🔥",                         dur: 9  },
      { text: "// everything",                                      dur: 2  },
      { text: "// is",                                              dur: 1  },
      { text: "// 🔥🔥🔥🔥",                                        dur: 2  },
      { text: "// fine",                                            dur: 2  },
      { text: "// 🔥🔥🔥🔥🔥",                                      dur: 3  },
      { text: "// this is fine 🔥🔥🔥🔥🔥",                         dur: 15 },
      { text: "// cloudflare invoice: incoming",                    dur: 7  },
      { text: "// this is fine 🔥🔥🔥🔥",                           dur: 9  },
      { text: "// it's fine",                                       dur: 3  },
      { text: "// it's fine it's fine",                             dur: 3  },
      { text: "// it's fine it's fine it's fine 🔥🔥🔥",            dur: 5  },
      { text: "// this is fine 🔥🔥🔥🔥🔥",                         dur: 12 },
      // ~229s
  
      // ── ACT V: Acceptance (15–18min = 180s) ───────────────────────────────
      { text: "// this is fine 🔥🔥🔥",                             dur: 9  },
      { text: "// okay so maybe it's a little warm",                dur: 9  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// technically still loading",                       dur: 7  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// have you tried turning it off and on again",      dur: 9  },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// cloudflare graphql is deeply nested",             dur: 9  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// we have been in worse situations",                dur: 7  },
      { text: "// (we have not)",                                   dur: 5  },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// the data will arrive when it arrives",            dur: 9  },
      { text: "// this is fine 🔥🔥",                               dur: 9  },
      { text: "// like a fine wine. or a fine bill. from cloudflare.", dur: 9 },
      { text: "// this is fine 🔥",                                 dur: 9  },
      { text: "// neurons: $0.011 per 1k. loading: free. irony: priceless.", dur: 9 },
      { text: "// this is fine 🔥",                                 dur: 9  },
      // ~174s
  
      // ── FINALE: Peace (18–20min = 120s) ───────────────────────────────────
      { text: "// this is fine 🔥",                                 dur: 15 },
      { text: "// .",                                               dur: 5  },
      { text: "// ..",                                              dur: 5  },
      { text: "// ...",                                             dur: 5  },
      { text: "// this is fine 🔥",                                 dur: 15 },
      { text: "// still here",                                      dur: 9  },
      { text: "// still fine",                                      dur: 9  },
      { text: "// this is fine 🔥",                                 dur: 15 },
      { text: "// loading...",                                      dur: 9  },
      { text: "// this is fine 🔥",                                 dur: 15 },
      // ~107s — loops back to top
    ];
  
    const total = phrases.reduce((sum, p) => sum + p.dur, 0);
  
    const keyframesCSS = phrases.map((p, i) => {
      const start     = phrases.slice(0, i).reduce((s, x) => s + x.dur, 0);
      const end       = start + p.dur;
      const pct       = (n: number) => ((n / total) * 100).toFixed(4);
      const fireCount = (p.text.match(/🔥/g) || []).length;
  
      // scale: grows with fire count
      const scale = fireCount <= 1 ? 1
                  : fireCount === 2 ? 1.04
                  : fireCount === 3 ? 1.1
                  : fireCount === 4 ? 1.18
                  : 1.28 + (fireCount - 5) * 0.06;
  
      // flicker on 3+ fires
      const flicker = fireCount >= 3 ? `
          ${pct(start + p.dur * 0.25)}% { opacity: 1; }
          ${pct(start + p.dur * 0.28)}% { opacity: 0.25; }
          ${pct(start + p.dur * 0.31)}% { opacity: 1; }
          ${pct(start + p.dur * 0.55)}% { opacity: 1; }
          ${pct(start + p.dur * 0.58)}% { opacity: 0.15; }
          ${pct(start + p.dur * 0.61)}% { opacity: 1; }
          ${pct(start + p.dur * 0.80)}% { opacity: 1; }
          ${pct(start + p.dur * 0.83)}% { opacity: 0.4; }
          ${pct(start + p.dur * 0.86)}% { opacity: 1; }` : "";
  
      // color shifts warmer with more fire
      const color = fireCount === 0 ? "#3a4e3a"
                  : fireCount === 1 ? "#4a5e3a"
                  : fireCount === 2 ? "#6b6a2a"
                  : fireCount === 3 ? "#8a5a1a"
                  : fireCount === 4 ? "#a04a0a"
                  : "#c23a04";
  
      return `@keyframes tif-${i} {
        0%                    { opacity: 0; transform: scale(1);        color: ${color}; }
        ${pct(start)}%        { opacity: 0; transform: scale(1);        color: ${color}; }
        ${pct(start + 0.2)}%  { opacity: 1; transform: scale(${scale}); color: ${color}; }
        ${flicker}
        ${pct(end   - 0.2)}%  { opacity: 1; transform: scale(${scale}); color: ${color}; }
        ${pct(end)}%          { opacity: 0; transform: scale(1);        color: ${color}; }
        100%                  { opacity: 0; transform: scale(1);        color: ${color}; }
      }`;
    }).join("\n");
  
    const spansCSS = phrases.map((_, i) =>
      `.tif-${i} { animation: tif-${i} ${total}s linear infinite; }`
    ).join("\n");
  
    return (
      <>
        <style>{`
          .tif-wrap {
            position: relative;
            height: 20px;
            text-align: center;
            padding: 24px 0;
          }
          .tif-phrase {
            position: absolute;
            left: 0; right: 0;
            font-family: 'Share Tech Mono', monospace;
            font-size: 12px;
            letter-spacing: 0.1em;
            opacity: 0;
            transform-origin: center;
          }
          ${keyframesCSS}
          ${spansCSS}
        `}</style>
        <div className="tif-wrap">
          {phrases.map((p, i) => (
            <span key={i} className={`tif-phrase tif-${i}`}>
              {p.text}
            </span>
          ))}
        </div>
      </>
    );
  }