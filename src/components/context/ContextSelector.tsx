import { useState } from 'react';
import { ROLE_OPTIONS, CONCERN_OPTIONS } from '../../lib/domain';
import type { RoleId, ConcernId } from '../../lib/domain';
import styles from './ContextSelector.module.css';

interface ContextSelectorProps {
  onStartAnalysis: (roleId: RoleId, concernId: ConcernId) => void;
  isDemoMode: boolean;
  error?: string | null;
  initialRoleId?: RoleId;
  initialConcernId?: ConcernId;
}

export function ContextSelector({
  onStartAnalysis,
  isDemoMode,
  error,
  initialRoleId,
  initialConcernId,
}: ContextSelectorProps) {
  const [roleId, setRoleId] = useState<RoleId>(initialRoleId ?? ROLE_OPTIONS[0].id);
  const [concernId, setConcernId] = useState<ConcernId>(initialConcernId ?? CONCERN_OPTIONS[0].id);

  const selectedRole = ROLE_OPTIONS.find(r => r.id === roleId)!;
  const selectedConcern = CONCERN_OPTIONS.find(c => c.id === concernId)!;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {isDemoMode && (
          <div className={styles.demoBanner} aria-label="Demo mode active">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="7" fill="#BFDBFE" />
              <path d="M7 4v3l2 2" stroke="#1E40AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Demo mode — no API quota used
          </div>
        )}

        <header className={styles.header}>
          <h1 className={`text-h2 ${styles.heading}`}>
            {isDemoMode ? 'Choose your demo context' : 'Define your context'}
          </h1>
          <p className="text-body">
            Contextualis adapts findings to your role and primary concern. The same document produces different insights for different readers.
          </p>
        </header>

        {error && (
          <div className={styles.errorAlert} role="alert" aria-live="assertive">
            <div className={styles.errorHeader}>
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="var(--color-severity-high)" strokeWidth="2" />
                <path d="M10 6v5" stroke="var(--color-severity-high)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="10" cy="14" r="1.25" fill="var(--color-severity-high)" />
              </svg>
              <p className={styles.errorTitle}>Demo Lens Limitation</p>
            </div>
            <p className="text-small">{error}</p>
          </div>
        )}

        <section className={styles.section} aria-labelledby="role-heading">
          <h2 id="role-heading" className={styles.sectionLabel}>Your role</h2>
          <div className={styles.chipGroup} role="group" aria-labelledby="role-heading">
            {ROLE_OPTIONS.map(r => (
              <button
                type="button"
                key={r.id}
                data-testid={`role-chip-${r.id}`}
                className={`${styles.chip} ${roleId === r.id ? styles.chipActive : ''}`}
                onClick={() => setRoleId(r.id)}
                aria-pressed={roleId === r.id}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p
            className={`text-small ${styles.roleDescription}`}
            aria-live="polite"
            aria-atomic="true"
          >
            {selectedRole.description}
          </p>
        </section>

        <section className={styles.section} aria-labelledby="concern-heading">
          <h2 id="concern-heading" className={styles.sectionLabel}>Primary concern</h2>
          <div className={styles.chipGroup} role="group" aria-labelledby="concern-heading">
            {CONCERN_OPTIONS.map(c => (
              <button
                type="button"
                key={c.id}
                data-testid={`concern-chip-${c.id}`}
                className={`${styles.chip} ${concernId === c.id ? styles.chipActive : ''}`}
                onClick={() => setConcernId(c.id)}
                aria-pressed={concernId === c.id}
              >
                {c.label}
              </button>
            ))}
          </div>
        </section>

        <div className={styles.footer}>
          <p
            className={`text-small ${styles.contextPreview}`}
            aria-live="polite"
            aria-atomic="true"
          >
            Analysing as: <strong>{selectedRole.label}</strong> · <strong>{selectedConcern.label}</strong>
          </p>
          <button
            type="button"
            id="start-analysis-btn"
            data-testid="start-analysis-btn"
            className="button-primary"
            onClick={() => onStartAnalysis(roleId, concernId)}
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            {isDemoMode ? 'Run Demo Analysis' : 'Analyze Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
