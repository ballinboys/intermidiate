import { openDB } from "idb";

const DATABASE_NAME = "mystory";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "saved-stories";

const SYNC_STORE_NAME = "pending-sync";

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade: (database) => {
    database.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
    // Tambahkan store untuk data pending sync
    if (!database.objectStoreNames.contains(SYNC_STORE_NAME)) {
      database.createObjectStore(SYNC_STORE_NAME, { keyPath: "id" });
    }
  },
});

async function savePendingSync(story) {
  return (await dbPromise).put(SYNC_STORE_NAME, story);
}

async function getPendingSyncStories() {
  return (await dbPromise).getAll(SYNC_STORE_NAME);
}

async function removePendingSync(id) {
  return (await dbPromise).delete(SYNC_STORE_NAME, id);
}
const Database = {
  async putStory(story) {
    if (!Object.hasOwn(story, "id")) {
      throw new Error("`id` is required to save.");
    }
    return (await dbPromise).put(OBJECT_STORE_NAME, story);
  },
  async addStoryOffline(story) {
    if (!story.id) story.id = Date.now().toString();

    // ✅ kalau ada file → generate photoUrl untuk preview offline
    if (story.photoFile && story.photoFile instanceof File) {
      story.photoUrl = URL.createObjectURL(story.photoFile);
    }

    await this.putStory(story);
    await savePendingSync(story);
    console.log("💾 Story tersimpan offline:", story.id);
  },

  async syncPendingStories(syncFunction) {
    const pendingStories = await getPendingSyncStories();
    for (const story of pendingStories) {
      try {
        let fileToUpload = story.photoFile;
        if (fileToUpload && !(fileToUpload instanceof File)) {
          fileToUpload = new File([fileToUpload], "offline-photo.jpg", {
            type: fileToUpload.type || "image/jpeg",
            lastModified: Date.now(),
          });
          story.photoFile = fileToUpload; // update agar konsisten
        }

        await syncFunction(story);
        await removePendingSync(story.id);
      } catch (err) {
        console.error("Sync failed for story:", story.id, err);
      }
    }
  },
  async getPendingSyncStories() {
    return await getPendingSyncStories();
  },
  async getStoryById(id) {
    if (!id) throw new Error("`id` is required.");
    const story = await (await dbPromise).get(OBJECT_STORE_NAME, id);

    // Kalau ada photoFile tapi gak ada photoUrl → bikin sementara
    if (story?.photoFile && !story.photoUrl) {
      story.photoUrl = URL.createObjectURL(story.photoFile);
    }
    return story || null;
  },

  async getAllStories() {
    const stories = await (await dbPromise).getAll(OBJECT_STORE_NAME);

    return stories.map((s) => {
      // kalau ada photoFile tapi masih Blob, bungkus jadi File
      if (s.photoFile && !(s.photoFile instanceof File)) {
        const fixedFile = new File([s.photoFile], "offline-photo.jpg", {
          type: s.photoFile.type || "image/jpeg",
          lastModified: Date.now(),
        });
        return {
          ...s,
          photoFile: fixedFile,
          photoUrl: URL.createObjectURL(fixedFile),
        };
      }

      // kalau ada photoFile tapi tidak ada photoUrl → buat url baru
      if (s.photoFile && !s.photoUrl) {
        return {
          ...s,
          photoUrl: URL.createObjectURL(s.photoFile),
        };
      }

      return s;
    });
  },

  async searchStories(keyword) {
    const stories = await this.getAllStories();
    if (!keyword) return stories;

    const lowerKeyword = keyword.toLowerCase();
    return stories.filter(
      (story) =>
        story.name?.toLowerCase().includes(lowerKeyword) ||
        story.description?.toLowerCase().includes(lowerKeyword)
    );
  },

  async removeStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_NAME, id);
  },

  async clearStories() {
    const tx = (await dbPromise).transaction(OBJECT_STORE_NAME, "readwrite");
    await tx.store.clear();
    await tx.done;
    return true;
  },

  async putStories(stories) {
    if (!Array.isArray(stories)) {
      throw new Error("Expected an array of stories");
    }
    const tx = (await dbPromise).transaction(OBJECT_STORE_NAME, "readwrite");
    const promises = stories.map((story) => {
      if (!story.id) throw new Error("Each story must have an id");
      return tx.store.put(story);
    });
    await Promise.all([...promises, tx.done]);
    return stories.length;
  },

  async toggleLike(storyId) {
    try {
      const story = await this.getStoryById(storyId);
      if (!story) {
        // Create a new entry if story doesn't exist
        const newStory = { id: storyId, liked: true };
        await this.putStory(newStory);
        return newStory;
      }

      const updatedStory = {
        ...story,
        liked: !story.liked,
      };

      await this.putStory(updatedStory);
      return updatedStory;
    } catch (error) {
      console.error("Error in toggleLike:", error);
      throw error;
    }
  },

  async getLikedStories() {
    const stories = await this.getAllStories();
    return stories.filter((story) => story.liked);
  },
};

export default Database;
