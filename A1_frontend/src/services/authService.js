import api from "../api/axios";

// export const registerUser = async (email, password) => {
//   const response = await api.post("/auth/signup/participant", {
//     email,
//     password,
//   });

//   return response.data;
// };

export const registerUser = async (userData) => {
  const response = await api.post("/auth/signup/participant", userData);
  return response.data;
};

// IIIT OTP Verification Flow
export const initiateIIITSignup = async (userData) => {
  const response = await api.post("/auth/signup/iiit/initiate", userData);
  return response.data;
};

export const verifyOTP = async (email, otp) => {
  const response = await api.post("/auth/signup/iiit/verify-otp", { email, otp });
  return response.data;
};

export const resendOTP = async (email) => {
  const response = await api.post("/auth/signup/iiit/resend-otp", { email });
  return response.data;
};

export const completeIIITSignup = async (email, password) => {
  const response = await api.post("/auth/signup/iiit/complete", { email, password });
  return response.data;
};

// export const loginUser = async (email, password) => {
//   const response = await api.post("/auth/login", {
//     email,
//     password,
//   });

//   return response.data;
// };
export const loginUser = async (email, password) => {
  const payload = { email };
  if (password) {
    payload.password = password;
  }
  const response = await api.post("/auth/login", payload);
  return response.data;
};

// basically req is sent to API

// backend returns token and role