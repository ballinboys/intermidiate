import Database from "../database";

export default class OfflinePagePresenter {
  constructor(view) {
    this._view = view;
  }

  /**
   * Load stories yang di-like dari IndexedDB
   */
  async loadLikedStories() {
    try {
      const stories = await Database.getLikedStories();
      if (!stories || stories.length === 0) {
        this._view.showEmpty("Belum ada cerita favorit ❤️");
      } else {
        this._view.showStories(stories);

        // tambahkan handler setelah render
        this._setupUnlikeHandlers();
      }
    } catch (err) {
      console.error("❌ Gagal load liked stories:", err);
      this._view.showError("Tidak bisa memuat cerita favorit");
    }
  }

  /**
   * Setup event handler untuk Unlike
   */
  _setupUnlikeHandlers() {
    const unlikeButtons = document.querySelectorAll(".btn-unlike");

    unlikeButtons.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const storyId = btn.dataset.id;
        try {
          await Database.toggleLike(storyId); // unlike
          await this.loadLikedStories(); // refresh list
        } catch (err) {
          console.error("❌ Gagal unlike:", err);
          this._view.showError("Tidak bisa menghapus dari favorit");
        }
      });
    });
  }
}
