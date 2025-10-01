import { postRegister } from "../../data/api";
import AuthPresenter from "../../presenters/auth-presenter";

export default class RegisterPage {
  constructor() {
    this._authPresenter = new AuthPresenter();
    this._isLoading = false;
  }

  async render() {
    return `
      <section class="login-container">
        <h1>Register</h1>
        <form id="registerForm">
          <div class="form-group">
            <label for="name">Name</label>
            <input type="text" id="name" required ${
              this._isLoading ? "disabled" : ""
            }>
          </div>
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" required ${
              this._isLoading ? "disabled" : ""
            }>
          </div>
          <div class="form-group">
            <label for="password">Password (min 8 characters)</label>
            <input type="password" id="password" minlength="8" required ${
              this._isLoading ? "disabled" : ""
            }>
          </div>
          <button type="submit" class="login-button" ${
            this._isLoading ? "disabled" : ""
          }>
            ${this._isLoading ? "Loading..." : "Register"}
          </button>
        </form>
        <p class="register-link">Already have an account? <a href="#/login" ${
          this._isLoading ? 'style="pointer-events: none;"' : ""
        }>Login here</a></p>
      </section>
    `;
  }

  async afterRender() {
    if (this._authPresenter.isLogin()) return;
    const registerForm = document.getElementById("registerForm");
    if (!registerForm) return;

    const updateLoadingState = () => {
      const nameInput = document.getElementById("name");
      const emailInput = document.getElementById("email");
      const passwordInput = document.getElementById("password");
      const submitBtn = document.querySelector(".login-button");
      const loginLink = document.querySelector(".register-link a");

      [nameInput, emailInput, passwordInput, submitBtn].forEach((el) => {
        if (el) el.disabled = this._isLoading;
      });

      if (submitBtn) {
        submitBtn.textContent = this._isLoading ? "Loading..." : "Register";
      }
      if (loginLink) {
        loginLink.style.pointerEvents = this._isLoading ? "none" : "";
      }
    };

    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      this._isLoading = true;
      updateLoadingState();

      try {
        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        const response = await postRegister(name, email, password);

        if (response.error) {
          throw new Error(response.message);
        }

        alert("Registration successful!");
        window.location.hash = "#/login";
      } catch (error) {
        alert(error.message);
      } finally {
        this._isLoading = false;
        updateLoadingState();
      }
    });
  }
}
