import React from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info, ShieldAlert } from 'lucide-react';

export default function SeverityBadge({ severity, size = 'md' }) {
  const norm = (severity || 'low').toLowerCase();

  const config = {
    critical: {
      label: 'Critical',
      icon: AlertOctagon,
      className: 'badge-critical'
    },
    high: {
      label: 'High',
      icon: AlertTriangle,
      className: 'badge-high'
    },
    medium: {
      label: 'Medium',
      icon: AlertCircle,
      className: 'badge-medium'
    },
    low: {
      label: 'Low',
      icon: Info,
      className: 'badge-low'
    },
    informational: {
      label: 'Informational',
      icon: ShieldAlert,
      className: 'badge-info'
    },
    info: {
      label: 'Informational',
      icon: ShieldAlert,
      className: 'badge-info'
    }
  };

  const current = config[norm] || config.low;
  const Icon = current.icon;
  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;

  return (
    <span className={`severity-badge ${current.className} badge-${size}`}>
      <Icon size={iconSize} className="badge-icon" />
      <span>{current.label}</span>
    </span>
  );
}
