import { useState, useEffect, useCallback } from "react";

const BOOKS = [{ id: "cambridge-16", label: "Cambridge IELTS 16" }];
const TESTS = [1, 2, 3, 4];

interface PassageData {
  title: string;
  text: string;
  qInstruction: string;
  questions: string[];
}

interface SectionData {
  instruction: string;
  questions: string[];
}

interface TestContent {
  reading: { passages: PassageData[] };
  listening: { sections: SectionData[] };
}

function emptyPassage(count: number): PassageData {
  return { title: "", text: "", qInstruction: "", questions: Array(count).fill("") };
}

function emptySection(): SectionData {
  return { instruction: "", questions: Array(10).fill("") };
}

function emptyContent(): TestContent {
  return {
    reading: {
      passages: [emptyPassage(13), emptyPassage(13), emptyPassage(14)],
    },
    listening: {
      sections: [emptySection(), emptySection(), emptySection(), emptySection()],
    },
  };
}

function storageKey(book: string, test: number) {
  return `saubol_content_${book}_test_${test}`;
}

export default function AdminEditor() {
  const [book, setBook] = useState("cambridge-16");
  const [testNum, setTestNum] = useState(1);
  const [tab, setTab] = useState<"reading" | "listening">("reading");
  const [passageIdx, setPassageIdx] = useState(0);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [content, setContent] = useState<TestContent>(emptyContent());
  const [saved, setSaved] = useState(false);
  const [stats, setStats] = useState({ rFilled: 0, lFilled: 0 });

  const load = useCallback((b: string, t: number) => {
    const raw = localStorage.getItem(storageKey(b, t));
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setContent(parsed);
      } catch {
        setContent(emptyContent());
      }
    } else {
      setContent(emptyContent());
    }
  }, []);

  useEffect(() => { load(book, testNum); }, [book, testNum, load]);

  useEffect(() => {
    let rFilled = 0, lFilled = 0;
    content.reading.passages.forEach(p => {
      if (p.title) rFilled++;
      if (p.text) rFilled++;
      p.questions.forEach(q => { if (q) rFilled++; });
    });
    content.listening.sections.forEach(s => {
      s.questions.forEach(q => { if (q) lFilled++; });
    });
    setStats({ rFilled, lFilled });
  }, [content]);

  const save = () => {
    localStorage.setItem(storageKey(book, testNum), JSON.stringify(content));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const updatePassage = (idx: number, field: keyof PassageData, value: string) => {
    setContent(prev => {
      const passages = prev.reading.passages.map((p, i) =>
        i === idx ? { ...p, [field]: value } : p
      );
      return { ...prev, reading: { passages } };
    });
  };

  const updateQuestion = (passIdx: number, qIdx: number, value: string) => {
    setContent(prev => {
      const passages = prev.reading.passages.map((p, i) => {
        if (i !== passIdx) return p;
        const questions = p.questions.map((q, j) => (j === qIdx ? value : q));
        return { ...p, questions };
      });
      return { ...prev, reading: { passages } };
    });
  };

  const updateSection = (idx: number, field: keyof SectionData, value: string) => {
    setContent(prev => {
      const sections = prev.listening.sections.map((s, i) =>
        i === idx ? { ...s, [field]: value } : s
      );
      return { ...prev, listening: { sections } };
    });
  };

  const updateListeningQ = (secIdx: number, qIdx: number, value: string) => {
    setContent(prev => {
      const sections = prev.listening.sections.map((s, i) => {
        if (i !== secIdx) return s;
        const questions = s.questions.map((q, j) => (j === qIdx ? value : q));
        return { ...s, questions };
      });
      return { ...prev, listening: { sections } };
    });
  };

  const clearTest = () => {
    if (confirm(`Clear all content for ${book} Test ${testNum}?`)) {
      setContent(emptyContent());
      localStorage.removeItem(storageKey(book, testNum));
    }
  };

  const passage = content.reading.passages[passageIdx];
  const section = content.listening.sections[sectionIdx];
  const passageQStart = [1, 14, 27][passageIdx];
  const sectionQStart = [1, 11, 21, 31][sectionIdx];

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", fontFamily: "system-ui, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "#1e3a8a", color: "#fff", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 20 }}>✏️</span>
          <span style={{ fontWeight: 700, fontSize: 16 }}>Test Content Editor</span>
          <span style={{ background: "#3b82f6", padding: "2px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600 }}>Admin</span>
        </div>
        <a href="/ielts" style={{ color: "#93c5fd", fontSize: 13, textDecoration: "none" }}>← Back to IELTS</a>
      </div>

      <div style={{ display: "flex", height: "calc(100vh - 56px)" }}>
        {/* Sidebar */}
        <div style={{ width: 220, background: "#fff", borderRight: "1px solid #e2e8f0", padding: 16, flexShrink: 0, overflowY: "auto" }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Book</div>
            {BOOKS.map(b => (
              <button key={b.id} onClick={() => { setBook(b.id); setTestNum(1); setPassageIdx(0); setSectionIdx(0); }}
                style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: book === b.id ? "#eff6ff" : "transparent", color: book === b.id ? "#1d4ed8" : "#374151", marginBottom: 2 }}>
                {b.label}
              </button>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Test</div>
            {TESTS.map(t => {
              const hasData = !!localStorage.getItem(storageKey(book, t));
              return (
                <button key={t} onClick={() => { setTestNum(t); setPassageIdx(0); setSectionIdx(0); }}
                  style={{ width: "100%", textAlign: "left", padding: "8px 10px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: testNum === t ? "#eff6ff" : "transparent", color: testNum === t ? "#1d4ed8" : "#374151", marginBottom: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  Test {t}
                  {hasData && <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 24, padding: "12px", background: "#f8fafc", borderRadius: 8, fontSize: 12, color: "#64748b" }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: "#334155" }}>Progress</div>
            <div>Reading: {stats.rFilled} fields filled</div>
            <div>Listening: {stats.lFilled} questions filled</div>
          </div>
        </div>

        {/* Main area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Sub-header */}
          <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", gap: 8 }}>
              {(["reading", "listening"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{ padding: "7px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, background: tab === t ? "#1d4ed8" : "#f1f5f9", color: tab === t ? "#fff" : "#64748b", transition: "all .15s" }}>
                  {t === "reading" ? "📖 Reading" : "🎧 Listening"}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {saved && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Saved!</span>}
              <button onClick={clearTest} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #fca5a5", background: "#fef2f2", color: "#dc2626", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Clear</button>
              <button onClick={save} style={{ padding: "8px 22px", borderRadius: 8, border: "none", background: "#1d4ed8", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>💾 Save</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
            <div style={{ marginBottom: 16, color: "#6b7280", fontSize: 13 }}>
              Editing: <strong style={{ color: "#1e3a8a" }}>{BOOKS.find(b2 => b2.id === book)?.label} — Test {testNum}</strong>
              <span style={{ marginLeft: 8, fontSize: 12, color: "#94a3b8" }}>Content saved here loads automatically when students open the test.</span>
            </div>

            {tab === "reading" && (
              <div>
                {/* Passage tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {[0, 1, 2].map(i => {
                    const ranges = ["Q 1–13", "Q 14–26", "Q 27–40"];
                    const filled = content.reading.passages[i].title || content.reading.passages[i].text;
                    return (
                      <button key={i} onClick={() => setPassageIdx(i)}
                        style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", border: `1px solid ${passageIdx === i ? "#1d4ed8" : "#e2e8f0"}`, borderBottom: passageIdx === i ? "none" : "1px solid #e2e8f0", background: passageIdx === i ? "#1d4ed8" : "#f8fafc", color: passageIdx === i ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        Passage {i + 1}
                        <span style={{ fontSize: 11, opacity: .8 }}>{ranges[i]}</span>
                        {filled && <span style={{ width: 6, height: 6, borderRadius: "50%", background: passageIdx === i ? "#93c5fd" : "#22c55e" }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 8px 8px 8px", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                  {/* Passage title */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Passage Title</label>
                    <input value={passage.title} onChange={e => updatePassage(passageIdx, "title", e.target.value)}
                      placeholder={`e.g. "Why we need to protect polar bears"`}
                      style={{ width: "100%", padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none" }} />
                  </div>

                  {/* Passage text */}
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                      Passage Text
                      <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: "#94a3b8" }}>Paste the full reading text here. Use a blank line between paragraphs.</span>
                    </label>
                    <textarea value={passage.text} onChange={e => updatePassage(passageIdx, "text", e.target.value)}
                      placeholder={"Paste the full passage text here...\n\nSeparate paragraphs with blank lines.\n\nFor labelled paragraphs write:\nA.\nFirst paragraph text here.\n\nB.\nSecond paragraph text here."}
                      style={{ width: "100%", minHeight: 280, padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, lineHeight: 1.7, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
                    {passage.text && (
                      <div style={{ marginTop: 4, fontSize: 12, color: "#94a3b8" }}>
                        ~{passage.text.split(/\s+/).filter(Boolean).length} words
                      </div>
                    )}
                  </div>

                  {/* Question instruction */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Question Instruction</label>
                    <textarea value={passage.qInstruction} onChange={e => updatePassage(passageIdx, "qInstruction", e.target.value)}
                      placeholder={"e.g. Do the following statements agree with the information given in the Reading Passage?\nWrite TRUE, FALSE or NOT GIVEN."}
                      style={{ width: "100%", minHeight: 72, padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
                  </div>

                  {/* Questions */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                      Questions ({passage.questions.filter(q => q).length}/{passage.questions.length} filled)
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {passage.questions.map((q, qi) => (
                        <div key={qi} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 30, height: 30, background: "#1d4ed8", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 5 }}>
                            {passageQStart + qi}
                          </div>
                          <textarea value={q} onChange={e => updateQuestion(passageIdx, qi, e.target.value)}
                            placeholder={`Question ${passageQStart + qi} text...`}
                            rows={2}
                            style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "listening" && (
              <div>
                {/* Section tabs */}
                <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
                  {[0, 1, 2, 3].map(i => {
                    const ranges = ["Q 1–10", "Q 11–20", "Q 21–30", "Q 31–40"];
                    const filled = content.listening.sections[i].questions.some(q => q);
                    return (
                      <button key={i} onClick={() => setSectionIdx(i)}
                        style={{ padding: "8px 16px", borderRadius: "8px 8px 0 0", border: `1px solid ${sectionIdx === i ? "#1d4ed8" : "#e2e8f0"}`, borderBottom: sectionIdx === i ? "none" : "1px solid #e2e8f0", background: sectionIdx === i ? "#1d4ed8" : "#f8fafc", color: sectionIdx === i ? "#fff" : "#64748b", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        Section {i + 1}
                        <span style={{ fontSize: 11, opacity: .8 }}>{ranges[i]}</span>
                        {filled && <span style={{ width: 6, height: 6, borderRadius: "50%", background: sectionIdx === i ? "#93c5fd" : "#22c55e" }} />}
                      </button>
                    );
                  })}
                </div>

                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: "0 8px 8px 8px", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
                  {/* Section instruction */}
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 6 }}>Section Instruction</label>
                    <textarea value={section.instruction} onChange={e => updateSection(sectionIdx, "instruction", e.target.value)}
                      placeholder={"e.g. Questions 1–10\nComplete the notes below.\nWrite ONE WORD AND/OR A NUMBER for each answer."}
                      style={{ width: "100%", minHeight: 80, padding: "9px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit" }} />
                  </div>

                  {/* Questions */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 10 }}>
                      Questions ({section.questions.filter(q => q).length}/{section.questions.length} filled)
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {section.questions.map((q, qi) => (
                        <div key={qi} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                          <div style={{ width: 30, height: 30, background: "#1d4ed8", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 5 }}>
                            {sectionQStart + qi}
                          </div>
                          <textarea value={q} onChange={e => updateListeningQ(sectionIdx, qi, e.target.value)}
                            placeholder={`Question ${sectionQStart + qi} text (e.g. "The tour starts at ____________")`}
                            rows={2}
                            style={{ flex: 1, padding: "7px 10px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 13, resize: "vertical", outline: "none", fontFamily: "inherit", lineHeight: 1.5 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer save bar */}
          <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ fontSize: 13, color: "#94a3b8" }}>
              Content is saved to your browser. Open the test page — it will load your content automatically.
            </div>
            <button onClick={save} style={{ padding: "9px 28px", borderRadius: 8, border: "none", background: saved ? "#16a34a" : "#1d4ed8", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background .2s" }}>
              {saved ? "✓ Saved!" : "💾 Save Content"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
