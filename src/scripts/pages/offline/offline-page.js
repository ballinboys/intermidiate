import OfflinePagePresenter from "../../presenters/offline-page-presenter";
import Database from "../../database"; // jangan lupa import Database

export default class OfflinePage {
  constructor() {
    this._presenter = new OfflinePagePresenter(this);
  }

  async render() {
    return `
      <section class="liked-stories">
        <h2>💖 Cerita Favorit</h2>
        <p id="emptyMessage">Cerita yang Anda simpan sebagai favorit akan muncul di sini.</p>
        <div id="likedStories" class="story-list"></div>
      </section>
    `;
  }

  async afterRender() {
    await this._presenter.loadLikedStories();
  }

  // 👉 View methods
  showStories(stories) {
    const container = document.getElementById("likedStories");
    const emptyMessage = document.getElementById("emptyMessage");

    // ✅ hide pesan kalau ada story
    if (stories.length > 0) {
      emptyMessage.style.display = "none";
    } else {
      emptyMessage.style.display = "block";
    }

    container.innerHTML = stories
      .map(
        (s) => `
        <div class="story-card">
          <h3>${s.name || "Tanpa Judul"}</h3>
          ${
            s.photoUrl
              ? `<img src="${s.photoUrl}" alt="Story image" class="story-img"/>`
              : `<p>📷 Tidak ada gambar</p>`
          }
          <p><b>Lat:</b> ${s.lat ?? "?"}, <b>Lon:</b> ${s.lon ?? "?"}</p>
          <p><b>Created:</b> ${
            s.createdAt ? new Date(s.createdAt).toLocaleString() : "Unknown"
          }</p>
          <p>${s.description || ""}</p>

          <div class="story-actions">
            <a href="/#/story/${s.id}" class="btn-detail">➡ Selengkapnya</a>
            <button class="btn-unlike" data-id="${s.id}">💔 Unlike</button>
          </div>
        </div>
      `
      )
      .join("");

    // unlike listener
    container.querySelectorAll(".btn-unlike").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        const id = e.currentTarget.dataset.id;
        await this._presenter.toggleLike(id);
      });
    });

    // save listener
  }

  showEmpty(message) {
    const container = document.getElementById("likedStories");
    const emptyMessage = document.getElementById("emptyMessage");

    container.innerHTML = "";
    emptyMessage.style.display = "block";
    emptyMessage.textContent = message;
  }

  showError(message) {
    document.getElementById(
      "likedStories"
    ).innerHTML = `<p class="error">${message}</p>`;
  }
}
