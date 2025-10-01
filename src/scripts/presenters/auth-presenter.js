export default class AuthPresenter {
  authCheck() {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.hash = "#/login";
      return false;
    }
    return true;
  }
  isLogin() {
    const token = localStorage.getItem("token");
    if (token) {
      window.location.hash = "#/";
      return true;
    }
    return false;
  }
}
