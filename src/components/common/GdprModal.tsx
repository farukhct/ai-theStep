import React, { useState } from 'react';
import { ShieldCheck, Download, Trash2, X, Lock, FileCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useStore } from '../../context/StoreContext';
import { useNotification } from '../../context/NotificationContext';

interface GdprModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GdprModal: React.FC<GdprModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { gdprExportUserData, gdprEraseUserData } = useStore();
  const { addToast } = useNotification();
  const [confirmErase, setConfirmErase] = useState(false);

  if (!isOpen) return null;

  const userEmail = currentUser?.email || 'customer@example.com';

  const handleExportData = () => {
    const data = gdprExportUserData(userEmail);
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AURA_GDPR_Data_Export_${userEmail}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Data Exported', 'Your personal data package has been downloaded.', 'success');
  };

  const handleEraseData = async () => {
    await gdprEraseUserData(userEmail);
    setConfirmErase(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-900 text-white">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base font-bold">Privacy & Compliance Center</h3>
              <p className="text-xs text-neutral-400">GDPR & SOC2 Certified Data Protection Controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 text-xs text-neutral-700">
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-emerald-950 text-sm">International Privacy Standard Compliance</h4>
              <p className="text-emerald-800 mt-1 leading-relaxed">
                AURA ATELIER complies with the General Data Protection Regulation (GDPR) and SOC2 Trust Services Criteria for security, confidentiality, and processing integrity.
              </p>
            </div>
          </div>

          {/* Action 1: Export Data */}
          <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-neutral-950 text-xs">Right to Data Portability (Article 20)</h4>
              <p className="text-neutral-500 mt-0.5">
                Download a machine-readable JSON copy of all your profile records, orders, and delivery addresses for <span className="font-semibold text-neutral-800">{userEmail}</span>.
              </p>
            </div>
            <button
              onClick={handleExportData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg shrink-0 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON</span>
            </button>
          </div>

          {/* Action 2: Right to Erasure */}
          <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h4 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Right to Erasure / Forgotten (Article 17)</span>
                </h4>
                <p className="text-rose-800 mt-1">
                  Permanently redact and anonymize your personal phone numbers, emails, and physical street addresses from our database records.
                </p>
              </div>
            </div>

            {!confirmErase ? (
              <button
                onClick={() => setConfirmErase(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Request Account Data Erasure</span>
              </button>
            ) : (
              <div className="p-3 bg-white rounded-lg border border-rose-300 space-y-2 animate-in fade-in">
                <p className="font-bold text-rose-950 text-xs">
                  Are you sure? This action is permanent and cannot be undone.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleEraseData}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-md cursor-pointer"
                  >
                    Confirm & Redact Data
                  </button>
                  <button
                    onClick={() => setConfirmErase(false)}
                    className="px-3 py-1.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-medium rounded-md cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
