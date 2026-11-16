/** Required by the Amazon Associates agreement and FTC rules wherever affiliate links appear. */
export function AffiliateDisclosure({ className = '' }: { className?: string }) {
  return (
    <p className={`font-body text-[11px] leading-snug text-[var(--text-tertiary)] ${className}`}>
      As an Amazon Associate we earn from qualifying purchases. Links open Amazon in a new tab.
    </p>
  );
}
