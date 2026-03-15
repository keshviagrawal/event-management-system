import api from "./api";

// Get participant profile
export const getProfile = async () => {
  const response = await api.get("/participants/profile");
  return response.data;
};

// Update participant profile
export const updateProfile = async (data) => {
  const response = await api.put("/participants/profile", data);
  return response.data;
};

// Save onboarding preferences
export const saveOnboarding = async (data) => {
  const response = await api.post("/participants/onboarding", data);
  return response.data;
};

// Skip onboarding
export const skipOnboarding = async () => {
  const response = await api.post("/participants/onboarding/skip");
  return response.data;
};

// Follow organizer
export const followOrganizer = async (organizerId) => {
  const response = await api.post(`/participants/follow/${organizerId}`);
  return response.data;
};

// Unfollow organizer
export const unfollowOrganizer = async (organizerId) => {
  const response = await api.delete(`/participants/follow/${organizerId}`);
  return response.data;
};

// Get all organizers (for onboarding)
export const getAllOrganizers = async () => {
  const response = await api.get("/participants/organizers");
  return response.data;
};