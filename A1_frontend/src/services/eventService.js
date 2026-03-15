import api from "./api";

// Get all published events
export const getPublishedEvents = async () => {
  const response = await api.get("/events");
  return response.data;
};

// Register for event
export const registerForEvent = async (eventId) => {
  const response = await api.post(`/events/${eventId}/register`);
  return response.data;
};

// Get my registrations
export const getMyRegistrations = async () => {
  const response = await api.get("/events/my-registrations");
  return response.data;
};

export const cancelRegistration = async (eventId) => {
  const response = await api.delete(`/events/${eventId}/register`);
  return response.data;
};

// Purchase merchandise
export const purchaseMerchandise = async (eventId, purchaseData) => {
  const response = await api.post(`/events/${eventId}/purchase`, purchaseData);
  return response.data;
};

// Get merchandise stock
export const getMerchandiseStock = async (eventId) => {
  const response = await api.get(`/events/${eventId}/stock`);
  return response.data;
};