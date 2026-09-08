import { useRef } from "react";
import { AdjustmentIcon, EyeIcon, ParamIcon, ResetIcon } from "./param-icons";
import { TrackSlider } from "./TrackSlider";
import { ADJUST_GROUPS } from "./groups";
import { PRESET_IMAGES } from "./preset-images";
import {
  ADJUSTMENTS,
  NEUTRAL,
  PRESETS,
  type AdjustmentKey,
  type Adjustments,
  type EffectToggles,
  type Preset,
} from "./grading";

export type PanelTab = "prompt" | "presets" | "adjust";

interface Props {
  tab: PanelTab;
  onTab: (tab: PanelTab) => void;
  hasImage: boolean;

  /** AI pane */
  prompt: string;
  onPrompt: (value: string) => void;
  onGenerate: () => void;
  busy: boolean;
  error: string | null;
  onRetry: () => void;

  /** Presets pane */
  presetId: string | null;
  onPickPreset: (preset: Preset) => void;

  /** Adjust pane */
  values: Adjustments;
  enabled: EffectToggles;
  onChange: (key: AdjustmentKey, value: number) => void;
  onToggle: (key: AdjustmentKey, on: boolean) => void;
  onResetKey: (key: AdjustmentKey) => void;
  onResetAll: () => void;
  collapsed: Record<string, boolean>;
  onToggleGroup: (id: string) => void;
  activeGroup: string;
  onSelectGroup: (id: string) => void;
  /** Mobile: open the single-parameter editor. */
  onOpenParam: (key: AdjustmentKey) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

const SPEC = new Map(ADJUSTMENTS.map((s) => [s.key, s]));

export function ControlsPanel(props: Props) {
  const {
    tab,
    onTab,
    hasImage,
    prompt,
    onPrompt,
    onGenerate,
    busy,
    error,
    onRetry,
    presetId,
    onPickPreset,
    values,
    enabled,
    onChange,
    onToggle,
    onResetKey,
    onResetAll,
    collapsed,
    onToggleGroup,
    activeGroup,
    onSelectGroup,
    onOpenParam,
    onDragStart,
    onDragEnd,
  } = props;

  const tilesRef = useRef<HTMLDivElement>(null);
  const anyMoved = (Object.keys(NEUTRAL) as AdjustmentKey[]).some(
    (k) => values[k] !== NEUTRAL[k] || !enabled[k],
  );

  const row = (key: AdjustmentKey, labelOverride?: string) => {
    const spec = SPEC.get(key)!;
    const label = labelOverride ?? spec.label;
    const moved = values[key] !== NEUTRAL[key];
    const on = enabled[key];
    return (
      <div key={key} className={`cg-row${moved ? " cg-moved" : ""}${on ? "" : " cg-off"}`}>
        <TrackSlider
          label={label}
          value={values[key]}
          min={spec.min}
          max={spec.max}
          step={spec.step}
          def={NEUTRAL[key]}
          disabled={!on}
          onChange={(v) => onChange(key, v)}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        />
        <div className="cg-act">
          <button
            type="button"
            className="cg-eye"
            aria-pressed={on}
            aria-label={`${on ? "Disable" : "Enable"} ${label}`}
            onClick={() => onToggle(key, !on)}
          >
            <EyeIcon on={on} size={17} />
          </button>
          <button
            type="button"
            className="cg-reset"
            aria-label={`Reset ${label}`}
            onClick={() => onResetKey(key)}
          >
            <ResetIcon size={17} />
          </button>
        </div>
      </div>
    );
  };

  const scrollToGroup = (id: string) => {
    onSelectGroup(id);
    const el = tilesRef.current?.querySelector<HTMLElement>(`[data-seg="${id}"]`);
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  return (
    <aside className="cg-panel" aria-label="Controls">
      <div className="cg-tabs" role="tablist" aria-label="Grading controls">
        {(
          [
            ["prompt", "Prompt"],
            ["presets", "Presets"],
            ["adjust", "Adjust"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className="cg-tab"
            role="tab"
            id={`cg-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`cg-pane-${id}`}
            onClick={() => onTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="cg-panel-body">
        {tab === "prompt" && (
          <div
            className="cg-pane cg-prompt-pane"
            id="cg-pane-prompt"
            role="tabpanel"
            aria-labelledby="cg-tab-prompt"
          >
            <div className="cg-sec-head">
              <h3>DESCRIBE YOUR LOOK</h3>
              <span className="cg-badge">AI</span>
            </div>
            <textarea
              className="cg-textarea"
              id="cg-prompt"
              aria-label="Describe the color grade you want"
              value={prompt}
              onChange={(e) => onPrompt(e.target.value)}
              placeholder="Describe the color grade you want…"
              spellCheck={false}
            />
            <button
              type="button"
              className="cg-btn-primary"
              onClick={onGenerate}
              disabled={!hasImage || busy}
              aria-busy={busy}
            >
              {busy ? "Generating…" : "Generate"}
            </button>
            {error && (
              <div className="cg-error" role="alert">
                <p>{error}</p>
                <button type="button" className="cg-retry" onClick={onRetry} disabled={busy}>
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "presets" && (
          <div
            className="cg-pane cg-presets-pane"
            id="cg-pane-presets"
            role="tabpanel"
            aria-labelledby="cg-tab-presets"
          >
            <div className="cg-sec-head">
              <h3>PRESETS</h3>
              <button type="button" className="cg-link" onClick={onResetAll}>
                reset
              </button>
            </div>
            <div className="cg-presets">
              {PRESETS.map((preset, i) => {
                const on = preset.id === presetId;
                const image = PRESET_IMAGES[preset.id];
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className="cg-preset"
                    aria-pressed={on}
                    onClick={() => onPickPreset(preset)}
                  >
                    {i === 0 || !image ? (
                      <span className="cg-none">
                        <ParamIcon name="contrast" size={30} />
                      </span>
                    ) : (
                      <img src={image} alt="" loading="lazy" draggable={false} />
                    )}
                    <span title={preset.name}>{preset.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === "adjust" && (
          <div
            className="cg-pane cg-adjust-pane"
            id="cg-pane-adjust"
            role="tabpanel"
            aria-labelledby="cg-tab-adjust"
          >
            <div className="cg-sec-head">
              <h3>ADJUST</h3>
              <button
                type="button"
                className="cg-link"
                onClick={onResetAll}
                disabled={!anyMoved}
                aria-disabled={!anyMoved}
              >
                reset all
              </button>
            </div>

            {/* mobile category nav */}
            <div className="cg-chips cg-scroll-x">
              {ADJUST_GROUPS.map((group) => {
                const groupOn = group.keys.some((k) => enabled[k]);
                return (
                  <span key={group.id} className="contents">
                    <button
                      type="button"
                      className="cg-chip"
                      data-seg={group.id}
                      aria-pressed={group.id === activeGroup}
                      onClick={() => scrollToGroup(group.id)}
                    >
                      <AdjustmentIcon paramKey={group.keys[0]} size={13} />
                      {group.label}
                    </button>
                    {group.effect && (
                      <button
                        type="button"
                        className="cg-eye-chip"
                        aria-pressed={groupOn}
                        aria-label={`${groupOn ? "Disable" : "Enable"} ${group.label}`}
                        onClick={() => group.keys.forEach((k) => onToggle(k, !groupOn))}
                      >
                        <EyeIcon on={groupOn} size={13} />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>

            {/* desktop full sliders */}
            <div className="cg-full cg-groups">
              {ADJUST_GROUPS.map((group) => {
                const isClosed = collapsed[group.id] ?? false;
                const groupOn = group.keys.some((k) => enabled[k]);
                return (
                  <div
                    key={group.id}
                    className={`cg-group${isClosed ? " cg-collapsed" : ""}`}
                    data-group={group.id}
                  >
                    <div className="cg-group-head">
                      <button
                        type="button"
                        className="cg-title"
                        aria-expanded={!isClosed}
                        onClick={() => onToggleGroup(group.id)}
                      >
                        <span className="cg-chev">
                          <svg
                            viewBox="0 0 24 24"
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="m6 9 6 6 6-6" />
                          </svg>
                        </span>
                        {group.label}
                      </button>
                      {group.effect && (
                        <button
                          type="button"
                          className="cg-eye-chip"
                          aria-pressed={groupOn}
                          aria-label={`${groupOn ? "Disable" : "Enable"} ${group.label}`}
                          onClick={() => group.keys.forEach((k) => onToggle(k, !groupOn))}
                        >
                          <EyeIcon on={groupOn} size={13} />
                        </button>
                      )}
                    </div>
                    <div className="cg-rows">
                      {group.keys.map((k) => row(k, group.labels?.[k]))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* mobile compact tiles */}
            <div className="cg-compact">
              <div className="cg-tiles cg-scroll-x" ref={tilesRef}>
                {ADJUST_GROUPS.map((group, gi) => (
                  <span key={group.id} className="contents">
                    {gi > 0 && <span className="cg-divider" aria-hidden />}
                    {group.keys.map((k, ki) => {
                      const spec = SPEC.get(k)!;
                      const label = group.labels?.[k] ?? spec.label;
                      const moved = values[k] !== NEUTRAL[k];
                      return (
                        <button
                          key={k}
                          type="button"
                          className={`cg-tile${moved ? " cg-moved" : ""}`}
                          data-seg={ki === 0 ? group.id : undefined}
                          aria-pressed={false}
                          aria-label={`Edit ${group.label} · ${label}`}
                          onClick={() => {
                            onSelectGroup(group.id);
                            onOpenParam(k);
                          }}
                        >
                          <span className="cg-slot">
                            <AdjustmentIcon paramKey={k} />
                          </span>
                          <b>{label}</b>
                          <span className="cg-dot" aria-hidden />
                        </button>
                      );
                    })}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
