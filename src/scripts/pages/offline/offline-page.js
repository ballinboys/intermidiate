import OfflinePagePresenter from "../../presenters/offline-page-presenter";
import { sendStoryToServer } from "../../data/api";

export default class OfflinePage {
  constructor() {
    this._presenter = new OfflinePagePresenter(this);
  }

  async render() {
    return `
      <section class="offline-stories">
        <h2>📦 Daftar Story Offline</h2>
        <div id="offlineStories" class="offline-list"></div>
        <button id="syncBtn" class="sync-btn">🔄 Sync All</button>
      </section>
    `;
  }

  async afterRender() {
    await this._presenter.loadOfflineStories();

    document.getElementById("syncBtn").addEventListener("click", async () => {
      await this._presenter.syncStories(async (story) => {
        // siapkan formData agar bisa dikirim seperti request normal
        const formData = new FormData();
        formData.append("description", story.description || "Tanpa Judul");
        formData.append("lat", story.lat ?? 0);
        formData.append("lon", story.lon ?? 0);

        // kalau ada foto asli (blob/File)
        if (story.photoFile) {
          formData.append("photo", story.photoFile);
        }

        await sendStoryToServer(formData);
      });
    });
  }

  // 👉 view methods
  showStories(stories) {
    const container = document.getElementById("offlineStories");
    if (!stories.length) {
      this.showEmpty("Tidak ada story offline ✨");
      return;
    }

    container.innerHTML = stories
      .map(
        (s) => `
    <div class="offline-card">
      <h3>${s.description || "Tanpa Judul"}</h3>
      ${
        s.photoUrl
          ? `<img src="${s.photoUrl}" class="offline-img" alt="preview"/>`
          : ""
      }
      <div class="offline-meta">
        <small><b>Lat:</b> ${s.lat}, <b>Lon:</b> ${s.lon}</small><br/>
        <small><b>Created:</b> ${
          s.createdAt ? new Date(s.createdAt).toLocaleString() : "Unknown"
        }</small>
      </div>
    </div>
  `
      )
      .join("");
  }

  showEmpty(message) {
    document.getElementById(
      "offlineStories"
    ).innerHTML = `<p class="offline-empty">${message}</p>`;
  }

  showSuccess(message) {
    alert(message);
    // refresh list setelah berhasil sync
    this._presenter.loadOfflineStories();
  }

  showError(message) {
    alert(`❌ ${message}`);
  }
}
