import { useState } from 'react';
import { X } from 'lucide-react';

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  method: 'momo' | 'paypal';
  amount?: number;
};

export default function PaymentModal({ isOpen, onClose, method, amount }: PaymentModalProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(amount?.toString() || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-[#FF8C00]">
            {method === 'momo' ? 'MTN MoMo Payment' : 'PayPal Payment'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#00FF7F] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold text-[#00FF7F] mb-2">Payment Successful!</h4>
            <p className="text-gray-400">Your payment has been processed.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {method === 'momo' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="078XXXXXXX"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                  required
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                  required
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Amount (RWF)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00FF7F]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-[#00FF7F] text-black py-3 rounded-lg font-semibold hover:bg-[#00DD6F] transition-all disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Confirm Payment'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
