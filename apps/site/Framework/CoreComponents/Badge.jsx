import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';

/**
 * Badge Component
 * 
 * Status/role badges with predefined styles.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {'success'|'warning'|'error'|'info'|'gold'|'default'} props.variant - Badge variant
 * @param {'filled'|'outline'|'ghost'} props.style - Badge style type
 * @param {'xs'|'sm'|'base'|'lg'} props.size - Badge size
 * @param {boolean} props.pulsing - Add pulse animation
 * @param {boolean} props.roundedFull - Fully rounded (pill) shape
 * @param {boolean} props.showDot - Show colored dot indicator
 * @param {string} props.className - Additional CSS classes
 */
export const Badge = ({
  children,
  variant = 'default',
  style = 'filled',
  size = 'sm',
  pulsing = false,
  roundedFull = true,
  showDot = false,
  className = '',
}) => {
  // Variant configurations
  const variantConfig = {
    success: {
      filled: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      outline: 'bg-transparent text-emerald-400 border-emerald-500/50',
      ghost: 'bg-emerald-500/10 text-emerald-400 border-transparent',
      dotColor: 'bg-emerald-400',
      icon: CheckCircle,
    },
    warning: {
      filled: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
      outline: 'bg-transparent text-amber-500 border-amber-500/50',
      ghost: 'bg-amber-500/10 text-amber-500 border-transparent',
      dotColor: 'bg-amber-500',
      icon: AlertCircle,
    },
    error: {
      filled: 'bg-red-500/15 text-red-400 border-red-500/30',
      outline: 'bg-transparent text-red-400 border-red-500/50',
      ghost: 'bg-red-500/10 text-red-400 border-transparent',
      dotColor: 'bg-red-400',
      icon: XCircle,
    },
    info: {
      filled: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      outline: 'bg-transparent text-blue-400 border-blue-500/50',
      ghost: 'bg-blue-500/10 text-blue-400 border-transparent',
      dotColor: 'bg-blue-400',
      icon: Info,
    },
    gold: {
      filled: 'bg-amber-500 text-slate-900 border-amber-500',
      outline: 'bg-transparent text-amber-500 border-amber-500',
      ghost: 'bg-amber-500/10 text-amber-500 border-transparent',
      dotColor: 'bg-amber-500',
      icon: null,
    },
    default: {
      filled: 'bg-slate-700 text-gray-300 border-slate-600',
      outline: 'bg-transparent text-gray-400 border-slate-600',
      ghost: 'bg-slate-700/30 text-gray-400 border-transparent',
      dotColor: 'bg-gray-400',
      icon: null,
    },
  };

  // Size configurations
  const sizeConfig = {
    xs: 'px-2 py-0.5 text-[10px] font-medium',
    sm: 'px-2.5 py-1 text-xs font-medium',
    base: 'px-3 py-1.5 text-sm font-medium',
    lg: 'px-4 py-2 text-sm font-medium',
  };

  const config = variantConfig[variant] || variantConfig.default;
  const sizeStyles = sizeConfig[size];
  const roundedStyle = roundedFull ? 'rounded-full' : 'rounded-md';
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeStyles} ${roundedStyle} border ${config[style]} ${pulsing ? 'animate-pulse' : ''} ${className}`}
      role="status"
      aria-label={variant}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotColor} ${pulsing ? 'animate-pulse' : ''}`} />}
      {Icon && variant !== 'gold' && variant !== 'default' && (
        <Icon className={`w-${size === 'xs' ? '3' : size === 'sm' ? '3.5' : '4'} h-${size === 'xs' ? '3' : size === 'sm' ? '3.5' : '4'} flex-shrink-0`} strokeWidth={2} />
      )}
      {children}
    </span>
  );
};

/**
 * StatusBadge - Pre-configured status badges
 */
export const StatusBadge = ({ status, className = '', ...props }) => {
  const statusMap = {
    active: { variant: 'success', label: 'Active' },
    confirmed: { variant: 'success', label: 'Confirmed' },
    completed: { variant: 'success', label: 'Completed' },
    online: { variant: 'success', label: 'Online' },
    paid: { variant: 'success', label: 'Paid' },

    pending: { variant: 'warning', label: 'Pending', pulsing: true },
    processing: { variant: 'warning', label: 'Processing', pulsing: true },
    in_progress: { variant: 'warning', label: 'In Progress', pulsing: true },
    scheduled: { variant: 'info', label: 'Scheduled' },

    cancelled: { variant: 'error', label: 'Cancelled' },
    failed: { variant: 'error', label: 'Failed' },
    offline: { variant: 'error', label: 'Offline' },
    unpaid: { variant: 'error', label: 'Unpaid' },

    draft: { variant: 'default', label: 'Draft' },
    archived: { variant: 'default', label: 'Archived' },
  };

  const config = statusMap[status?.toLowerCase()] || { variant: 'default', label: status || 'Unknown' };

  return (
    <Badge
      variant={config.variant}
      showDot={true}
      pulsing={config.pulsing || false}
      className={className}
      {...props}
    >
      {props.children || config.label}
    </Badge>
  );
};

/**
 * RoleBadge - User role badges
 */
export const RoleBadge = ({ role, className = '', ...props }) => {
  const roleMap = {
    admin: { variant: 'gold', label: 'Admin' },
    owner: { variant: 'gold', label: 'Owner' },
    manager: { variant: 'success', label: 'Manager' },
    staff: { variant: 'info', label: 'Staff' },
    barber: { variant: 'info', label: 'Barber' },
    receptionist: { variant: 'default', label: 'Receptionist' },
    customer: { variant: 'default', label: 'Customer' },
  };

  const config = roleMap[role?.toLowerCase()] || { variant: 'default', label: role || 'User' };

  return (
    <Badge
      variant={config.variant}
      showDot={false}
      className={className}
      {...props}
    >
      {props.children || config.label}
    </Badge>
  );
};

/**
 * CounterBadge - Badge with counter number
 */
export const CounterBadge = ({ count, max = 99, className = '', ...props }) => {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <Badge variant="gold" style="filled" size="xs" className={`font-bold ${className}`} {...props}>
      {displayCount}
    </Badge>
  );
};

/**
 * OutlineBadge variant
 */
export const BadgeOutline = (props) => <Badge style="outline" {...props} />;

/**
 * GhostBadge variant
 */
export const BadgeGhost = (props) => <Badge style="ghost" {...props} />;

export default Badge;
