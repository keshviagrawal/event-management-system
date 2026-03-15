// import axios from "axios";

// const api = axios.create({
//   baseURL: "API_URL_HERE",
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// export const getTasks = () => api.get("/tasks");
// export const createTask = (data) => api.post("/tasks", data);

// export default api;


import axios from "axios";
import { getToken } from "../utils/auth";

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api`,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// This automatically attaches JWT to every request.