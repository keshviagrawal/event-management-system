export const setAuth = (token, role) => {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role); // This stores token inside browser memory.
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const getRole = () => {
  return localStorage.getItem("role");
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

// helps for token storage and role