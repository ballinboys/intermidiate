import { postLogin } from "../data/api";

export default class UserAuthenticator {
  constructor(view) {
    this._view = view;
  }

  async loginUser(email, password) {
    try {
      const response = await postLogin(email, password);

      if (response.error) {
        throw new Error(response.message || "Login failed");
      }

      localStorage.setItem("token", response.loginResult.token);
      window.dispatchEvent(new Event("auth-change"));
      window.location.hash = "#/";
      localStorage.setItem(
        "user",
        JSON.stringify({
          id: response.loginResult.userId,
          name: response.loginResult.name,
        })
      );

      this._view.showSuccess(response.message);
      this._view.redirectToHome();
    } catch (error) {
      this._view.showError(error.message);
    }
  }
}
