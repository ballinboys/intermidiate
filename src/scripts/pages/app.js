import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import {
  generateSubscribeButtonTemplate,
  generateUnsubscribeButtonTemplate,
} from "../templates";
import { isServiceWorkerAvailable } from "../utils";
import {
  isCurrentPushSubscriptionAvailable,
  subscribe,
  unsubscribe,
} from "../utils/notification-helper";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener("click", () => {
      this.#navigationDrawer.classList.toggle("open");
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
        }
      });
    });
  }

  async #setupPushNotification() {
    const pushNotificationTools = document.getElementById(
      "push-notification-tools"
    );

    if (!localStorage.getItem("token")) {
      this.#hidePushNotification();
      return;
    }

    pushNotificationTools.style.display = "block";
    pushNotificationTools.innerHTML = generateSubscribeButtonTemplate();

    const isSubscribed = await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      pushNotificationTools.innerHTML = generateUnsubscribeButtonTemplate();
      document
        .getElementById("unsubscribe-button")
        .addEventListener("click", () => {
          unsubscribe().finally(() => {
            this.#setupPushNotification();
          });
        });
      return;
    }

    document
      .getElementById("subscribe-button")
      .addEventListener("click", () => {
        subscribe().finally(() => {
          this.#setupPushNotification();
        });
      });
  }

  #hidePushNotification() {
    const pushNotificationTools = document.getElementById(
      "push-notification-tools"
    );
    if (pushNotificationTools) {
      pushNotificationTools.style.display = "none";
    }
  }

  async renderPage() {
    const activeRoute = getActiveRoute();
    const page = routes[activeRoute.route];

    if (page) {
      // Check if View Transitions API is supported
      if (!document.startViewTransition) {
        // Fallback for browsers without View Transitions
        this.#content.innerHTML = await page.render(activeRoute.params);
        await page.afterRender();
        return;
      }

      // Start the transition
      await document.startViewTransition(async () => {
        this.#content.innerHTML = await page.render(activeRoute.params);
        await page.afterRender();
      }).ready;

      if (isServiceWorkerAvailable()) {
        if (localStorage.getItem("token")) {
          this.#setupPushNotification();
        } else {
          this.#hidePushNotification();
        }
      }
    }
  }
}

export default App;
