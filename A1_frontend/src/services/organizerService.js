import api from "./api";

export const createEvent = async (eventData) => {
  const response = await api.post("/events", eventData);
  return response.data;
};

export const publishEvent = async (eventId) => {
  const response = await api.patch(`/events/${eventId}/publish`);
  return response.data;
};

export const getOrganizerDashboard = async () => {
  const response = await api.get("/events/organizer/dashboard");
  return response.data;
};

export const getEventRegistrations = async (eventId) => {
  const response = await api.get(`/events/${eventId}/registrations`);
  return response.data;
};

export const getEventAnalytics = async (eventId) => {
  const response = await api.get(`/events/organizer/events/${eventId}/analytics`);
  return response.data;
};

export const updateEvent = async (eventId, updates) => {
  const response = await api.put(`/events/${eventId}/update`, updates);
  return response.data;
};

export const markAttendance = async (ticketId) => {
  const response = await api.post(`/events/attendance/mark`, { ticketId });
  return response.data;
};

export const exportParticipantsCSV = async (eventId) => {
  const response = await api.get(`/events/${eventId}/csv`, {
    responseType: 'blob', // Important for file download
  });
  return response;
};

export const getOrganizerProfile = async () => {
  const response = await api.get("/organizer/profile");
  return response.data;
};

export const updateOrganizerProfile = async (data) => {
  const response = await api.put("/organizer/profile", data);
  return response.data;
};

// Merchandise Payment Approval
export const getMerchOrders = async (eventId, status) => {
  const params = status ? `?status=${status}` : "";
  const response = await api.get(`/events/${eventId}/orders${params}`);
  return response.data;
};

export const approveMerchOrder = async (eventId, orderId) => {
  const response = await api.patch(`/events/${eventId}/orders/${orderId}/approve`);
  return response.data;
};

export const rejectMerchOrder = async (eventId, orderId) => {
  const response = await api.patch(`/events/${eventId}/orders/${orderId}/reject`);
  return response.data;
};

// QR Scanner & Attendance
export const scanQRAttendance = async (eventId, qrData) => {
  const response = await api.post(`/events/${eventId}/attendance/scan`, { qrData });
  return response.data;
};

export const manualOverrideAttendance = async (eventId, registrationId, action, reason) => {
  const response = await api.post(`/events/${eventId}/attendance/manual`, {
    registrationId, action, reason,
  });
  return response.data;
};