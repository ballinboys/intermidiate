import { getStories } from "../data/api";
import AuthPresenter from "./auth-presenter";

export default class HomePresenter {
  constructor(view, { db }) {
    this._view = view;
    this._authPresenter = new AuthPresenter();
    this._subscription = null;
    this._db = db;
  }

  async loadStories() {
    try {
      if (!this._authPresenter.authCheck()) return;

      const { listStory } = await getStories();

      // Check each story's like status from IndexedDB
      const storiesWithLikes = await Promise.all(
        listStory.map(async (story) => {
          try {
            const dbStory = await this._db.getStoryById(story.id);
            return {
              ...story,
              liked: dbStory?.liked || false,
            };
          } catch {
            return {
              ...story,
              liked: false,
            };
          }
        })
      );

      this._view.showStories(storiesWithLikes);
    } catch (error) {
      this._view.showError("Failed to load stories. Please try again later.");
    }
  }

  async setupPushNotifications() {
    // if ("serviceWorker" in navigator && "PushManager" in window) {
    //   try {
    //     const registration = await navigator.serviceWorker.register("sw.js");
    //     console.log("Service Worker registration successful:", registration);
    //     const permission = await Notification.requestPermission();
    //     if (permission === "granted") {
    //       // this._subscription = await swRegistration.pushManager.subscribe({
    //       //   userVisibleOnly: true,
    //       //   applicationServerKey:
    //       //     "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk",
    //       // });
    //       // console.log("Subscription object:", this._subscription);
    //       // if (!this._subscription.getKey) {
    //       //   console.warn(
    //       //     "Push subscription missing getKey method - using direct access"
    //       //   );
    //       //   if (!this._subscription?.keys) {
    //       //     console.error(
    //       //       "Cannot proceed - subscription missing both getKey method and keys object"
    //       //     );
    //       //     return;
    //       //   }
    //       //   const a = await subscribePushNotification(this._subscription);
    //       //   console.log("Subscription object:", a);
    //       // } else {
    //       //   // Standard compliant browsers
    //       //   const p256dh = arrayBufferToBase64(
    //       //     await this._subscription.getKey("p256dh")
    //       //   );
    //       //   const auth = arrayBufferToBase64(
    //       //     await this._subscription.getKey("auth")
    //       //   );
    //       //   const a = await subscribePushNotification({
    //       //     endpoint: this._subscription.endpoint,
    //       //     keys: { p256dh, auth },
    //       //   });
    //       //   console.log("Subscription object:", a);
    //       // }
    //     }
    //   } catch (error) {
    //     console.error("Push Notification setup failed:", error);
    //     this._view.showError("Failed to setup notifications");
    //   }
    // }
  }

  async toggleLike(storyId) {
    try {
      if (!storyId) {
        throw new Error("No story ID provided");
      }
      const updatedStory = await this._db.toggleLike(storyId);
      return updatedStory;
    } catch (error) {
      console.error("Presenter error in toggleLike:", error);
      throw new Error("Could not update like status. Please try again.");
    }
  }

  async getLikedStories() {
    try {
      return await this._db.getLikedStories();
    } catch (error) {
      console.error("Failed to get liked stories:", error);
      throw error;
    }
  }
}

// Add this helper function
function arrayBufferToBase64(buffer) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buffer)));
}
