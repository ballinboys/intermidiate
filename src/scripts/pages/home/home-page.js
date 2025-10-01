import Database from "../../database";
import HomePresenter from "../../presenters/home-presenter";
import { showFormattedDate } from "../../utils";
import { getCityCountryFromCoords } from "../../utils/geocode";
import "leaflet/dist/leaflet.css";

export default class HomePage {
  constructor() {
    this._presenter = new HomePresenter(this, { db: Database });
    this._subscription = null;
  }

  async render() {
    return `
      <section class="container">
        <a href="#stories" class="skip-link" tabindex="1">Skip to content</a>
        <div id="stories" tabindex="-1"></div>
      </section>
    `;
  }

  async afterRender() {
    this._storiesContainer = document.getElementById("stories");
    this._presenter.loadStories();

    // Skip link handling
    const skipLink = document.querySelector(".skip-link");
    skipLink.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(skipLink.getAttribute("href"));
      if (target) {
        target.focus();
        target.scrollIntoView();
      }
    });

    await this._presenter.setupPushNotifications();
  }

  // ...existing code...

  async showStories(stories) {
    this._storiesContainer.innerHTML = `
    <div class="story-collection" role="list">
      ${stories
        .map(
          (story) => `
        <div class="story-item" role="listitem">
          <figure class="story-image">
            <img src="${story.photoUrl}" 
                 alt="Photo story by ${story.name}" 
                 loading="lazy">
          </figure>
          <div class="story-info">
            <h3 class="story-heading">${story.name}</h3>
            <div class="story-meta">
              <time datetime="${story.createdAt}">${showFormattedDate(
            story.createdAt
          )}</time>
              <span id="location-${story.id}">
                <img src="/assets/loading.png" alt="loading" style="width:16px;height:16px;vertical-align:middle;">
                Memuat lokasi...
              </span>
              <button class="like-button" data-id="${
                story.id
              }" aria-label="Like this story">
                ${story.liked ? "❤️" : "🤍"}
              </button>
            </div>
            <p class="story-desc">${story.description}</p>
            <p class="story-reporter">Dilaporkan oleh: ${
              story.name || "Anonim"
            }</p>
            <a href="/#/story/${
              story.id
            }" class="story-link story-action-btn">Selengkapnya &rarr;</a>
          </div>
        </div>
      `
        )
        .join("")}
    </div>
  `;

    // Update lokasi secara async setelah card dirender
    stories.forEach(async (story) => {
      const locationSpan = document.getElementById(`location-${story.id}`);
      if (story.lat && story.lon) {
        try {
          const locationText = await getCityCountryFromCoords(
            story.lat,
            story.lon
          );
          if (locationSpan) {
            locationSpan.innerHTML = `📍 ${locationText}`;
          }
        } catch {
          if (locationSpan) {
            locationSpan.innerHTML = "Lokasi tidak tersedia";
          }
        }
      } else {
        if (locationSpan) {
          locationSpan.innerHTML = "Lokasi tidak tersedia";
        }
      }
    });

    // Add event listeners for like buttons
    document.querySelectorAll(".like-button").forEach((button) => {
      button.addEventListener("click", async (e) => {
        const buttonEl = e.currentTarget;
        const storyId = buttonEl.dataset.id;
        const originalContent = buttonEl.innerHTML;

        try {
          buttonEl.disabled = true;
          const updatedStory = await this._presenter.toggleLike(storyId);
          buttonEl.innerHTML = updatedStory.liked ? "❤️" : "🤍";
        } catch (error) {
          console.error("UI error in like button:", error);
          if (buttonEl) {
            buttonEl.innerHTML = originalContent;
            this.showError(
              "Could not update like. Please refresh and try again."
            );
          }
        } finally {
          if (buttonEl) {
            buttonEl.disabled = false;
          }
        }
      });
    });
  }

  // ...existing code...

  showError(message) {
    this._storiesContainer.innerHTML = `<p class="error">${message}</p>`;
  }
}
