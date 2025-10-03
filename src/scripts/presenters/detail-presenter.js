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
        // coba ambil dari API
        const response = await getStory(id);

        if (response.error) {
          throw new Error(response.message);
        }

        story = response.story;

        // simpan ke IndexedDB supaya bisa diakses offline nanti
        if (story && story.id) {
          await Database.putStory(story);
        }
      } else {
        // offline → fallback IndexedDB
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

      // fallback terakhir ke IndexedDB
      const offlineStory = await Database.getStoryById(id);
      if (offlineStory) {
        this._view.showStory(offlineStory);
      } else {
        this._view.showError("Gagal memuat detail story.");
      }
    }
  }
}
