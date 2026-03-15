import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { createEvent } from "../services/organizerService";
import FormBuilder from "../components/FormBuilder";

export default function CreateEvent() {
    const navigate = useNavigate();

    const [eventName, setEventName] = useState("");
    const [description, setDescription] = useState("");
    const [eventType, setEventType] = useState("NORMAL");
    const [eligibility, setEligibility] = useState("ALL");
    const [registrationDeadline, setRegistrationDeadline] = useState("");
    const [eventStartDate, setEventStartDate] = useState("");
    const [eventEndDate, setEventEndDate] = useState("");
    const [registrationLimit, setRegistrationLimit] = useState("");
    const [registrationFee, setRegistrationFee] = useState("");
    const [tags, setTags] = useState("");
    const [customForm, setCustomForm] = useState([]);

    const [itemName, setItemName] = useState("");
    const [price, setPrice] = useState("");
    const [sizes, setSizes] = useState("S,M,L,XL");
    const [colors, setColors] = useState("Black,White");
    const [totalStock, setTotalStock] = useState("");
    const [purchaseLimit, setPurchaseLimit] = useState("2");

    const validateDates = () => {
        if (eventStartDate && eventEndDate) {
            if (new Date(eventStartDate) >= new Date(eventEndDate)) {
                alert("❌ Event Start Date must be before End Date.");
                return false;
            }
        }
        if (registrationDeadline && eventStartDate) {
            if (new Date(registrationDeadline) >= new Date(eventStartDate)) {
                alert("❌ Registration Deadline must be before the Event Start Date.");
                return false;
            }
        }
        return true;
    };

    const handleCreate = async () => {
        if (!validateDates()) return;
        try {
            const eventData = {
                eventName, description, eventType, eligibility, registrationDeadline,
                eventStartDate, eventEndDate,
                registrationLimit: parseInt(registrationLimit),
                registrationFee: eventType === "NORMAL" ? parseFloat(registrationFee) : parseFloat(price),
                tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                customForm,
            };

            if (eventType === "MERCHANDISE") {
                const sizeArray = sizes.split(",").map((s) => s.trim()).filter(Boolean);
                const colorArray = colors.split(",").map((c) => c.trim()).filter(Boolean);
                const stockPerVariant = Math.floor(parseInt(totalStock) / (sizeArray.length * colorArray.length));
                const variants = [];
                for (const size of sizeArray) {
                    for (const color of colorArray) {
                        variants.push({ size, color, stock: stockPerVariant });
                    }
                }
                eventData.merchandiseDetails = {
                    itemName, price: parseFloat(price), sizes: sizeArray, colors: colorArray,
                    variants, totalStock: parseInt(totalStock),
                    purchaseLimitPerParticipant: parseInt(purchaseLimit),
                };
            }

            await createEvent(eventData);
            alert("Event created successfully!");
            navigate("/organizer");
        } catch (err) {
            alert("Failed to create event: " + (err.response?.data?.message || err.message));
        }
    };

    return (
        <Layout>
            <div style={{ maxWidth: 740, margin: "0 auto" }}>
                <h2 className="page-title">✨ Create New Event</h2>

                <div className="card mb-lg">
                    <div className="form-group">
                        <label>Event Type</label>
                        <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
                            <option value="NORMAL">Normal Event</option>
                            <option value="MERCHANDISE">Merchandise Event</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Event Name</label>
                        <input placeholder="Give your event a name" value={eventName} onChange={(e) => setEventName(e.target.value)} />
                    </div>

                    <div className="form-group">
                        <label>Description</label>
                        <textarea placeholder="Describe your event..." value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Eligibility</label>
                            <select value={eligibility} onChange={(e) => setEligibility(e.target.value)}>
                                <option value="ALL">All Participants</option>
                                <option value="IIIT">IIIT Only</option>
                                <option value="NON-IIIT">Non-IIIT Only</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Registration Limit</label>
                            <input type="number" min="0" placeholder="0 = unlimited" value={registrationLimit} onChange={(e) => setRegistrationLimit(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Start Date & Time</label>
                            <input type="datetime-local" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>End Date & Time</label>
                            <input type="datetime-local" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Registration Deadline</label>
                        <input type="datetime-local" value={registrationDeadline} onChange={(e) => setRegistrationDeadline(e.target.value)} />
                    </div>

                    {eventType === "NORMAL" && (
                        <div className="form-group">
                            <label>Registration Fee (₹)</label>
                            <input type="number" placeholder="0 for free events" value={registrationFee} onChange={(e) => setRegistrationFee(e.target.value)} />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Tags (comma separated)</label>
                        <input placeholder="e.g. technology, hackathon, coding" value={tags} onChange={(e) => setTags(e.target.value)} />
                    </div>
                </div>

                {/* Form Builder for Normal Events */}
                {eventType === "NORMAL" && (
                    <FormBuilder formFields={customForm} setFormFields={setCustomForm} locked={false} />
                )}

                {/* Merchandise Details */}
                {eventType === "MERCHANDISE" && (
                    <div className="card mb-lg">
                        <h3 style={{ marginBottom: 16 }}>🛍️ Merchandise Details</h3>
                        <div className="form-group">
                            <label>Item Name</label>
                            <input placeholder="e.g. Club T-Shirt" value={itemName} onChange={(e) => setItemName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Price per Item (₹)</label>
                            <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Sizes (comma separated)</label>
                            <input placeholder="S,M,L,XL" value={sizes} onChange={(e) => setSizes(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Colors (comma separated)</label>
                            <input placeholder="Black,White" value={colors} onChange={(e) => setColors(e.target.value)} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Total Stock</label>
                                <input type="number" placeholder="Total units" value={totalStock} onChange={(e) => setTotalStock(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Purchase Limit / Person</label>
                                <input type="number" value={purchaseLimit} onChange={(e) => setPurchaseLimit(e.target.value)} />
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex gap" style={{ marginBottom: 50 }}>
                    <button onClick={handleCreate} className="btn-primary">Create Event</button>
                    <button onClick={() => navigate("/organizer")} className="btn-secondary">Cancel</button>
                </div>
            </div>
        </Layout>
    );
}
