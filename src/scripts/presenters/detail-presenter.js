import { getStory } from "../data/api";
import Database from "../database";

export default class DetailPresenter {
  constructor(view) {
    this._view = view;
  }

  async loadStory(id) {
    try {
      let story;

      if (navigator.onLine) {
        const response = await getStory(id);
        if (response.error) throw new Error(response.message);

        story = response.story;

        // merge state liked/saved dari DB lokal
        const local = await Database.getStoryById(story.id);
        if (local) {
          story.liked = local.liked || false;
          story.saved = local.saved || false;
        }

        if (story && story.id) {
          await Database.putStory(story);
        }
      } else {
        story = await Database.getStoryById(id);
      }

      if (story) {
        this._view.showStory(story);
      } else {
        this._view.showError(
          "Story tidak ditemukan, baik online maupun offline."
        );
      }
    } catch (error) {
      console.error("DetailPresenter error:", error);

      const offlineStory = await Database.getStoryById(id);
      if (offlineStory) {
        this._view.showStory(offlineStory);
      } else {
        this._view.showError("Gagal memuat detail story.");
      }
    }
  }

  // ✅ toggle like
  async toggleLike(id) {
    try {
      const updatedStory = await Database.toggleLike(id);
      this._view.showStory(updatedStory); // refresh UI detail
      return updatedStory;
    } catch (err) {
      console.error("❌ Gagal toggle like:", err);
      throw err;
    }
  }

  // ✅ toggle save
  async toggleSave(story) {
    try {
      const alreadySaved = await Database.isStorySaved(story.id);
      if (alreadySaved) {
        await Database.removeSavedStory(story.id);
        story.saved = false;
      } else {
        await Database.saveStory(story);
        story.saved = true;
      }

      // update di DB utama juga supaya konsisten
      await Database.putStory(story);

      this._view.showStory(story); // refresh UI detail
      return story;
    } catch (err) {
      console.error("❌ Gagal toggle save:", err);
      throw err;
    }
  }
}
