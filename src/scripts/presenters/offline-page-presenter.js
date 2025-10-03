import Database from "../database";

export default class OfflinePagePresenter {
  constructor(view) {
    this._view = view;
  }

  // dipanggil di OfflinePage.afterRender()
  async loadOfflineStories() {
    try {
      const stories = await Database.getPendingSyncStories();

      if (!stories || stories.length === 0) {
        this._view.showEmpty("Tidak ada story offline ✨");
      } else {
        this._view.showStories(stories);
      }
    } catch (err) {
      console.error("❌ Gagal load offline stories:", err);
      this._view.showError("Tidak bisa memuat story offline");
    }
  }

  // dipanggil ketika klik tombol Sync
  async syncStories(syncFn) {
    try {
      const pendingStories = await Database.getPendingSyncStories();

      if (!pendingStories.length) {
        this._view.showEmpty("Tidak ada data untuk disinkronkan");
        return;
      }

      for (const story of pendingStories) {
        try {
          await syncFn(story);
          await Database.removePendingSync(story.id);
        } catch (err) {
          console.error("❌ Gagal sync story:", story.id, err);
          this._view.showError(`Gagal sync story: ${story.description}`);
          return;
        }
      }

      this._view.showSuccess("✅ Semua story offline berhasil disinkronkan!");
    } catch (err) {
      console.error("❌ Error saat syncStories:", err);
      this._view.showError("Terjadi error saat sinkronisasi");
    }
  }
}
