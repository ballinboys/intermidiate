import AuthPresenter from "../../presenters/auth-presenter";
import UserAuthenticator from "../../presenters/login-presenter";

export default class LoginPage {
  constructor() {
    this._auth = new UserAuthenticator(this);
    this._authPresenter = new AuthPresenter();
    this._isLoading = false;
  }

  async render() {
    return `
      <section class="login-container">
        <h1>Sign In</h1>
        <form id="authForm">
          <div class="form-group">
            <label for="userEmail">Email Address</label>
            <input type="email" id="userEmail" required ${
              this._isLoading ? "disabled" : ""
            }>
          </div>
          <div class="form-group">
            <label for="userPass">Password</label>
            <input type="password" id="userPass" required ${
              this._isLoading ? "disabled" : ""
            }>
          </div>
          <button type="submit" class="login-button" ${
            this._isLoading ? "disabled" : ""
          }>
            ${this._isLoading ? "Loading..." : "Continue"}
          </button>
        </form>
        <p class="register-link">No account yet? <a href="#/register" ${
          this._isLoading ? 'style="pointer-events: none;"' : ""
        }>Sign up</a></p>
      </section>
    `;
  }

  async afterRender() {
    if (this._authPresenter.isLogin()) return;
    const authForm = document.getElementById("authForm");
    if (!authForm) return;

    const updateLoadingState = () => {
      const emailInput = document.getElementById("userEmail");
      const passInput = document.getElementById("userPass");
      const submitBtn = document.querySelector(".login-button");
      const registerLink = document.querySelector(".register-link a");

      if (emailInput) emailInput.disabled = this._isLoading;
      if (passInput) passInput.disabled = this._isLoading;
      if (submitBtn) {
        submitBtn.disabled = this._isLoading;
        submitBtn.textContent = this._isLoading ? "Loading..." : "Continue";
      }
      if (registerLink) {
        registerLink.style.pointerEvents = this._isLoading ? "none" : "";
      }
    };

    authForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      this._isLoading = true;
      updateLoadingState();

      try {
        const email = document.getElementById("userEmail")?.value;
        const password = document.getElementById("userPass")?.value;
        if (email && password) {
          await this._auth.loginUser(email, password);
        }
      } catch (error) {
        this.showError(error.message);
      } finally {
        this._isLoading = false;
        updateLoadingState();
      }
    });
  }

  _updateFormState() {
    const container = document.querySelector(".login-container");
    if (!container) return;

    const emailValue = document.getElementById("userEmail")?.value || "";
    const passValue = document.getElementById("userPass")?.value || "";

    container.innerHTML = this.render();

    const emailInput = document.getElementById("userEmail");
    const passInput = document.getElementById("userPass");
    if (emailInput) emailInput.value = emailValue;
    if (passInput) passInput.value = passValue;
  }

  showSuccess(message) {
    alert(message);
  }

  showError(message) {
    alert(message);
  }

  redirectToHome() {
    window.location.hash = "#/";
  }
}
