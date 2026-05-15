import React, { useState } from 'react';
import API_BASE from './config';

// Optional component imports. If any of these files do not exist yet,
// either create them or comment out the corresponding import.
// import Clients from './components/Clients';
// import Suppliers from './components/Suppliers';
// import Products from './components/Products';
// import Inventory from './components/Inventory';
// import Invoices from './components/Invoices';
// import Payments from './components/Payments';
// import Accounting from './components/Accounting';
// import Returns from './components/Returns';
// import Reconciliation from './components/Reconciliation';
// import Challans from './components/Challans';
// import Notices from './components/Notices';
// import Settings from './components/Settings';

const modules = [
  'Dashboard',
  'Clients',
  'Suppliers',
  'Products',
  'Inventory',
  'Invoices',
  'Payments',
  'Accounting',
  'Returns',
  'Reconciliation',
  'Challans',
  'Notices',
  'Settings',
];

function Placeholder({ title, description }) {
  return (
    <div style={styles.card}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <p style={{ color: '#555', lineHeight: 1.6 }}>
        {description || `${title} module is ready. Connect your API endpoints and UI components here.`}
      </p>
      <div style={styles.infoBox}>
        API Base: <strong>{API_BASE}</strong>
      </div>
    </div>
  );
}

function Dashboard() {
  const cards = [
    { title: 'Clients', value: '0' },
    { title: 'Products', value: '0' },
    { title: 'Invoices', value: '0' },
    { title: 'Receivables', value: '₹0' },
    { title: 'Stock Value', value: '₹0' },
    { title: 'GST Due', value: '₹0' },
  ];

  return (
    <div>
      <h1 style={styles.pageTitle}>TaxPro GST & Accounting ERP</h1>
      <p style={styles.subtitle}>
        Unified GST filing, invoicing, inventory, and accounting platform.
      </p>

      <div style={styles.grid}>
        {cards.map((card) => (
          <div key={card.title} style={styles.statCard}>
            <div style={styles.statValue}>{card.value}</div>
            <div style={styles.statLabel}>{card.title}</div>
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <h2 style={{ marginTop: 0 }}>Welcome</h2>
        <p style={{ lineHeight: 1.7, color: '#444' }}>
          This ERP combines GST compliance and accounting into a single interface,
          similar to leading Indian business software. Manage clients, suppliers,
          products, stock, invoices, payments, ledgers, returns, and notices from
          one dashboard.
        </p>
      </div>
    </div>
  );
}

function renderModule(activeModule) {
  switch (activeModule) {
    case 'Dashboard':
      return <Dashboard />;

    // Replace Placeholder components with your actual imported components.
    case 'Clients':
      return <Placeholder title="Clients" description="Manage customers and GST registrations." />;

    case 'Suppliers':
      return <Placeholder title="Suppliers" description="Track vendors and purchase-related details." />;

    case 'Products':
      return <Placeholder title="Products" description="Maintain item master, HSN/SAC, rates, and GST." />;

    case 'Inventory':
      return <Placeholder title="Inventory" description="Monitor stock quantities, movements, and low stock alerts." />;

    case 'Invoices':
      return <Placeholder title="Invoices" description="Create GST-compliant tax invoices and e-invoice data." />;

    case 'Payments':
      return <Placeholder title="Payments" description="Record receipts and payments against invoices." />;

    case 'Accounting':
      return <Placeholder title="Accounting" description="Ledgers, Trial Balance, P&L, and Balance Sheet." />;

    case 'Returns':
      return <Placeholder title="Returns" description="Track GSTR-1, GSTR-3B, and annual return status." />;

    case 'Reconciliation':
      return <Placeholder title="Reconciliation" description="Compare books with GSTR-2A and GSTR-2B." />;

    case 'Challans':
      return <Placeholder title="Challans" description="Maintain tax payment challans and liabilities." />;

    case 'Notices':
      return <Placeholder title="Notices" description="Record GST notices and responses." />;

    case 'Settings':
      return <Placeholder title="Settings" description="Firm profile, logo, and application preferences." />;

    default:
      return <Dashboard />;
  }
}

export default function App() {
  const [activeModule, setActiveModule] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div style={styles.app}>
      <aside
        style={{
          ...styles.sidebar,
          width: sidebarOpen ? 260 : 72,
        }}
      >
        <div style={styles.brand}>
          <div style={styles.logo}>TP</div>
          {sidebarOpen && (
            <div>
              <div style={styles.brandTitle}>TaxPro</div>
              <div style={styles.brandSubtitle}>GST & ERP</div>
            </div>
          )}
        </div>

        <button
          style={styles.toggleButton}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>

        <nav style={styles.nav}>
          {modules.map((module) => {
            const active = activeModule === module;
            return (
              <button
                key={module}
                onClick={() => setActiveModule(module)}
                style={{
                  ...styles.navButton,
                  ...(active ? styles.navButtonActive : {}),
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                }}
                title={module}
              >
                {sidebarOpen ? module : module.charAt(0)}
              </button>
            );
          })}
        </nav>
      </aside>

      <main style={styles.main}>
        {renderModule(activeModule)}
      </main>
    </div>
  );
}

const styles = {
  app: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f7fb',
    fontFamily: 'Inter, Arial, sans-serif',
  },

  sidebar: {
    background: 'linear-gradient(180deg, #1f2937 0%, #111827 100%)',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.25s ease',
    boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
  },

  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },

  logo: {
    width: 42,
    height: 42,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
  },

  brandTitle: {
    fontSize: 18,
    fontWeight: 700,
  },

  brandSubtitle: {
    fontSize: 12,
    opacity: 0.75,
  },

  toggleButton: {
    margin: '10px 16px',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    cursor: 'pointer',
  },

  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: 16,
    overflowY: 'auto',
  },

  navButton: {
    border: 'none',
    background: 'transparent',
    color: '#d1d5db',
    padding: '12px 14px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
    textAlign: 'left',
    transition: 'all 0.2s ease',
  },

  navButtonActive: {
    background: 'rgba(37, 99, 235, 0.18)',
    color: '#ffffff',
    fontWeight: 600,
  },

  main: {
    flex: 1,
    padding: 32,
  },

  pageTitle: {
    margin: 0,
    fontSize: 34,
    fontWeight: 800,
    color: '#111827',
  },

  subtitle: {
    marginTop: 8,
    color: '#6b7280',
    marginBottom: 24,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },

  statCard: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 20,
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
    border: '1px solid #eef2f7',
  },

  statValue: {
    fontSize: 28,
    fontWeight: 800,
    color: '#111827',
  },

  statLabel: {
    marginTop: 6,
    color: '#6b7280',
    fontSize: 14,
  },

  card: {
    background: '#ffffff',
    borderRadius: 18,
    padding: 24,
    boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
    border: '1px solid #eef2f7',
  },

  infoBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    background: '#f3f4f6',
    fontSize: 13,
    color: '#374151',
  },
};
