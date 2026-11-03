import React from 'react';
import { ShieldCheck, AlertTriangle, AlertCircle, Clock, UserCheck, ArrowRightCircle, Check } from 'lucide-react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  if (normalized.includes('aman') || normalized.includes('terverifikasi') || normalized.includes('sudah dikembalikan')) {
    return (
      <span className="badge badge-aman">
        <ShieldCheck size={13} />
        {status}
      </span>
    );
  }

  if (normalized.includes('perlu perhatian') || normalized.includes('menunggu') || normalized.includes('dititipkan')) {
    return (
      <span className="badge badge-perhatian">
        <Clock size={13} />
        {status}
      </span>
    );
  }

  if (normalized.includes('insiden') || normalized.includes('dibatalkan')) {
    return (
      <span className="badge badge-insiden">
        <AlertCircle size={13} />
        {status}
      </span>
    );
  }

  if (normalized.includes('sedang berkunjung')) {
    return (
      <span className="badge badge-sedang-berkunjung">
        <ArrowRightCircle size={13} />
        {status}
      </span>
    );
  }

  return (
    <span className="badge badge-selesai">
      <Check size={13} />
      {status}
    </span>
  );
};

export default StatusBadge;
