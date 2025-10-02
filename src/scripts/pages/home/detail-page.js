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
  }

  async afterRender() {
    this._authPresenter.authCheck();
    if (this._story?.lat && this._story?.lon) {
      this._initMap();
    }
  }

  showError(message) {
    console.error("Failed to load story:", message);
  }

  _getContent() {
    if (!this._story) return "<div>Loading...</div>";

    return `
        <section class="story-detail-container">
        <div class="story-header">
          <h1>${this._story.name}</h1>
          <a href="#/" class="nav-back">← All Stories</a>
        </div>
        <div class="story-body">
          <img src="${this._story.photoUrl}" 
               alt="Story by ${this._story.name}">
          <p class="story-text">${this._story.description}</p>
          <div id="locationMap" class="story-map"></div>
        </div>
      </section>
    `;
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
      iconSize: [25, 41], // ukuran icon
      iconAnchor: [12, 41], // titik anchor (bawah icon)
      popupAnchor: [1, -34], // posisi popup relatif
      shadowSize: [41, 41], // ukuran shadow
    });

    L.marker([this._story.lat, this._story.lon], { icon: customIcon }).addTo(
      map
    ).bindPopup(`
    <div class="map-popup">
      <h3>${this._story.name}</h3>
      <img src="${this._story.photoUrl}" alt="Story photo" class="popup-img">
      <p class="popup-desc">${this._story.description}</p>
      <div class="popup-meta">
        <span class="popup-date">${showFormattedDate(
          this._story.createdAt
        )}</span>
        <span class="popup-coords">
          Lat: ${this._story.lat.toFixed(4)}, Lng: ${this._story.lon.toFixed(4)}
        </span>
      </div>
    </div>
  `);
  }
}
