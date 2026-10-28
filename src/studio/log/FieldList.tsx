import { useState } from 'react';
import { copy } from '../../copy';
import { COLOR_ATTRS, cssColor, GIT_NAMED_COLORS, isHex, type ColorAttr } from '../../core/colors';
import { makeField, type LogField, type LogRecipe } from '../../core/logFormat';
import { fieldDef, FIELD_DEFS, type FieldGroup } from '../../data/fields';

interface Props {
  recipe: LogRecipe;
  onChange(r: LogRecipe): void;
  onFocusField(uid: string | null): void;
  warnings: Map<string, string>;
}

const GROUPS: FieldGroup[] = ['Hash', 'Author', 'Committer', 'Message', 'Refs', 'Other'];

function ColorPicker({ field, onChange }: { field: LogField; onChange(color: string): void }) {
  const mode = field.color === '' ? 'terminal' : field.color === 'auto' ? 'auto' : isHex(field.color) ? 'custom' : field.color;
  const isRefs = field.placeholder === '%d' || field.placeholder === '%D';
  return (
    <div className="field">
      <label htmlFor={`c-${field.uid}`}>{copy.log.color}</label>
      <div className="inline-field">
        <select
          id={`c-${field.uid}`}
          value={mode}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === 'terminal' ? '' : v === 'custom' ? '#E5C07B' : v);
          }}
        >
          <option value="terminal">{copy.log.terminalColor}</option>
          {isRefs && <option value="auto">{copy.log.auto}</option>}
          <option value="custom">Custom…</option>
          {GIT_NAMED_COLORS.filter((c) => c !== 'normal').map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {mode === 'custom' && (
          <input
            type="color"
            value={field.color}
            aria-label={`${copy.log.color} (custom)`}
            onChange={(e) => onChange(e.target.value.toUpperCase())}
          />
        )}
      </div>
    </div>
  );
}

function FieldEditor({ field, onChange }: { field: LogField; onChange(f: LogField): void }) {
  const toggle = (a: ColorAttr) =>
    onChange({ ...field, attrs: field.attrs.includes(a) ? field.attrs.filter((x) => x !== a) : [...field.attrs, a] });
  const isNewline = field.placeholder === '%n';
  if (isNewline) return null;
  return (
    <div className="field-body">
      <ColorPicker field={field} onChange={(color) => onChange({ ...field, color })} />
      <div className="field">
        <span className="label">{copy.log.style}</span>
        <div className="attr-toggles">
          {COLOR_ATTRS.map((a) => (
            <button
              key={a}
              type="button"
              className="btn btn-small"
              aria-pressed={field.attrs.includes(a)}
              onClick={() => toggle(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label htmlFor={`w-${field.uid}`}>{copy.log.width}</label>
        <input
          id={`w-${field.uid}`}
          type="number"
          min={0}
          max={200}
          value={field.width}
          title={copy.log.widthHelp}
          onChange={(e) => onChange({ ...field, width: Math.max(0, Math.min(200, Number(e.target.value) || 0)) })}
        />
      </div>
      {field.width > 0 && (
        <>
          <div className="field">
            <label htmlFor={`a-${field.uid}`}>{copy.log.align}</label>
            <select
              id={`a-${field.uid}`}
              value={field.align}
              onChange={(e) => onChange({ ...field, align: e.target.value as LogField['align'] })}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor={`t-${field.uid}`}>{copy.log.trunc}</label>
            <select
              id={`t-${field.uid}`}
              value={field.trunc}
              onChange={(e) => onChange({ ...field, trunc: e.target.value as LogField['trunc'] })}
            >
              <option value="trunc">Cut the end..</option>
              <option value="ltrunc">..Cut the start</option>
              <option value="mtrunc">Cut the ..middle</option>
              <option value="none">Don't cut</option>
            </select>
          </div>
        </>
      )}
    </div>
  );
}

export function FieldList({ recipe, onChange, onFocusField, warnings }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [toAdd, setToAdd] = useState('%ae');

  const fields = recipe.fields;
  const setFields = (next: LogField[]) => onChange({ ...recipe, fields: next });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= fields.length || from === to) return;
    const next = [...fields];
    const [f] = next.splice(from, 1);
    next.splice(to, 0, f!);
    setFields(next);
  };

  return (
    <section className="panel" aria-labelledby="fields-title">
      <h2 id="fields-title">{copy.log.fields}</h2>
      <ol className="field-list">
        {fields.map((f, i) => {
          const def = fieldDef(f.placeholder);
          const swatch = f.color === 'auto' ? 'var(--refs)' : cssColor(f.color) ?? 'var(--fg)';
          return (
            <li
              key={f.uid}
              className={`field-item${overIdx === i ? ' is-drag-over' : ''}`}
              draggable
              onDragStart={() => setDragIdx(i)}
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDragLeave={() => setOverIdx(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIdx !== null) move(dragIdx, i);
                setDragIdx(null);
                setOverIdx(null);
              }}
              onMouseEnter={() => onFocusField(f.uid)}
              onMouseLeave={() => onFocusField(null)}
              onFocus={() => onFocusField(f.uid)}
            >
              <div className="field-head">
                <span className="grip" aria-hidden="true">⋮⋮</span>
                <span className="swatch" style={{ background: swatch }} aria-hidden="true" />
                <button
                  type="button"
                  className="btn-link field-label"
                  aria-expanded={open === f.uid}
                  onClick={() => setOpen(open === f.uid ? null : f.uid)}
                >
                  {def?.label ?? f.placeholder}
                  <small>{f.placeholder}</small>
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-icon"
                  aria-label={`${copy.log.moveUp}: ${def?.label}`}
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-icon"
                  aria-label={`${copy.log.moveDown}: ${def?.label}`}
                  disabled={i === fields.length - 1}
                  onClick={() => move(i, i + 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn-small btn-icon"
                  aria-label={`${copy.log.removeField}: ${def?.label}`}
                  onClick={() => setFields(fields.filter((x) => x.uid !== f.uid))}
                >
                  ×
                </button>
              </div>
              {warnings.get(f.uid) && (
                <p className="help" style={{ color: 'var(--warn)', padding: '0 10px 8px', margin: 0 }}>
                  {warnings.get(f.uid)}
                </p>
              )}
              {open === f.uid && (
                <FieldEditor field={f} onChange={(nf) => setFields(fields.map((x) => (x.uid === f.uid ? nf : x)))} />
              )}
            </li>
          );
        })}
      </ol>
      <div className="inline-field">
        <label htmlFor="add-field" className="sr-only">
          {copy.log.addField}
        </label>
        <select id="add-field" value={toAdd} onChange={(e) => setToAdd(e.target.value)}>
          {GROUPS.map((g) => (
            <optgroup key={g} label={g}>
              {FIELD_DEFS.filter((d) => d.group === g).map((d) => (
                <option key={d.placeholder} value={d.placeholder}>
                  {d.label} ({d.placeholder})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => setFields([...fields, makeField(toAdd)])}>
          {copy.log.addField}
        </button>
      </div>
    </section>
  );
}
