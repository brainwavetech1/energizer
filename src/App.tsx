import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import PaymentModal from './components/PaymentModal';
import PredictionSection from './components/PredictionSection';
import AnalysisSection from './components/AnalysisSection';
import ReportsSection from './components/ReportsSection';
import AdminSection from './components/AdminSection';
import SettingsSection from './components/SettingsSection';

function App() {
  const [activeSection, setActiveSection] = useState('prediction');
  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'paypal' | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handlePaymentClick = (method: 'momo' | 'paypal') => {
    setPaymentMethod(method);
    setShowPaymentModal(true);
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'admin':
        return <AdminSection />;
      case 'prediction':
        return <PredictionSection />;
      case 'analysis':
        return <AnalysisSection />;
      case 'reports':
        return <ReportsSection />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <PredictionSection />;
    }
  };

  return (
    <div className="min-h-screen bg-black flex">
      <Sidebar activeSection={activeSection} setActiveSection={setActiveSection} />

      <div className="flex-1 flex flex-col">
        <Navbar onPaymentClick={handlePaymentClick} />

        <main className="flex-1 p-6 overflow-y-auto">
          {renderSection()}
        </main>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        method={paymentMethod || 'momo'}
      />
    </div>
  );
}

export default App;
