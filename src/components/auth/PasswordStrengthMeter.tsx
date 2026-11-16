import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface PasswordStrengthMeterProps {
  password: string;
  minLength?: number;
  personalTerms?: string[];
}

export function evaluatePasswordStrength(password: string, minLength = 8) {
  let score = 0;
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 25;
  if (password.length >= 16) score += 20;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[^a-zA-Z0-9\s]/.test(password) || /\s+/.test(password.trim())) score += 15;
  if (password.length < minLength) score = Math.min(score, 35);

  let label = 'Very Weak';
  let barColor = 'bg-rose-500';
  let textColor = 'text-rose-600';

  if (score >= 85) {
    label = 'Very Strong';
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-600';
  } else if (score >= 65) {
    label = 'Strong';
    barColor = 'bg-emerald-500';
    textColor = 'text-emerald-600';
  } else if (score >= 45) {
    label = 'Fair';
    barColor = 'bg-amber-500';
    textColor = 'text-amber-600';
  } else if (score >= 25) {
    label = 'Weak';
    barColor = 'bg-orange-500';
    textColor = 'text-orange-600';
  }

  return { score, label, barColor, textColor, meetsMin: password.length >= minLength };
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({
  password,
  minLength = 8,
  personalTerms = []
}) => {
  if (!password) {
    return (
      <p className="text-[11px] text-neutral-500 mt-1">
        Use at least {minLength} characters without your name or email. Long passphrases work best.
      </p>
    );
  }

  const info = evaluatePasswordStrength(password, minLength);
  const normalizedPw = password.trim().toLowerCase().replace(/\s+/g, '');
  const containsPersonalTerm = personalTerms.some((term) => {
    const clean = (term || '').trim().toLowerCase();
    return clean.length >= 4 && normalizedPw.includes(clean);
  });

  return (
    <div className="mt-1.5 space-y-1.5">
      <div className="flex items-center justify-between text-[11px]">
        <span className={`font-semibold ${info.textColor}`}>
          Strength: {info.label}
        </span>
        <span className="font-mono-num text-neutral-500">
          {password.length} / {minLength}+ chars
        </span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-neutral-200 overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ${info.barColor}`}
          style={{ width: `${info.score}%` }}
        />
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        {info.meetsMin && !containsPersonalTerm ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-emerald-700">Meets {minLength}+ character length policy</span>
          </>
        ) : containsPersonalTerm ? (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="text-rose-700">Avoid including your name, username, or email in your password</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-amber-700">Minimum {minLength} characters required</span>
          </>
        )}
      </div>
    </div>
  );
};
