import { postStory } from "../data/api";

export default class AddStoryPresenter {
  constructor(view) {
    this._view = view;
  }

  async presenterPostStory(formData) {
    try {
      const response = await postStory(formData);

      if (response.error) {
        throw new Error(response.message);
      }

      this._view.showSuccess("Story added successfully!");
    } catch (error) {
      this._view.showError(error.message);
    }
  }
}
