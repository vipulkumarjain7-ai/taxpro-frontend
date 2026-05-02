const API = process.env.REACT_APP_API || "https://taxpro-backend-xi90.onrender.com/api";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import GSTCalculator from "./GSTCalculator";
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("token", data.token);

        window.location.href = "/dashboard";
      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(error);
      alert("Server Error");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1>TaxPro GST Login</h1>

      <input
        type="email"
        placeholder="Enter Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={handleLogin}>
        Login
      </button>
    </div>
  );
}

function Dashboard() {
  <button onClick={() => window.location.href="/calculator"}>
    GST Calculator
  </button>
  const token = localStorage.getItem("token");

  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/clients", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
      });
  }, []);

  return (
    <div style={{ padding: "40px" }}>
      <h1>Dashboard 🎉</h1>

      <h2>Clients</h2>

      {clients.map((client) => (
        <div key={client.id}>
          <p>
            {client.name} - {client.gstin}
          </p>
        </div>
      ))}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/calculator" element={<GSTCalculator />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;