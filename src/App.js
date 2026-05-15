import React, { useEffect, useState } from "react";
import API_BASE from "./config";

/*
  TaxPro ERP Frontend
  - Connects to authenticated backend routes
  - Sends JWT token from localStorage with every request
  - Displays data from all backend modules automatically
*/

const MODULES = [
  "Dashboard",
  "Accounting",
  "AI",
  "Auth",
  "Challans",
  "Customers",
  "GSTIN",
  "GSTR2A",
  "Import",
  "Inventory",
  "Invoices",
  "Items",
  "Notices",
  "Payments",
  "Products",
  "Purchases",
  "Reconciliation",
  "Reports",
  "Returns",
  "Staff",
  "Suppliers",
  "WhatsApp",
];

const API_MAP = {
  Dashboard: "/dashboard",
  Accounting: "/accounting",
  AI: "/ai",
  Auth: "/auth",
  Challans: "/challans",
  Customers: "/customers",
  GSTIN: "/gstin",
  GSTR2A: "/gstr2a",
  Import: "/import",
  Inventory: "/inventory",
  Invoices: "/invoices",
  Items: "/items",
  Notices: "/notices",
  Payments: "/payments",
  Products: "/products",
  Purchases: "/purchases",
  Reconciliation: "/reconciliation",
  Reports: "/reports",
  Returns: "/returns",
  Staff: "/staff",
  Suppliers: "/suppliers",
  WhatsApp: "/whatsapp",
};

const styles = {
  app: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    background: "#f5f7fb",
  },
  sidebar: {
    width: 270,
    background: "#0f172a",
    color: "white",
    padding: 20,
    overflowY: "auto",
  },
  logo: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 20,
  },
  menuButton: (active) => ({
    width: "100%",
    textAlign: "left",
    padding: "10px 12px",
    marginBottom: 6,
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    background: active ? "#2563eb" : "transparent",
    color: "white",
    fontWeight: active ? "bold" : "normal",
  }),
  main: {
    flex: 1,
    padding: 24,
  },
  card: {
    background: "white",
    borderRadius: 16,
    padding: 24,
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  },
  title: {
    margin: 0,
    fontSize: 30,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subtitleText: {
    color: "#64748b",
    marginTop: 8,
    marginBottom: 20,
    wordBreak: "break-all",
  },
  toolbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
    flexWrap: "wrap",
  },
  refreshBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    background: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
  loginBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#16a34a",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: 10,
  },
  logoutBtn: {
    padding: "10px 16px",
    borderRadius: 8,
    border: "none",
    background: "#dc2626",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
    marginRight: 10,
  },
  error: {
    background: "#fef2f2",
    color: "#b91c1c",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  success: {
    background: "#f0fdf4",
    color: "#166534",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  loading: {
    textAlign: "center",
    padding: 30,
    color: "#64748b",
  },
  tableWrap: {
    overflowX: "auto",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 700,
  },
  th: {
    background: "#f8fafc",
    padding: 12,
    textAlign: "left",
    borderBottom: "1px solid #e2e8f0",
    fontSize: 13,
  },
  td: {
    padding: 12,
    borderBottom: "1px solid #f1f5f9",
    fontSize: 14,
  },
  empty: {
    textAlign: "center",
    padding: 30,
    color: "#64748b",
  },
};

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function DataTable({ data }) {
  const rows = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.rows)
    ? data.rows
    : data?.summary
    ? [data.summary]
    : data
    ? [data]
    : [];

  if (!rows.length) {
    return <div style={styles.empty}>No records found.</div>;
  }

  const columns = [...new Set(rows.flatMap((row) => Object.keys(row || {})))];

  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} style={styles.th}>
                {col.replace(/_/g, " ").toUpperCase()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id || i}>
              {columns.map((col) => (
                <td key={col} style={styles.td}>
                  {formatValue(row[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const [activeModule, setActiveModule] = useState("Dashboard");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const hasToken = !!localStorage.getItem("token");

  const setDemoToken = () => {
    const token = prompt("Paste your JWT token:");
    if (token && token.trim()) {
      localStorage.setItem("token", token.trim());
      setMessage("Token saved successfully.");
      loadData(activeModule);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setMessage("Token removed.");
    setData([]);
  };

  const loadData = async (moduleName = activeModule) => {
    const endpoint = API_MAP[moduleName];
    if (!endpoint) return;

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          json.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      setData(json);
    } catch (err) {
      console.error(err);
      setData([]);
      setError(err.message || `Unable to load ${moduleName}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeModule);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.logo}>TPG</div>
        <div style={styles.subtitle}>TaxPro ERP Suite</div>

        {MODULES.map((module) => (
          <button
            key={module}
            style={styles.menuButton(activeModule === module)}
            onClick={() => setActiveModule(module)}
          >
            {module}
          </button>
        ))}
      </aside>

      <main style={styles.main}>
        <div style={styles.card}>
          <div style={styles.toolbar}>
            <div>
              <h1 style={styles.title}>{activeModule}</h1>
              <div style={styles.subtitleText}>
                API: {API_BASE}
                {API_MAP[activeModule]}
              </div>
            </div>

            <div>
              {!hasToken ? (
                <button style={styles.loginBtn} onClick={setDemoToken}>
                  Set JWT Token
                </button>
              ) : (
                <button style={styles.logoutBtn} onClick={logout}>
                  Remove Token
                </button>
              )}

              <button
                style={styles.refreshBtn}
                onClick={() => loadData(activeModule)}
              >
                Refresh
              </button>
            </div>
          </div>

          {message && <div style={styles.success}>{message}</div>}
          {error && <div style={styles.error}>{error}</div>}

          {loading ? (
            <div style={styles.loading}>Loading data...</div>
          ) : !error ? (
            <DataTable data={data} />
          ) : null}
        </div>
      </main>
    </div>
  );
}