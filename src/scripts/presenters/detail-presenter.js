import { getStory } from "../data/api";

export default class DetailPresenter {
  constructor(view) {
    this._view = view;
  }

  async loadStory(id) {
    try {
      const response = await getStory(id);

      if (response.error) {
        throw new Error(response.message);
      }

      this._view.showStory(response.story);
    } catch (error) {
      window.location.hash = "#/";
    }
  }
}
