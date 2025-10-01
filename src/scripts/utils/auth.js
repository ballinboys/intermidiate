export function updateAuthUI() {
  const isLoggedIn = !!localStorage.getItem("token");
  document.body.classList.toggle("logged-in", isLoggedIn);

  const loginLink = document.querySelector(".nav-login");
  const logoutLink = document.querySelector(".nav-logout");

  if (loginLink) loginLink.style.display = isLoggedIn ? "none" : "block";
  if (logoutLink) logoutLink.style.display = isLoggedIn ? "block" : "none";
}

window.addEventListener("auth-change", updateAuthUI);

window.addEventListener("storage", (event) => {
  if (event.key === "token") {
    updateAuthUI();
  }
});
