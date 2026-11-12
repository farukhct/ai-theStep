import React, { useState } from 'react';
import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SizeGuideModal: React.FC<SizeGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'tshirts' | 'shirts' | 'chinos' | 'panjabi'>('tshirts');
  const [unit, setUnit] = useState<'inches' | 'cm'>('inches');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-neutral-900 text-white rounded-lg">
              <Ruler className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-950">AURA Garments Size Matrix</h3>
              <p className="text-xs text-neutral-500">Standard tailored fit specifications for Bangladesh market</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-neutral-200/80 rounded-lg p-0.5 text-xs font-semibold">
              <button
                onClick={() => setUnit('inches')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  unit === 'inches' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-600'
                }`}
              >
                Inches (")
              </button>
              <button
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  unit === 'cm' ? 'bg-white text-neutral-950 shadow-xs' : 'text-neutral-600'
                }`}
              >
                CM
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-900 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Garment Type Tabs */}
        <div className="flex border-b border-neutral-200 bg-white text-xs font-semibold px-5 pt-3 gap-6">
          <button
            onClick={() => setActiveTab('tshirts')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'tshirts' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            T-Shirts & Polos
          </button>
          <button
            onClick={() => setActiveTab('shirts')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'shirts' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Oxford Shirts
          </button>
          <button
            onClick={() => setActiveTab('chinos')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'chinos' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Trousers & Chinos
          </button>
          <button
            onClick={() => setActiveTab('panjabi')}
            className={`pb-3 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'panjabi' ? 'border-neutral-900 text-neutral-950' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            Traditional Panjabi
          </button>
        </div>

        {/* Measurement Table */}
        <div className="p-6">
          {activeTab === 'tshirts' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Size</th>
                  <th className="py-2.5">Chest (Round)</th>
                  <th className="py-2.5">Body Length</th>
                  <th className="py-2.5">Sleeve Length</th>
                  <th className="py-2.5">Shoulder</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">S (Small)</td>
                  <td className="py-3">{unit === 'inches' ? '38"' : '96.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '27"' : '68.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '8.0"' : '20.3 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '17.5"' : '44.5 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">M (Medium)</td>
                  <td className="py-3">{unit === 'inches' ? '40"' : '101.6 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '28"' : '71.1 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '8.5"' : '21.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '18.5"' : '47.0 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">L (Large)</td>
                  <td className="py-3">{unit === 'inches' ? '42"' : '106.7 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '29"' : '73.6 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '9.0"' : '22.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '19.5"' : '49.5 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">XL (Extra Large)</td>
                  <td className="py-3">{unit === 'inches' ? '44"' : '111.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '30"' : '76.2 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '9.5"' : '24.1 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '20.5"' : '52.0 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">XXL (Double XL)</td>
                  <td className="py-3">{unit === 'inches' ? '46"' : '116.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '31"' : '78.7 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '10.0"' : '25.4 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '21.5"' : '54.6 cm'}</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'shirts' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Collar Size</th>
                  <th className="py-2.5">Chest</th>
                  <th className="py-2.5">Shirt Length</th>
                  <th className="py-2.5">Sleeve</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">15.0" (S)</td>
                  <td className="py-3">{unit === 'inches' ? '39"' : '99.0 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '29.5"' : '75.0 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '32.5"' : '82.5 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">15.5" (M)</td>
                  <td className="py-3">{unit === 'inches' ? '41"' : '104.1 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '30.0"' : '76.2 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '33.5"' : '85.0 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">16.0" (L)</td>
                  <td className="py-3">{unit === 'inches' ? '43"' : '109.2 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '30.5"' : '77.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '34.5"' : '87.6 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">16.5" (XL)</td>
                  <td className="py-3">{unit === 'inches' ? '45"' : '114.3 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '31.0"' : '78.7 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '35.5"' : '90.1 cm'}</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'chinos' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Waist Size</th>
                  <th className="py-2.5">Hip</th>
                  <th className="py-2.5">Thigh</th>
                  <th className="py-2.5">Length (Inseam)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">30"</td>
                  <td className="py-3">{unit === 'inches' ? '38"' : '96.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '22"' : '55.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '30"' : '76.2 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">32"</td>
                  <td className="py-3">{unit === 'inches' ? '40"' : '101.6 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '23"' : '58.4 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '31"' : '78.7 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">34"</td>
                  <td className="py-3">{unit === 'inches' ? '42"' : '106.7 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '24"' : '61.0 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '32"' : '81.3 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">36"</td>
                  <td className="py-3">{unit === 'inches' ? '44"' : '111.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '25"' : '63.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '32"' : '81.3 cm'}</td>
                </tr>
              </tbody>
            </table>
          )}

          {activeTab === 'panjabi' && (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-500 uppercase tracking-wider text-[11px]">
                  <th className="py-2.5">Panjabi Size</th>
                  <th className="py-2.5">Chest</th>
                  <th className="py-2.5">Length</th>
                  <th className="py-2.5">Sleeve</th>
                  <th className="py-2.5">Collar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-mono">
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">38 (S)</td>
                  <td className="py-3">{unit === 'inches' ? '40"' : '101.6 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '40"' : '101.6 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '24.5"' : '62.2 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '15.0"' : '38.1 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">40 (M)</td>
                  <td className="py-3">{unit === 'inches' ? '42"' : '106.7 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '42"' : '106.7 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '25.0"' : '63.5 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '15.5"' : '39.3 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">42 (L)</td>
                  <td className="py-3">{unit === 'inches' ? '44"' : '111.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '44"' : '111.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '25.5"' : '64.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '16.0"' : '40.6 cm'}</td>
                </tr>
                <tr>
                  <td className="py-3 font-bold text-neutral-950 font-sans">44 (XL)</td>
                  <td className="py-3">{unit === 'inches' ? '46"' : '116.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '46"' : '116.8 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '26.0"' : '66.0 cm'}</td>
                  <td className="py-3">{unit === 'inches' ? '16.5"' : '41.9 cm'}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>

        {/* Tip */}
        <div className="p-4 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-500 flex items-center justify-between">
          <p>Fit Advice: For a relaxed streetwear drape on T-shirts, order one size up.</p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-900 text-white rounded-lg font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
