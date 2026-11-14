export const isUserAuthenticated = () =>
  localStorage.getItem("isUserAuth") === "true" &&
  Boolean(localStorage.getItem("accessToken"));

export const notifyAuthChange = () => {
  window.dispatchEvent(new Event("auth-change"));
};

export const saveUserSession = (response) => {
  const { user, accessToken } = response;
  const bookingEmail = localStorage.getItem("table_user_email");

  if (!bookingEmail || bookingEmail.toLowerCase() !== user.user_email.toLowerCase()) {
    localStorage.removeItem("table_id");
    localStorage.removeItem("table_capacity");
    localStorage.removeItem("table_user_email");
  }

  localStorage.removeItem("isAdminAuth");
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("isUserAuth", "true");
  localStorage.setItem("user_email", user.user_email);
  localStorage.setItem("user_name", user.user_name);
  notifyAuthChange();
};
