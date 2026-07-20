/* Ícones monocromáticos/marca dos provedores (SVG inline). */

export function GoogleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1 2.6-2.1 3.4v2.8h3.4c2-1.8 3.1-4.5 3.1-7.7 0-.7-.06-1.4-.18-2.1H12z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.4-2.8c-.9.6-2.1 1-3.3 1-2.6 0-4.8-1.7-5.6-4.1H3v2.9C4.7 19.9 8.1 22 12 22z" />
      <path fill="#4A90D9" d="M6.4 13.7c-.2-.6-.3-1.2-.3-1.7s.1-1.1.3-1.7V7.4H3C2.4 8.8 2 10.4 2 12s.4 3.2 1 4.6l3.4-2.9z" />
      <path fill="#FBBC05" d="M12 5.8c1.5 0 2.8.5 3.8 1.5l2.9-2.9C16.9 2.7 14.7 2 12 2 8.1 2 4.7 4.1 3 7.4l3.4 2.9C7.2 7.5 9.4 5.8 12 5.8z" />
    </svg>
  );
}

export function FacebookIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path fill="#1877F2" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.75-1.6 1.5V12h2.7l-.43 2.9h-2.3v7A10 10 0 0 0 22 12z" />
    </svg>
  );
}

export function AppleIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85-.72 0-1.86-.83-3.06-.8-1.57.02-3.02.91-3.83 2.32-1.64 2.84-.42 7.04 1.17 9.35.78 1.13 1.7 2.4 2.9 2.35 1.17-.05 1.6-.75 3.02-.75 1.4 0 1.8.75 3.03.73 1.25-.02 2.04-1.15 2.8-2.29.88-1.31 1.24-2.58 1.26-2.65-.03-.01-2.42-.93-2.44-3.68zM14.1 5.6c.64-.78 1.07-1.86.95-2.94-.92.04-2.04.61-2.7 1.39-.59.69-1.11 1.79-.97 2.85 1.03.08 2.08-.52 2.72-1.3z" />
    </svg>
  );
}

/** Marca simplificada da WCA (cubo). */
export function WcaIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="3" fill="#fff" stroke="#e5e7eb" strokeWidth="0.5" />
      <g>
        <rect x="5.5" y="5.5" width="3.6" height="3.6" rx="0.7" fill="#e11d2e" />
        <rect x="10.2" y="5.5" width="3.6" height="3.6" rx="0.7" fill="#111" />
        <rect x="14.9" y="5.5" width="3.6" height="3.6" rx="0.7" fill="#009e60" />
        <rect x="5.5" y="10.2" width="3.6" height="3.6" rx="0.7" fill="#ffd500" />
        <rect x="10.2" y="10.2" width="3.6" height="3.6" rx="0.7" fill="#fff" stroke="#ddd" strokeWidth="0.4" />
        <rect x="14.9" y="10.2" width="3.6" height="3.6" rx="0.7" fill="#0051ba" />
        <rect x="5.5" y="14.9" width="3.6" height="3.6" rx="0.7" fill="#111" />
        <rect x="10.2" y="14.9" width="3.6" height="3.6" rx="0.7" fill="#ff5800" />
        <rect x="14.9" y="14.9" width="3.6" height="3.6" rx="0.7" fill="#e11d2e" />
      </g>
    </svg>
  );
}
