import { updateAuthUI } from "./auth";

export function setupLogout() {
  updateAuthUI();

  const logoutLink = document.getElementById("logout-link");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();

      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth-change"));
      window.location.hash = "#/login";
    });
  }
}
