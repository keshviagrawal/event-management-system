// import api from "./api";

// export const createOrganizer = async (organizerData) => {
//   const response = await api.post("/admin/organizers", organizerData);
//   return response.data;
// };

// export const getAllOrganizers = async () => {
//   const response = await api.get("/admin/organizers");
//   return response.data;
// };

// export const disableOrganizer = async (organizerId) => {
//   const response = await api.patch(`/admin/organizers/${organizerId}/disable`);
//   return response.data;
// };

// export const deleteOrganizer = async (organizerId) => {
//   const response = await api.delete(`/admin/organizers/${organizerId}`);
//   return response.data;
// };

// export const resetOrganizerPassword = async (organizerId) => {
//   const response = await api.patch(
//     `/admin/reset-password/${organizerId}`
//   );
//   return response.data;
// };

import api from "./api";

export const createOrganizer = async (data) => {
  const response = await api.post("/admin/organizers", data);
  return response.data;
};

export const getAllOrganizers = async () => {
  const response = await api.get("/admin/organizers");
  return response.data;
};

export const resetOrganizerPassword = async (userId) => {
  const response = await api.patch(`/admin/reset-password/${userId}`);
  return response.data;
};

export const disableOrganizer = async (userId) => {
  const response = await api.patch(`/admin/organizers/${userId}/disable`);
  return response.data;
};

export const deleteOrganizer = async (userId) => {
  const response = await api.delete(`/admin/organizers/${userId}`);
  return response.data;
};