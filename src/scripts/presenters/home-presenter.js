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
      await this._db.cacheStories(listStory); // ✅ simpan cache terbaru

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
      console.warn("⚠️ Offline mode: memuat cache lokal...");
      const cachedStories = await this._db.getCachedStories();
      if (cachedStories.length > 0) {
        this._view.showStories(cachedStories);
      } else {
        this._view.showError("Tidak ada cache tersedia untuk ditampilkan.");
      }
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
  async searchStories(query) {
    try {
      const { listStory } = await getStories(); // bisa juga dari IndexedDB
      const filtered = listStory.filter(
        (story) =>
          story.name?.toLowerCase().includes(query.toLowerCase()) ||
          story.description?.toLowerCase().includes(query.toLowerCase())
      );

      // kasih field lengkap + like status
      const storiesWithLikes = await Promise.all(
        filtered.map(async (story) => {
          const dbStory = await this._db.getStoryById(story.id);
          return {
            ...story,
            liked: dbStory?.liked || false,
            photoUrl: story.photoUrl || "/images/no-image.png",
            createdAt: story.createdAt || new Date().toISOString(),
            description: story.description || "Tidak ada deskripsi",
            name: story.name || "Anonim",
          };
        })
      );

      return storiesWithLikes;
    } catch (error) {
      console.error("Search failed:", error);
      return [];
    }
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
