"use client";

import { useMemo, useState } from "react";

const states = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

type StateChecklistProps = {
  name: string;
  label: string;
  value?: string[];
  onChange?: (next: string[]) => void;
};

export default function StateChecklist({
  name,
  label,
  value,
  onChange,
}: StateChecklistProps) {
  const [internal, setInternal] = useState<string[]>([]);
  const selected = value ?? internal;
  const [pending, setPending] = useState(states[0]);

  const availableStates = useMemo(
    () => states.filter((state) => !selected.includes(state)),
    [selected]
  );

  function addState() {
    if (!pending || selected.includes(pending)) {
      return;
    }
    const nextSelected = [...selected, pending];
    if (onChange) {
      onChange(nextSelected);
    } else {
      setInternal(nextSelected);
    }
    const next = states.find(
      (state) => !nextSelected.includes(state) && state !== pending
    );
    if (next) {
      setPending(next);
    }
  }

  function removeState(state: string) {
    const nextSelected = selected.filter((item) => item !== state);
    if (onChange) {
      onChange(nextSelected);
    } else {
      setInternal(nextSelected);
    }
  }

  function selectAllStates() {
    if (onChange) {
      onChange([...states]);
    } else {
      setInternal([...states]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm font-medium text-muted">{label}</div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-xl border border-line bg-surface px-4 py-2 text-sm text-ink"
          value={pending}
          onChange={(event) => setPending(event.target.value)}
        >
          {(availableStates.length ? availableStates : states).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <button
          className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
          type="button"
          onClick={addState}
          disabled={!availableStates.length}
        >
          Add state
        </button>
        <button
          className="rounded-xl border border-line-strong px-4 py-2 text-sm font-medium text-muted transition hover:text-ink"
          type="button"
          onClick={selectAllStates}
          disabled={selected.length === states.length}
        >
          Select all
        </button>
      </div>
      {selected.length ? (
        <div className="flex flex-wrap gap-2 text-sm text-muted">
          {selected.map((state) => (
            <div
              key={state}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-1"
            >
              <input type="hidden" name={name} value={state} />
              <span>{state}</span>
              <button
                className="text-faint transition hover:text-ink"
                type="button"
                onClick={() => removeState(state)}
                aria-label={`Remove ${state}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-faint">No states selected yet.</p>
      )}
    </div>
  );
}
