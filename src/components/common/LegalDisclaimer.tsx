import styles from './LegalDisclaimer.module.css';

export function LegalDisclaimer() {
  return (
    <div className={styles.disclaimer} role="note" aria-label="Legal disclaimer">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginTop: '1px' }}>
        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 4.5v3M7 9v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className={styles.text}>
        Contextualis highlights document content based on your stated context. It does not provide legal advice and does not replace a qualified legal professional.
      </p>
    </div>
  );
}
