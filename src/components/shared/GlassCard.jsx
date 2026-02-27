'use client';

/**
 * GlassCard Component - 3 variants per Spec §1.6
 * @param {string} variant - 'primary' | 'standard' | 'secondary'
 * @param {string} stripeColor - CSS color for left stripe
 * @param {function} onClick - Click handler (drill-down)
 * @param {string} className - Additional classes
 */
export default function GlassCard({
  variant = 'standard',
  stripeColor,
  onClick,
  className = '',
  children,
}) {
  const cardClass = {
    primary: 'glass-card-primary p-card-primary-mobile lg:p-card-primary-desktop',
    standard: 'glass-card p-card-mobile lg:p-card-desktop',
    secondary: 'glass-card-secondary p-card-secondary-mobile lg:p-card-secondary-desktop',
  }[variant];

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={`relative w-full text-left ${cardClass} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={stripeColor ? { '--stripe-color': stripeColor } : undefined}
    >
      {/* Side Stripe (3px left) */}
      {stripeColor && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-card"
          style={{ backgroundColor: stripeColor }}
        />
      )}

      {children}
    </Component>
  );
}
