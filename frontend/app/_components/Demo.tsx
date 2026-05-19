"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DEMO_API_URL = "https://api.valify.dev";
const DEMO_PROJECT_SLUG = "fitness-coach";
const DEMO_CALL_SLUG = "validate-program";

type DemoTabId = "curl" | "python" | "javascript" | "php";

const DEMO_TAB_LABELS: Record<DemoTabId, string> = {
  curl: "cURL",
  python: "Python",
  javascript: "JavaScript",
  php: "PHP",
};

function buildDemoSnippet(
  tab: DemoTabId,
  projectSlug: string,
  callSlug: string,
  apiUrl: string
): string {
  const body = JSON.stringify(
    {
      api_token: "YOUR_API_TOKEN",
      project: projectSlug,
      call: callSlug,
      prompt: "User prompt to validate",
    },
    null,
    2
  );

  const bodyCompact = JSON.stringify({
    api_token: "YOUR_API_TOKEN",
    project: projectSlug,
    call: callSlug,
    prompt: "User prompt to validate",
  });

  if (tab === "curl") {
    return `curl -X POST ${apiUrl}/v1/validate \\
  -H "Content-Type: application/json" \\
  -d '${bodyCompact}'`;
  }

  if (tab === "python") {
    return `import httpx

response = httpx.post(
    "${apiUrl}/v1/validate",
    json=${body.replace(/^/gm, "    ").trim()},
)
print(response.json())`;
  }

  if (tab === "javascript") {
    return `const response = await fetch("${apiUrl}/v1/validate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(${body.replace(/^/gm, "  ").trim()}),
});
const data = await response.json();
console.log(data);`;
  }

  return `<?php

$payload = [
    "api_token" => "YOUR_API_TOKEN",
    "project"   => "${projectSlug}",
    "call"      => "${callSlug}",
    "prompt"    => "User User prompt to validate",
];

$ch = curl_init("${apiUrl}/v1/validate");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));

$response = curl_exec($ch);
curl_close($ch);

print_r(json_decode($response, true));`;
}

function DemoUsage() {
  const [activeTab, setActiveTab] = useState<DemoTabId>("curl");
  const [copied, setCopied] = useState(false);

  const snippet = buildDemoSnippet(
    activeTab,
    DEMO_PROJECT_SLUG,
    DEMO_CALL_SLUG,
    DEMO_API_URL
  );

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [snippet]);

  return (
    <div className="demo-usage text-left">
      <div className="demo-usage-head">
        <div className="demo-usage-tabs">
          {(Object.keys(DEMO_TAB_LABELS) as DemoTabId[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`demo-usage-tab ${
                activeTab === tab ? "demo-usage-tab-active" : ""
              }`}
            >
              {DEMO_TAB_LABELS[tab]}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={copy}
          className="demo-usage-copy"
          aria-label="Copy snippet"
        >
          {copied ? (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              copied
            </>
          ) : (
            <>
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              copy
            </>
          )}
        </button>
      </div>
      <pre className="demo-usage-code">{snippet}</pre>
      <div className="demo-usage-footer">
        <p>POST {DEMO_API_URL}/v1/validate</p>
      </div>
    </div>
  );
}

const SCHEMA = {
  goal: {
    type: "string",
    required: false,
    description: "Objectif: endurance, force, perte de poids...",
  },
  level: {
    type: "string",
    required: true,
    description: "Niveau: débutant, intermédiaire ou avancé",
  },
  sport: {
    type: "string",
    required: true,
    description: "Activité physique",
  },
  duration_weeks: {
    type: "integer|array",
    required: true,
    description: "Durée du programme en semaines",
  },
  sessions_per_week: {
    type: "integer|array",
    required: true,
    description: "Nombre d'entraînements par semaine",
  },
};

const CASES: { prompt: string; response: unknown }[] = [
  {
    prompt:
      "Créer un programme Cardio de 6 semaines avec pour objectif la perte de poids.",
    response: {
      valid: false,
      missing: [
        "level",
        "sessions_per_week"
      ],
      extracted: {
        goal: "perde te poids",
        sport: "Cardio",
        duration_weeks: 6
      },
      confidence: 0.9,
      suggested_reply: "Pourriez-vous me préciser votre niveau et le nombre de séances par semaine souhaité ?"
    },
  },
  {
    prompt:
      "Créer un programme Cardio débutant avec pour objectif la perte de poids sur 6 semaines et 3 entrainements par semaines.",
    response: {
      valid: true,
      missing: [],
      extracted: {
        goal: "perte de poids",
        level: "débutant",
        sport: "cardio",
        duration_weeks: 6,
        sessions_per_week: [
          3,
          4
        ]
      },
      confidence: 1,
      suggested_reply: null,
    },
  },
];

const TYPING_MS = 28;
const PAUSE_AFTER_TYPE = 600;
const PAUSE_AFTER_RESPONSE = 4000;

function highlightJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  return json
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
      (match) => {
        let cls = "json-num";
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? "json-key" : "json-str";
        } else if (/true|false/.test(match)) {
          cls = "json-bool";
        } else if (/null/.test(match)) {
          cls = "json-null";
        }
        return `<span class="${cls}">${match}</span>`;
      }
    );
}

export default function Demo() {
  const [typed, setTyped] = useState(0);
  const [showResponse, setShowResponse] = useState(false);
  const [caseIdx, setCaseIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const pausedRef = useRef(false);

  const currentCase = CASES[caseIdx];

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const prompt = CASES[caseIdx].prompt;

    setTyped(0);
    setShowResponse(false);

    let i = 0;
    let phase: "typing" | "showResp" | "wait" | "next" = "typing";

    const tick = () => {
      if (cancelled) return;
      if (pausedRef.current) {
        timer = setTimeout(tick, 120);
        return;
      }
      if (phase === "typing") {
        if (i < prompt.length) {
          i++;
          setTyped(i);
          timer = setTimeout(tick, TYPING_MS);
        } else {
          phase = "showResp";
          timer = setTimeout(tick, PAUSE_AFTER_TYPE);
        }
      } else if (phase === "showResp") {
        setShowResponse(true);
        phase = "wait";
        timer = setTimeout(tick, PAUSE_AFTER_RESPONSE);
      } else if (phase === "wait") {
        phase = "next";
        setCaseIdx((idx) => (idx + 1) % CASES.length);
      }
    };

    timer = setTimeout(tick, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [caseIdx]);

  useEffect(() => {
    setProgress(0);
    const prompt = CASES[caseIdx].prompt;
    const total =
      400 + prompt.length * TYPING_MS + PAUSE_AFTER_TYPE + PAUSE_AFTER_RESPONSE;
    const step = 50;
    let elapsed = 0;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      elapsed = Math.min(elapsed + step, total);
      setProgress(elapsed / total);
    }, step);
    return () => clearInterval(id);
  }, [caseIdx]);

  return (
    <section className="demo">
      <div className="demo-inner">
        <div className="demo-header">
          <div className="demo-badge">Live demo</div>
          <h2 className="demo-title">Du schéma au JSON validé</h2>
          <p className="demo-sub">
            Définissez un schéma. Envoyez le prompt utilisateur. Recevez la réponse structurée.
          </p>

        <DemoUsage />

          <button
            type="button"
            className="demo-toggle"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Lecture" : "Pause"}
          >
            {paused ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            ) : (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
              </svg>
            )}
            <span>{paused ? "Play" : "Pause"}</span>
          </button>
        </div>

        <div className="demo-grid">
          <div className="demo-card">
            <div className="demo-card-head">
              <span className="demo-step">01</span>
              <span className="demo-card-title">Schema</span>
              <span className="demo-card-meta">call.config.schema</span>
            </div>
            <pre
              className="demo-code"
              dangerouslySetInnerHTML={{ __html: highlightJson(SCHEMA) }}
            />
          </div>

          <div className="demo-card">
            <div className="demo-card-head">
              <span className="demo-step">02</span>
              <span className="demo-card-title">User prompt</span>
              <span className="demo-card-meta">POST /validate</span>
            </div>
            <div className="demo-input">
              <span className="demo-input-text">
                {currentCase.prompt.slice(0, typed)}
                <span className="demo-caret" />
              </span>
            </div>
          </div>

          <div className="demo-card">
            <div className="demo-card-head">
              <span className="demo-step">03</span>
              <span className="demo-card-title">Response</span>
              <span
                className={`demo-card-meta ${
                  showResponse
                    ? (currentCase.response as { valid: boolean }).valid
                      ? "demo-ok"
                      : "demo-warn"
                    : "demo-pending"
                }`}
              >
                {showResponse
                  ? (currentCase.response as { valid: boolean }).valid
                    ? "200 OK"
                    : "422 invalid"
                  : "…"}
              </span>
            </div>
            <pre
              className={`demo-code ${showResponse ? "" : "demo-code-hidden"}`}
              dangerouslySetInnerHTML={{
                __html: showResponse ? highlightJson(currentCase.response) : "",
              }}
            />
          </div>
        </div>

        <div className="demo-rules">
          <div className="demo-card demo-rules-card">
            <div className="demo-card-head">
              <span className="demo-step">★</span>
              <span className="demo-card-title">Custom rules</span>
              <span className="demo-card-meta">call.config.rules</span>
            </div>
            <p className="demo-rules-text">
              Si le prompt utilisateur comporte des approximations répond sous
              forme de tableau. Ex: <code>5 ou 6 = [5, 6]</code>
            </p>
          </div>
        </div>

        <div className="demo-progress" aria-hidden="true">
          <div className="demo-progress-track">
            <div
              className="demo-progress-fill"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
          <div className="demo-progress-meta">
            <span className="demo-progress-label">
              prompt {caseIdx + 1}/{CASES.length}
            </span>
            <div className="demo-progress-dots">
              {CASES.map((_, idx) => (
                <span
                  key={idx}
                  className={`demo-progress-dot ${
                    idx === caseIdx ? "demo-progress-dot-active" : ""
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .demo {
          padding: 5rem 2rem;
          border-top: 1px solid rgba(255,255,255,0.06);
        }
        .demo-inner {
          max-width: 1100px;
          margin: 0 auto;
        }
        .demo-header {
          text-align: center;
          margin-bottom: 3rem;
        }
        .demo-badge {
          display: inline-block;
          margin-bottom: 1rem;
          padding: 0.25rem 0.75rem;
          border: 1px solid rgba(79,142,247,0.3);
          border-radius: 2px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #4f8ef7;
          background: rgba(79,142,247,0.06);
        }
        .demo-title {
          font-size: clamp(1.75rem, 3.5vw, 2.5rem);
          font-weight: 700;
          letter-spacing: -0.03em;
          margin: 0 0 0.75rem;
          color: #f0f0fa;
        }
        .demo-sub {
          font-size: 1rem;
          color: #7070a0;
          margin: 0 0 1.5rem;
        }
        .demo-toggle {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.4rem 0.85rem;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.03);
          color: #c8c8e0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: border-color 0.15s, background 0.15s, color 0.15s;
        }
        .demo-toggle:hover {
          border-color: rgba(79,142,247,0.5);
          background: rgba(79,142,247,0.08);
          color: #4f8ef7;
        }
        .demo-toggle svg { display: block; }

        .demo-usage {
          margin: 0 auto 2rem;
          max-width: 1100px;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 6px;
          overflow: hidden;
          background: #1e1e2e;
        }
        .demo-usage-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          background: #1e1e2e;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .demo-usage-tabs {
          display: flex;
          gap: 0.25rem;
        }
        .demo-usage-tab {
          padding: 0.3rem 0.75rem;
          border: none;
          border-radius: 4px;
          background: transparent;
          color: rgba(255,255,255,0.4);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          cursor: pointer;
          transition: color 0.15s, background 0.15s;
        }
        .demo-usage-tab:hover { color: rgba(255,255,255,0.7); }
        .demo-usage-tab-active {
          background: rgba(255,255,255,0.15);
          color: #fff;
        }
        .demo-usage-copy {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.3rem 0.6rem;
          border: none;
          background: transparent;
          color: rgba(255,255,255,0.4);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          cursor: pointer;
          transition: color 0.15s;
        }
        .demo-usage-copy:hover { color: rgba(255,255,255,0.8); }
        .demo-usage-copy svg { display: block; }
        .demo-usage-code {
          margin: 0;
          padding: 1rem;
          background: #1e1e2e;
          color: #cdd6f4;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.78rem;
          line-height: 1.6;
          white-space: pre-wrap;
          word-break: break-all;
        }
        .demo-usage-footer {
          padding: 0.5rem 1rem;
          background: #1e1e2e;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .demo-usage-footer p {
          margin: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
        }

        .demo-progress {
          max-width: 540px;
          margin: 2rem auto 0;
        }
        .demo-progress-track {
          height: 3px;
          background: rgba(255,255,255,0.06);
          border-radius: 2px;
          overflow: hidden;
        }
        .demo-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #4f8ef7 0%, #7aa7ff 100%);
          transition: width 50ms linear;
        }
        .demo-progress-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.5rem;
        }
        .demo-progress-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6060a0;
        }
        .demo-progress-dots {
          display: inline-flex;
          gap: 0.35rem;
        }
        .demo-progress-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.15);
          transition: background 0.2s, transform 0.2s;
        }
        .demo-progress-dot-active {
          background: #4f8ef7;
          transform: scale(1.2);
        }
        .demo-rules {
          margin-top: 1rem;
        }
        .demo-rules-card {
          min-height: 0 !important;
        }
        .demo-rules-text {
          padding: 1rem;
          margin: 0;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.82rem;
          line-height: 1.6;
          color: #c8c8e0;
        }
        .demo-rules-text code {
          padding: 0.1rem 0.4rem;
          background: rgba(79,142,247,0.12);
          color: #7aa7ff;
          border-radius: 3px;
          font-size: 0.78rem;
        }
        .demo-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
        }
        .demo-card {
          background: #0d0d14;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 380px;
        }
        .demo-card-head {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
        }
        .demo-step {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          font-weight: 700;
          color: #4f8ef7;
          letter-spacing: 0.1em;
        }
        .demo-card-title {
          font-size: 0.85rem;
          font-weight: 600;
          color: #e8e8f0;
        }
        .demo-card-meta {
          margin-left: auto;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.7rem;
          color: #6060a0;
        }
        .demo-ok { color: #4ade80; }
        .demo-warn { color: #fbbf24; }
        .demo-pending { color: #6060a0; }
        .demo-code {
          margin: 0;
          padding: 1rem;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
          font-size: 0.78rem;
          line-height: 1.55;
          color: #c8c8e0;
          overflow: hidden;
          flex: 1;
          white-space: pre-wrap;
          word-break: break-word;
          overflow-wrap: anywhere;
        }
        .demo-code-hidden {
          opacity: 0;
        }
        .demo-input {
          padding: 1rem;
          flex: 1;
          display: flex;
          align-items: flex-start;
        }
        .demo-input-text {
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.85rem;
          line-height: 1.6;
          color: #e8e8f0;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .demo-caret {
          display: inline-block;
          width: 0.5ch;
          height: 1em;
          margin-left: 1px;
          vertical-align: text-bottom;
          background: #4f8ef7;
          animation: demo-blink 1s steps(2) infinite;
        }
        @keyframes demo-blink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
        .demo-code :global(.json-key) { color: #7aa7ff; }
        .demo-code :global(.json-str) { color: #6ee7b7; }
        .demo-code :global(.json-num) { color: #fbbf24; }
        .demo-code :global(.json-bool) { color: #c084fc; }
        .demo-code :global(.json-null) { color: #6b7280; }
        .json-key { color: #7aa7ff; }
        .json-str { color: #6ee7b7; }
        .json-num { color: #fbbf24; }
        .json-bool { color: #c084fc; }
        .json-null { color: #6b7280; }

        @media (max-width: 900px) {
          .demo-grid { grid-template-columns: 1fr; }
          .demo-card { min-height: auto; }
          .demo { padding: 4rem 1.25rem; }
        }
      `}</style>
    </section>
  );
}
