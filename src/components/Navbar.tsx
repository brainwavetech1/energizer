import { useState } from 'react';
import { CreditCard, ChevronDown } from 'lucide-react';

type NavbarProps = {
  onPaymentClick: (method: 'momo' | 'paypal') => void;
};

export default function Navbar({ onPaymentClick }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <div className="bg-black border-b border-gray-800 px-6 py-4 flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold text-[#FF8C00]">Energy Dashboard</h2>
        <p className="text-sm text-gray-400">Smart Energy Management</p>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 bg-[#FF8C00] text-black px-6 py-3 rounded-lg font-semibold hover:bg-[#FF7F00] transition-all"
        >
          <CreditCard size={20} />
          <span>Pay Energy Bill</span>
          <ChevronDown size={16} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-xl border border-gray-800 overflow-hidden z-50">
            <button
              onClick={() => {
                onPaymentClick('momo');
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-800 text-white transition-colors"
            >
              MTN MoMo
            </button>
            <button
              onClick={() => {
                onPaymentClick('paypal');
                setIsDropdownOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-gray-800 text-white transition-colors border-t border-gray-800"
            >
              PayPal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
