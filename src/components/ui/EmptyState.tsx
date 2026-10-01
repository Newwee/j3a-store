import React from 'react';
import { PackageOpen } from 'lucide-react';
import { Button } from './Button';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon = <PackageOpen className="w-12 h-12 text-slate-500" />,
  title,
  description,
  actionText,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm my-6">
      <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-slate-400 max-w-md mb-6">{description}</p>
      {actionText && (
        actionHref ? (
          <Link href={actionHref}>
            <Button variant="neon" size="md">
              {actionText}
            </Button>
          </Link>
        ) : onAction ? (
          <Button variant="neon" size="md" onClick={onAction}>
            {actionText}
          </Button>
        ) : null
      )}
    </div>
  );
}
