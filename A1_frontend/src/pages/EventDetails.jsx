import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Layout from "../components/Layout";
import DiscussionForum from "../components/DiscussionForum";
import AddToCalendar from "../components/AddToCalendar";
import api from "../services/api";

export default function EventDetails() {
  const { id } = useParams();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [purchaseMsg, setPurchaseMsg] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const [customResponses, setCustomResponses] = useState({});

  useEffect(() => { fetchEvent(); }, [id]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${id}`);
      setEvent(res.data);
    } catch (err) {
      console.error("Failed to fetch event");
      setError(err.response?.data?.message || "Failed to load event");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (isRegistering) return;

    if (event.customForm && event.customForm.length > 0) {
      for (let field of event.customForm) {
        if (field.required && (!customResponses[field.label] || customResponses[field.label].trim() === "")) {
          alert(`❌ Please fill out the required field: ${field.label}`);
          return;
        }
      }
    }

    setIsRegistering(true);
    try {
      if (event.registrationFee && event.registrationFee > 0) {
        const confirmPayment = window.confirm(`Confirm Payment of ₹${event.registrationFee}?`);
        if (!confirmPayment) { setIsRegistering(false); return; }
      }
      await api.post(`/events/${event._id}/register`, { customResponses });
      alert("Registration successful! Ticket sent to your email.");
    } catch (err) {
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePurchase = async () => {
    setPurchaseMsg(null);
    if (!selectedSize || !selectedColor) {
      setPurchaseMsg({ type: "error", text: "Please select size and color" });
      return;
    }
    if (!paymentProof) {
      setPurchaseMsg({ type: "error", text: "Please upload payment proof image" });
      return;
    }

    setPurchasing(true);
    try {
      const formData = new FormData();
      formData.append("size", selectedSize);
      formData.append("color", selectedColor);
      formData.append("quantity", quantity);
      formData.append("paymentProof", paymentProof);
      await api.post(`/events/${event._id}/purchase`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setPurchaseMsg({ type: "success", text: "Order placed! Payment pending organizer approval." });
      setPaymentProof(null);
    } catch (err) {
      setPurchaseMsg({ type: "error", text: err.response?.data?.message || "Purchase failed" });
    } finally {
      setPurchasing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  if (loading) return <Layout><p>Loading...</p></Layout>;
  if (error) return <Layout><p className="error-text">{error}</p></Layout>;
  if (!event) return <Layout><p>Event not found</p></Layout>;

  const isDeadlinePassed = event.registrationDeadline && new Date(event.registrationDeadline) < new Date();
  const isFull = event.eventType === "NORMAL" && event.registrationLimit > 0 &&
    (event.registrationsCount ?? 0) >= event.registrationLimit;
  const isStockOver = event.eventType === "MERCHANDISE" &&
    typeof event.merchandiseDetails?.totalStock === "number" &&
    event.merchandiseDetails.totalStock <= 0;
  const isDisabled = isDeadlinePassed || isFull || isStockOver;

  const availableSizes = [...new Set(event.merchandiseDetails?.variants?.map(v => v.size) || [])];
  const availableColors = [...new Set(event.merchandiseDetails?.variants?.map(v => v.color) || [])];
  const selectedVariant = event.merchandiseDetails?.variants?.find(v => v.size === selectedSize && v.color === selectedColor);

  return (
    <Layout>
      <div style={{ maxWidth: 740, margin: "0 auto" }}>
        {/* Header */}
        <h2 className="page-title">{event.eventName}</h2>
        <div className="flex gap-sm flex-wrap mb">
          <span className={event.eventType === "MERCHANDISE" ? "badge badge-warning" : "badge badge-info"}>{event.eventType}</span>
          <span className="badge badge-success">{event.eligibility}</span>
          {event.eventType === "NORMAL" && event.registrationFee > 0 && <span className="badge badge-purple">₹{event.registrationFee}</span>}
          {event.eventType === "NORMAL" && event.registrationFee === 0 && <span className="badge badge-success">FREE</span>}
        </div>

        <p style={{ lineHeight: 1.7, color: "var(--text-secondary)", marginBottom: 20 }}>{event.description}</p>

        {/* Details */}
        <div className="card mb">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Organizer", event.organizerId?.organizerName || "N/A"],
                ["Start Date", formatDate(event.eventStartDate)],
                ["End Date", formatDate(event.eventEndDate)],
                [
                  "Registration Deadline",
                  <span style={{ color: isDeadlinePassed ? "var(--danger)" : "inherit" }}>
                    {formatDate(event.registrationDeadline)}{isDeadlinePassed && " (Passed)"}
                  </span>
                ],
                ["Eligibility", event.eligibility],
                ...(event.eventType === "NORMAL" ? [
                  ["Registration Fee", event.registrationFee > 0 ? `₹${event.registrationFee}` : "Free"],
                  ["Registration Limit",
                    event.registrationLimit === 0
                      ? "Unlimited"
                      : `${event.registrationLimit} (${Math.max(0, event.registrationLimit - (event.registrationsCount ?? 0))} spots left)`
                  ],
                ] : []),
              ].map(([label, value], i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, padding: "10px 14px 10px 0", borderBottom: "1px solid var(--gray-100)", color: "var(--gray-600)", width: 180 }}>{label}</td>
                  <td style={{ padding: "10px 0", borderBottom: "1px solid var(--gray-100)", color: "var(--text)" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AddToCalendar event={event} />

        {/* Merchandise Purchase */}
        {event.eventType === "MERCHANDISE" && (
          <div className="card mt">
            <h4 style={{ margin: "0 0 12px" }}>🛍️ Merchandise Details</h4>
            <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Item:</strong> {event.merchandiseDetails?.itemName}</p>
            <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Price:</strong> ₹{event.merchandiseDetails?.price}</p>
            <p style={{ margin: "4px 0", color: "var(--text)" }}><strong>Stock Left:</strong> {event.merchandiseDetails?.totalStock}</p>

            {!isDisabled && (
              <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <h4 style={{ margin: "0 0 14px" }}>Place Order</h4>
                <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr auto", marginBottom: 14 }}>
                  <div className="form-group">
                    <label>Size</label>
                    <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)}>
                      <option value="">Select Size</option>
                      {availableSizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Color</label>
                    <select value={selectedColor} onChange={e => setSelectedColor(e.target.value)}>
                      <option value="">Select Color</option>
                      {availableColors.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Qty</label>
                    <input type="number" min={1} max={event.merchandiseDetails?.purchaseLimitPerParticipant || 5}
                      value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} style={{ width: 70 }}
                    />
                  </div>
                </div>

                {selectedVariant && (
                  <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 10 }}>
                    Stock: <strong>{selectedVariant.stock}</strong> • Total: <strong>₹{event.merchandiseDetails.price * quantity}</strong>
                  </p>
                )}

                <div className="form-group">
                  <label>Payment Proof (screenshot/photo) *</label>
                  <input type="file" accept="image/png,image/jpeg" onChange={e => setPaymentProof(e.target.files[0])} />
                </div>

                <button onClick={handlePurchase} disabled={purchasing}
                  className={purchasing ? "btn-secondary" : "btn-primary"}
                  style={{ cursor: purchasing ? "not-allowed" : "pointer" }}
                >
                  {purchasing ? "Submitting..." : "Submit Order"}
                </button>

                {purchaseMsg && (
                  <p className={purchaseMsg.type === "success" ? "success-text mt-sm" : "error-text mt-sm"}>
                    {purchaseMsg.text}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Normal Event Register */}
        {event.eventType === "NORMAL" && (
          <div className="card mt" style={{ padding: "20px" }}>
            {event.customForm && event.customForm.length > 0 && (
              <div style={{ marginBottom: "20px", paddingBottom: "15px", borderBottom: "1px solid var(--border)" }}>
                <h4 style={{ margin: "0 0 16px" }}>📝 Registration Form</h4>
                {event.customForm.map((field, idx) => (
                  <div key={idx} className="form-group" style={{ marginBottom: "16px" }}>
                    <label style={{ display: "block", marginBottom: "6px", fontWeight: "bold" }}>
                      {field.label} {field.required && <span style={{ color: "var(--danger)" }}>*</span>}
                    </label>
                    <input
                      type={field.type === "number" ? "number" : "text"}
                      style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid var(--input-border)" }}
                      placeholder={field.type === "number" ? "Enter number" : "Enter text"}
                      value={customResponses[field.label] || ""}
                      onChange={(e) => setCustomResponses({ ...customResponses, [field.label]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            )}

            <button onClick={handleRegister} disabled={isDisabled || isRegistering}
              className={isDisabled || isRegistering ? "btn-secondary" : "btn-primary"}
              style={{ width: "100%", cursor: isDisabled || isRegistering ? "not-allowed" : "pointer" }}
            >
              {isRegistering ? "Registering..." : (event.registrationFee > 0 ? `Proceed to Payment (₹${event.registrationFee})` : "Register")}
            </button>
            {purchaseMsg && <p className="error-text mt-sm" style={{ textAlign: "center" }}>{purchaseMsg.text}</p>}
          </div>
        )}

        {isDeadlinePassed && <p className="error-text mt-sm">Registration deadline has passed.</p>}
        {isFull && <p className="error-text mt-sm">Registration limit reached.</p>}
        {isStockOver && <p className="error-text mt-sm">Merchandise out of stock.</p>}
      </div>

      <hr />
      <DiscussionForum eventId={id} isOrganizer={false} />
    </Layout>
  );
}