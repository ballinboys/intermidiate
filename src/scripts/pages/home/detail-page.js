import "leaflet/dist/leaflet.css";
import L from "leaflet";
import DetailPresenter from "../../presenters/detail-presenter";
import AuthPresenter from "../../presenters/auth-presenter";
import { showFormattedDate } from "../../utils";
import markerIcon from "/images/marker-icon.png";
import markerShadow from "/images/marker-shadow.png";

export default class DetailPage {
  constructor() {
    this._presenter = new DetailPresenter(this);
    this._authPresenter = new AuthPresenter();
    this._story = null;
  }

  async render(params) {
    if (!params || !params.id) {
      window.location.hash = "#/";
      return "<div>Redirecting...</div>";
    }

    await this._presenter.loadStory(params.id);
    return this._getContent();
  }

  showStory(story) {
    this._story = story;
    const container = document.querySelector(".story-detail-container");
    if (container) {
      container.outerHTML = this._getContent(); // refresh tampilan setelah update like/save
      this._setupActions();
      if (this._story?.lat && this._story?.lon) {
        this._initMap();
      }
    }
  }

  async afterRender() {
    this._authPresenter.authCheck();
    if (this._story?.lat && this._story?.lon) {
      this._initMap();
    }
    this._setupActions();
  }

  showError(message) {
    console.error("Failed to load story:", message);
    const container = document.querySelector("#main-content");
    if (container) {
      container.innerHTML = `<p class="error">${message}</p>`;
    }
  }

  _getContent() {
    if (!this._story) return "<div>Loading...</div>";

    return `
      <section class="story-detail-container">
        <div class="story-header">
          <h1>${this._story.name || "Tanpa Nama"}</h1>
          <a href="#/" class="nav-back">← All Stories</a>
        </div>
        <div class="story-body">
          <img src="${
            this._story.photoUrl || "/images/no-image.png"
          }" alt="Story by ${this._story.name}">
          <p class="story-text">${this._story.description || ""}</p>

          <div class="story-meta">
            <time datetime="${this._story.createdAt || ""}">
              ${
                this._story.createdAt
                  ? showFormattedDate(this._story.createdAt)
                  : ""
              }
            </time>
          </div>

          <div id="locationMap" class="story-map"></div>

          <div class="story-actions">
            <button id="likeBtn" class="btn-like">
              ${this._story.liked ? "❤️ Unlike" : "🤍 Like"}
            </button>
          </div>
        </div>
      </section>
    `;
  }

  _setupActions() {
    const likeBtn = document.getElementById("likeBtn");
    const saveBtn = document.getElementById("saveBtn");

    if (likeBtn) {
      likeBtn.addEventListener("click", async () => {
        const updated = await this._presenter.toggleLike(this._story.id);
        this._story = updated;
        this.showStory(updated); // refresh UI
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener("click", async () => {
        const updated = await this._presenter.toggleSave(this._story);
        this._story = updated;
        this.showStory(updated); // refresh UI
      });
    }
  }

  _initMap() {
    if (!this._story.lat || !this._story.lon) return;

    const map = L.map("locationMap").setView(
      [this._story.lat, this._story.lon],
      8
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const customIcon = L.icon({
      iconUrl: markerIcon,
      shadowUrl: markerShadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    L.marker([this._story.lat, this._story.lon], { icon: customIcon }).addTo(
      map
    ).bindPopup(`
        <div class="map-popup">
          <h3>${this._story.name}</h3>
          <img src="${
            this._story.photoUrl
          }" alt="Story photo" class="popup-img">
          <p class="popup-desc">${this._story.description}</p>
          <div class="popup-meta">
            <span class="popup-date">${showFormattedDate(
              this._story.createdAt
            )}</span>
            <span class="popup-coords">
              Lat: ${this._story.lat.toFixed(
                4
              )}, Lng: ${this._story.lon.toFixed(4)}
            </span>
          </div>
        </div>
      `);
  }
}
