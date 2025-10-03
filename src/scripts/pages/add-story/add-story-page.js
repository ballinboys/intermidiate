import "leaflet/dist/leaflet.css";
import L from "leaflet";
import AddStoryPresenter from "../../presenters/add-story-presenter";
import AuthPresenter from "../../presenters/auth-presenter";
import { sendStoryToServer } from "../../data/api";
import Database from "../../database";
import marker from "/images/marker-icon.png";
import shadow from "/images/marker-shadow.png";
export default class AddStoryPage {
  constructor() {
    this._presenter = new AddStoryPresenter(this);
    this._authPresenter = new AuthPresenter();
    this._map = null;
    this._marker = null;
    this._photoUrl = null;
    this._stream = null;
  }

  async render() {
    return `
      <section class="story-form-wrapper">
      <h2>Share Your Story</h2>
      <form id="newStoryForm">

        <div class="input-section">
          <label for="storyDesc">Story Details</label>
          <textarea id="storyDesc" required></textarea>
        </div>
        <div class="input-section">
          <label>Add Photo</label>
          <div class="photo-container" id="photoContainer"></div>
          <button type="button" id="openCamera" class="photo-btn">Open Camera</button>
          <button type="button" id="openGallery" class="photo-btn">Pilih dari Galeri</button>
          <input type="file" id="photoUpload" accept="image/*" style="display:none">
        </div>
        <div class="input-section">
          <label>Select Location</label>
          <div id="storyMap" class="map-view"></div>
          <div class="location-coords">
            <span id="mapCoords">Tap on map to set location</span>
          </div>
        </div>
        <button type="submit" class="submit-btn">Share Story</button>
      </form>
    </section>
  `;
  }

  async afterRender() {
    if (!this._authPresenter.authCheck()) return;
    this._initMap();
    this._setupCamera();
    this._setupForm();

    window.addEventListener("beforeunload", () => this.cleanup());
    window.addEventListener("hashchange", () => this.cleanup());
  }

  _initMap() {
    this._map = L.map("storyMap").setView([-2.5489, 118.0149], 5);
    this._coordinates = { lat: -2.5489, lon: 118.0149 };

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this._map);

    // definisikan custom icon
    const customIcon = L.icon({
      iconUrl: marker,
      iconShadow: shadow,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    this._map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      document.getElementById("mapCoords").textContent = `Lat: ${lat.toFixed(
        4
      )}, Lng: ${lng.toFixed(4)}`;

      if (this._marker) {
        this._map.removeLayer(this._marker);
      }

      // pakai customIcon
      this._marker = L.marker([lat, lng], { icon: customIcon }).addTo(
        this._map
      );
      this._coordinates = { lat, lon: lng };
    });
  }

  _setupCamera() {
    const takePhotoBtn = document.getElementById("openCamera");
    const galleryBtn = document.getElementById("openGallery");
    const photoInput = document.getElementById("photoUpload");
    const photoPreview = document.getElementById("photoContainer");

    // Pilih dari galeri
    galleryBtn.addEventListener("click", () => {
      photoInput.click();
    });

    // Kamera
    takePhotoBtn.addEventListener("click", async () => {
      try {
        if (this._stream) {
          this._stopCamera();
        }

        this._stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        photoPreview.innerHTML = `
        <div class="camera-preview">
          <video id="cameraPreview" autoplay playsinline></video>
          <button type="button" id="captureBtn" class="capture-btn">
            <i class="capture-icon"></i>
          </button>
        </div>
      `;

        const video = document.getElementById("cameraPreview");
        video.srcObject = this._stream;

        document.getElementById("captureBtn").addEventListener("click", () => {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                console.error("Failed to create blob from canvas");
                return;
              }

              // langsung bikin File yang valid
              this._photoFile = new File([blob], "captured-photo.jpg", {
                type: "image/jpeg",
                lastModified: Date.now(),
              });

              // bikin preview dari File
              this._photoUrl = URL.createObjectURL(this._photoFile);

              photoPreview.innerHTML = `<img src="${this._photoUrl}" alt="Preview" style="max-width: 100%">`;

              this._stopCamera();
            },
            "image/jpeg",
            0.92
          );
        });
      } catch (error) {
        console.error("Camera error:", error);
        const useFilePicker = confirm(
          "Gagal membuka kamera. Gunakan file picker untuk memilih foto?"
        );
        if (useFilePicker) {
          photoInput.click();
        }
      }
    });

    // Upload dari file input
    photoInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this._photoFile = file; // simpan asli
        this._photoUrl = URL.createObjectURL(file); // buat preview
        photoPreview.innerHTML = `<img src="${this._photoUrl}" alt="Preview" style="max-width: 100%">`;
      }
    });
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }
  }

  cleanup() {
    this._stopCamera();

    window.removeEventListener("beforeunload", () => this.cleanup());
    window.removeEventListener("hashchange", () => this.cleanup());
  }

  _setupForm() {
    const form = document.getElementById("newStoryForm");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const description = document.getElementById("storyDesc").value;

      const storyData = {
        description,
        lat: this._coordinates?.lat,
        lon: this._coordinates?.lon,
        photo: this._photoFile, // ✅ ini harus File
      };

      if (!navigator.onLine) {
        await Database.addStoryOffline({
          ...storyData,
          id: Date.now().toString(),
        });
        this.showSuccess("✅ Story disimpan offline!");
      } else {
        await sendStoryToServer(storyData); // ✅ ini otomatis pakai postStory
        this.showSuccess("✅ Story berhasil dikirim!");
      }
    });
  }

  showSuccess(message) {
    this.cleanup();
    alert(message);

    if (navigator.onLine) {
      // kalau online
      window.location.hash = "#/";
    } else {
      // kalau offline
      window.location.hash = "#/offline";
    }
  }
  showError(message) {
    alert(`Error: ${message} in add-story-page.js`);
  }
}
