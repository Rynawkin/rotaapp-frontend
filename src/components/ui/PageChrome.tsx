import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}

interface PageAlertProps {
  message: string;
  title?: string;
}

interface PageLoadingProps {
  label?: string;
}

interface PageEmptyStateProps {
  title: string;
  description: string;
  backTo?: string;
  backLabel?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  backTo,
  backLabel = 'Listeye Dön',
  eyebrow,
  actions
}) => {
  return (
    <section className="app-surface px-6 py-5 lg:px-7 lg:py-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          {backTo && (
            <Link
              to={backTo}
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{backLabel}</span>
            </Link>
          )}
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-950">{title}</h1>
          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {actions}
          </div>
        )}
      </div>
    </section>
  );
};

export const PageAlert: React.FC<PageAlertProps> = ({ message, title = 'Hata' }) => {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-rose-900 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-rose-100 p-1.5 text-rose-600">
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-rose-800">{message}</p>
        </div>
      </div>
    </div>
  );
};

export const PageLoading: React.FC<PageLoadingProps> = ({ label = 'Ekran yükleniyor...' }) => {
  return (
    <div className="app-surface flex min-h-[280px] items-center justify-center px-6 py-12">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="rounded-full border border-slate-200 bg-white p-3 text-slate-700 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  );
};

export const PageEmptyState: React.FC<PageEmptyStateProps> = ({
  title,
  description,
  backTo,
  backLabel = 'Listeye Dön'
}) => {
  return (
    <div className="app-surface flex min-h-[320px] items-center justify-center px-6 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        {backTo && (
          <Link
            to={backTo}
            className="app-button-primary mt-5 inline-flex"
          >
            {backLabel}
          </Link>
        )}
      </div>
    </div>
  );
};
