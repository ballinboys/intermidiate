// CSS imports
import "../styles/styles.css";
import "../styles/login.css";
import "../styles/register.css";
import "../styles/story-cards.css";
import "../styles/add-story.css";
import "../styles/detail.css";
import "../styles/home.css";

import { registerSW } from "virtual:pwa-register";

import CONFIG from "./config";
const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}/v1`,
};

import { setupLogout } from "./utils/logout";
import App from "./pages/app";
import Database from "./database";
import { sendStoryToServer } from "./data/api";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });
  await app.renderPage();

  registerSW({
    onNeedRefresh() {
      console.log("Ada update baru!");
    },
    onOfflineReady() {
      console.log("Siap offline!");
    },
  });
  window.addEventListener("online", async () => {
    await Database.syncPendingStories(sendStoryToServer);
  });
  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });

  setupLogout();
});
