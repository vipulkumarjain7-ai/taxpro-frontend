import { useState } from "react";

export default function GSTCalculator() {
  const [amount, setAmount] = useState("");
  const [rate, setRate] = useState("18");
  const [type, setType] = useState("exclusive");
  const [result, setResult] = useState(null);

  const calculate = () => {
    const amt = parseFloat(amount);
    const gstRate = parseFloat(rate) / 100;

    let base, gst, total;
    if (type === "exclusive") {
      base = amt;
      gst = amt * gstRate;
      total = amt + gst;
    } else {
      total = amt;
      base = amt / (1 + gstRate);
      gst = total - base;
    }

    setResult({
      base: base.toFixed(2),
      cgst: (gst / 2).toFixed(2),
      sgst: (gst / 2).toFixed(2),
      igst: gst.toFixed(2),
      total: total.toFixed(2),
    });
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto" }}>
      <h2>GST Calculator</h2>

      <div style={{ marginBottom: "12px" }}>
        <label>Amount (₹)</label><br />
        <input type="number" value={amount}
          onChange={e => setAmount(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "4px" }} />
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>GST Rate</label><br />
        <select value={rate} onChange={e => setRate(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "4px" }}>
          <option value="5">5%</option>
          <option value="12">12%</option>
          <option value="18">18%</option>
          <option value="28">28%</option>
        </select>
      </div>

      <div style={{ marginBottom: "12px" }}>
        <label>Type</label><br />
        <select value={type} onChange={e => setType(e.target.value)}
          style={{ width: "100%", padding: "8px", marginTop: "4px" }}>
          <option value="exclusive">Exclusive (Add GST)</option>
          <option value="inclusive">Inclusive (Extract GST)</option>
        </select>
      </div>

      <button onClick={calculate}
        style={{ width: "100%", padding: "10px", background: "#1a73e8",
          color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
        Calculate
      </button>

      {result && (
        <div style={{ marginTop: "20px", background: "#f1f3f4",
          padding: "16px", borderRadius: "8px" }}>
          <h3>Result</h3>
          <p>Base Amount: ₹{result.base}</p>
          <p>CGST: ₹{result.cgst}</p>
          <p>SGST: ₹{result.sgst}</p>
          <p>IGST: ₹{result.igst}</p>
          <hr />
          <p><strong>Total: ₹{result.total}</strong></p>
        </div>
      )}
    </div>
  );
}