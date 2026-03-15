import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";
import Layout from "../components/Layout";
import api from "../services/api";

export default function QRScanner() {
    const { eventId } = useParams();
    const navigate = useNavigate();
    const [scanning, setScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [scanHistory, setScanHistory] = useState([]);
    const [manualTicket, setManualTicket] = useState("");
    const scannerRef = useRef(null);
    const html5QrcodeRef = useRef(null);

    useEffect(() => { return () => { stopScanner(); }; }, []);

    const startScanner = async () => {
        setScanResult(null);
        const html5Qrcode = new Html5Qrcode("qr-reader");
        html5QrcodeRef.current = html5Qrcode;
        try {
            await html5Qrcode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                onScanSuccess, () => { }
            );
            setScanning(true);
        } catch (err) {
            console.error("Camera error:", err);
            setScanResult({ type: "error", message: "Could not access camera. Try file upload instead." });
        }
    };

    const stopScanner = async () => {
        if (html5QrcodeRef.current) {
            try { await html5QrcodeRef.current.stop(); html5QrcodeRef.current.clear(); } catch (e) { }
            html5QrcodeRef.current = null;
        }
        setScanning(false);
    };

    const onScanSuccess = async (decodedText) => { await stopScanner(); await processScan(decodedText); };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setScanResult(null);
        const html5Qrcode = new Html5Qrcode("qr-reader-file");
        try { const result = await html5Qrcode.scanFile(file, true); await processScan(result); }
        catch (err) { setScanResult({ type: "error", message: "Could not read QR code from this image." }); }
    };

    const processScan = async (qrData) => {
        try {
            const res = await api.post(`/events/${eventId}/attendance/scan`, { qrData });
            const entry = { type: "success", message: res.data.message, participant: res.data.participant, ticketId: res.data.ticketId, time: new Date().toLocaleTimeString() };
            setScanResult(entry); setScanHistory(prev => [entry, ...prev]);
        } catch (err) {
            const data = err.response?.data;
            const entry = { type: data?.duplicate ? "duplicate" : "error", message: data?.message || "Scan failed", participant: data?.participant, time: new Date().toLocaleTimeString() };
            setScanResult(entry); setScanHistory(prev => [entry, ...prev]);
        }
    };

    const handleManualEntry = async () => {
        if (!manualTicket.trim()) return;
        try {
            const res = await api.post("/events/attendance/mark", { ticketId: manualTicket.trim() });
            const entry = { type: "success", message: res.data.message, participant: res.data.participant, ticketId: manualTicket.trim(), time: new Date().toLocaleTimeString() };
            setScanResult(entry); setScanHistory(prev => [entry, ...prev]); setManualTicket("");
        } catch (err) {
            const data = err.response?.data;
            setScanResult({ type: data?.duplicate ? "duplicate" : "error", message: data?.message || "Failed", participant: data?.participant, time: new Date().toLocaleTimeString() });
        }
    };

    const resultColorMap = { success: "var(--success)", duplicate: "var(--warning)", error: "var(--danger)" };
    const resultBgMap = { success: "var(--success-bg)", duplicate: "#fff3cd", error: "#f8d7da" };

    return (
        <Layout>
            <div style={{ maxWidth: 600, margin: "0 auto" }}>
                <div className="page-header">
                    <h2 className="page-title">🔍 QR Scanner</h2>
                    <button onClick={() => navigate(`/organizer/event/${eventId}`)} className="btn-secondary btn-sm">← Back to Event</button>
                </div>

                <div className="flex gap-sm mb">
                    {!scanning
                        ? <button onClick={startScanner} className="btn-success">📷 Start Camera</button>
                        : <button onClick={stopScanner} className="btn-danger">⏹ Stop Camera</button>
                    }
                </div>

                <div id="qr-reader" ref={scannerRef} style={{ width: "100%", minHeight: scanning ? 300 : 0, borderRadius: 8, overflow: "hidden", marginBottom: 16 }} />

                {/* File Upload */}
                <div className="scanner-box mb">
                    <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>📁 Or upload QR image:</label>
                    <input type="file" accept="image/*" onChange={handleFileUpload} />
                    <div id="qr-reader-file" style={{ display: "none" }} />
                </div>

                {/* Manual Ticket Entry */}
                <div className="scanner-box mb">
                    <label style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>⌨️ Manual Ticket Entry:</label>
                    <div className="flex gap-sm">
                        <input placeholder="Enter Ticket ID" value={manualTicket} onChange={(e) => setManualTicket(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleManualEntry()} style={{ flex: 1 }} />
                        <button onClick={handleManualEntry} className="btn-primary btn-sm">Mark</button>
                    </div>
                </div>

                {/* Scan Result */}
                {scanResult && (
                    <div className="card mb" style={{ border: `2px solid ${resultColorMap[scanResult.type]}`, background: resultBgMap[scanResult.type] }}>
                        <strong style={{ fontSize: "1.1rem" }}>
                            {scanResult.type === "success" ? "✅ " : scanResult.type === "duplicate" ? "⚠️ " : "❌ "}
                            {scanResult.message}
                        </strong>
                        {scanResult.participant && (
                            <p style={{ margin: "8px 0 0" }}>
                                <strong>{scanResult.participant.name}</strong>
                                {scanResult.participant.email && ` — ${scanResult.participant.email}`}
                            </p>
                        )}
                        {scanResult.type !== "error" && !scanning && (
                            <button onClick={startScanner} className="btn-success btn-sm mt-sm">Scan Next</button>
                        )}
                    </div>
                )}

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <div className="mt">
                        <h4>Scan History ({scanHistory.length})</h4>
                        <div style={{ maxHeight: 300, overflow: "auto" }}>
                            {scanHistory.map((entry, i) => (
                                <div key={i} className="card" style={{
                                    borderLeft: `4px solid ${resultColorMap[entry.type]}`,
                                    padding: "8px 12px", marginBottom: 6, borderRadius: "0 6px 6px 0",
                                }}>
                                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>{entry.time}</span>
                                    {" — "}<strong>{entry.participant?.name || entry.ticketId || "Unknown"}</strong>
                                    {" — "}<span style={{ color: resultColorMap[entry.type] }}>{entry.message}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
