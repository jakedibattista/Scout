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

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs uppercase tracking-wider text-white/50">
        {label}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="rounded-full border border-white/10 bg-black/60 px-4 py-2 text-sm text-white"
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
          className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/80 hover:text-white"
          type="button"
          onClick={addState}
          disabled={!availableStates.length}
        >
          Add state
        </button>
      </div>
      {selected.length ? (
        <div className="flex flex-wrap gap-2 text-xs text-white/70">
          {selected.map((state) => (
            <div
              key={state}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1"
            >
              <input type="hidden" name={name} value={state} />
              <span>{state}</span>
              <button
                className="text-white/50 hover:text-white"
                type="button"
                onClick={() => removeState(state)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-white/50">No states selected yet.</p>
      )}
    </div>
  );
}
