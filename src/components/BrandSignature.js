import styles from '@styles/BrandSignature.module.css';

function FlowSymbol({ className }) {
  return (
    <svg
      viewBox="0 0 96 96"
      aria-hidden="true"
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="it-flow-shell" x1="12" y1="10" x2="84" y2="86">
          <stop offset="0%" stopColor="#14b8a6" />
          <stop offset="52%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="it-flow-wire" x1="20" y1="24" x2="72" y2="72">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="100%" stopColor="#f8fafc" />
        </linearGradient>
      </defs>

      <rect
        x="10"
        y="10"
        width="76"
        height="76"
        rx="24"
        fill="url(#it-flow-shell)"
      />
      <path
        d="M28 62V34.5C28 28.149 33.149 23 39.5 23H54"
        stroke="url(#it-flow-wire)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M54 23H67.5C73.299 23 78 27.701 78 33.5V45"
        stroke="url(#it-flow-wire)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M45 62H56.5C68.374 62 78 52.374 78 40.5V36"
        stroke="url(#it-flow-wire)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="28" cy="62" r="8" fill="#f8fafc" />
      <circle cx="54" cy="23" r="8" fill="#ccfbf1" />
      <circle cx="78" cy="36" r="8" fill="#dbeafe" />
      <path
        d="M46 70L60 70"
        stroke="#f8fafc"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M57 63L68 70L57 77"
        stroke="#f8fafc"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function BrandSignature({
  theme = 'light',
  size = 'md',
  subtitle = 'Operational clarity for every task.',
  compact = false,
  align = 'left',
  badge = 'Task orchestration platform',
}) {
  const classNames = [
    styles.brand,
    styles[`theme${theme.charAt(0).toUpperCase()}${theme.slice(1)}`],
    styles[`size${size.toUpperCase()}`],
    compact ? styles.compact : '',
    align === 'center' ? styles.alignCenter : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classNames}>
      <div className={styles.markWrap}>
        <FlowSymbol className={styles.mark} />
      </div>

      <div className={styles.copy}>
        {badge ? <span className={styles.badge}>{badge}</span> : null}
        <h1 className={styles.wordmark}>
          <span className={styles.wordIt}>IT</span>
          <span className={styles.wordFlow}> Flow</span>
        </h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
    </div>
  );
}
