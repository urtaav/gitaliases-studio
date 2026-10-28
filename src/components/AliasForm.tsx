import { useId, useState } from 'react';
import { copy } from '../copy';
import { detectRisk } from '../core/risk';
import { inferType, validateName, validateValue } from '../core/validate';
import { recipeOf } from '../studio/openInDesigner';
import { RiskAck } from './RiskAck';
import type { Alias } from '../core/types';

interface Props {
  initial?: Alias;
  existingNames: string[];
  onSave(a: Alias, originalName?: string): void;
  onCancel(): void;
  onOpenInDesigner?(a: Alias): void;
}

export function AliasForm({ initial, existingNames, onSave, onCancel, onOpenInDesigner }: Props) {
  const id = useId();
  const startsShell = initial?.value.startsWith('!') ?? false;
  const [name, setName] = useState(initial?.name ?? '');
  const [advanced, setAdvanced] = useState(startsShell);
  const [value, setValue] = useState(startsShell ? initial!.value.slice(1) : (initial?.value ?? ''));
  const [description, setDescription] = useState(initial?.description ?? '');
  const [touched, setTouched] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const finalValue = advanced ? `!${value.replace(/^!/, '')}` : value.trim();
  const risk = detectRisk(finalValue);
  const needsAck = risk === 'destructive' && !acknowledged;
  const issues = [
    ...validateName(name.trim(), existingNames, initial?.name),
    ...validateValue(advanced ? value : finalValue),
  ];
  const isDesigned = initial !== undefined && initial.type !== 'shortcut' && initial.type !== 'shell';
  const designable = initial !== undefined && recipeOf(initial) !== null;
  const unchanged = initial !== undefined && finalValue === initial.value;

  const save = () => {
    setTouched(true);
    if (issues.length || needsAck) return;
    onSave(
      {
        name: name.trim().toLowerCase(),
        // Keep the designer type and recipe only while the value is untouched.
        value: finalValue,
        type: unchanged ? initial!.type : inferType(finalValue),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(unchanged && initial?.recipe ? { recipe: initial.recipe } : {}),
        ...(risk ? { risk } : {}),
      },
      initial?.name,
    );
  };

  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      aria-labelledby={`${id}-title`}
    >
      <h3 id={`${id}-title`}>{initial ? copy.form.titleEdit : copy.form.titleNew}</h3>

      {isDesigned && (
        <div className="btn-row" style={{ marginBottom: 12 }}>
          {designable && onOpenInDesigner ? (
            <button type="button" className="btn" onClick={() => onOpenInDesigner(initial!)}>
              {copy.form.openDesigner}
            </button>
          ) : (
            <span className="help">{copy.form.rawLog}</span>
          )}
        </div>
      )}

      <div className="field">
        <label htmlFor={`${id}-name`}>{copy.form.name}</label>
        <span className="help" id={`${id}-name-help`}>{copy.form.nameHelp}</span>
        <div className="inline-field">
          <span className="muted">git</span>
          <input
            id={`${id}-name`}
            type="text"
            value={name}
            autoComplete="off"
            spellCheck={false}
            aria-describedby={`${id}-name-help`}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </div>
      </div>

      <div className="field">
        <label htmlFor={`${id}-value`}>{copy.form.value}</label>
        {!advanced && <span className="help">{copy.form.valueHelp}</span>}
        <div className="inline-field" style={{ width: '100%' }}>
          <span className="muted">{advanced ? '!' : 'git'}</span>
          <input
            id={`${id}-value`}
            type="text"
            value={value}
            autoComplete="off"
            spellCheck={false}
            style={{ flex: 1 }}
            onChange={(e) => setValue(e.target.value)}
            onBlur={() => setTouched(true)}
          />
        </div>
        <label className="check" style={{ marginTop: 6 }}>
          <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
          {copy.form.advanced}
        </label>
        {advanced && <span className="help">{copy.form.advancedWarn}</span>}
      </div>

      <div className="field">
        <label htmlFor={`${id}-desc`}>{copy.form.description}</label>
        <span className="help">{copy.form.descriptionHelp}</span>
        <input id={`${id}-desc`} type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <RiskAck
        risk={risk}
        checked={acknowledged}
        onChange={setAcknowledged}
        message="This command can delete changes that are not saved anywhere else."
      />

      {touched && issues.length > 0 && (
        <ul className="issues" aria-live="polite">
          {issues.map((i) => (
            <li key={i.code}>{i.message}</li>
          ))}
        </ul>
      )}

      <div className="btn-row" style={{ marginTop: 12 }}>
        <button type="submit" className="btn btn-primary" disabled={(touched && issues.length > 0) || needsAck}>
          {copy.form.save}
        </button>
        <button type="button" className="btn" onClick={onCancel}>
          {copy.form.cancel}
        </button>
      </div>
    </form>
  );
}
