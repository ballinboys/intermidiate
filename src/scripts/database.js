import { openDB } from "idb";

const DATABASE_NAME = "mystory";
const DATABASE_VERSION = 1;
const OBJECT_STORE_NAME = "saved-stories";

const SYNC_STORE_NAME = "pending-sync";

let dbPromise;
try {
  dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
    upgrade(db) {
      // Cek dan buat store baru
      if (!db.objectStoreNames.contains(OBJECT_STORE_NAME)) {
        db.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id" });
        console.log("✅ Store created:", OBJECT_STORE_NAME);
      }

      if (!db.objectStoreNames.contains(SYNC_STORE_NAME)) {
        db.createObjectStore(SYNC_STORE_NAME, { keyPath: "id" });
        console.log("✅ Store created:", SYNC_STORE_NAME);
      }
    },
  });
} catch (err) {
  console.error("❌ IndexedDB gagal diakses:", err);
  alert("IndexedDB tidak dapat dibuka. Coba refresh atau hapus cache browser.");
}
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
  async cacheStories(stories) {
    try {
      const db = await dbPromise;
      const tx = db.transaction(OBJECT_STORE_NAME, "readwrite");
      const store = tx.store;

      // Ambil data lama langsung dari transaction yang sama
      const existingStories = await store.getAll();
      const newIds = stories.map((s) => s.id);

      // 🧹 Hapus story lama yang sudah tidak ada di server
      await Promise.all(
        existingStories.map(async (old) => {
          if (!newIds.includes(old.id)) {
            await store.delete(old.id);
            console.log(`🧹 Deleted old story: ${old.id}`);
          }
        })
      );

      // 💾 Tambahkan story baru dan merge status liked
      await Promise.all(
        stories.map(async (s) => {
          const prev = existingStories.find((e) => e.id === s.id);
          const merged = { ...s, liked: prev?.liked ?? false };
          await store.put(merged);
        })
      );

      await tx.done;
      console.log(`🧩 Cached ${stories.length} stories ke IndexedDB`);
    } catch (err) {
      console.warn("⚠️ Gagal cache stories:", err);
    }
  },

  async getCachedStories() {
    try {
      const stories = await (await dbPromise).getAll(OBJECT_STORE_NAME);
      return stories || [];
    } catch (err) {
      console.warn("⚠️ Gagal load cached stories:", err);
      return [];
    }
  },
  async putStory(story) {
    if (!story || !story.id) {
      console.warn("🚫 Invalid story data, auto-generating id:", story);
      story.id = Date.now().toString();
    }

    const db = await dbPromise;
    try {
      await db.put(OBJECT_STORE_NAME, story);
      console.log("✅ Story saved:", story.id);
      return story;
    } catch (err) {
      console.error("❌ Failed to save story:", err, story);
      throw err;
    }
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
    if (pendingStories.length === 0) return;

    for (const story of pendingStories) {
      try {
        let fileToUpload = story.photoFile;
        if (fileToUpload && !(fileToUpload instanceof File)) {
          const blob = new Blob([fileToUpload], { type: "image/jpeg" });
          fileToUpload = new File([blob], "offline-photo.jpg", {
            type: "image/jpeg",
          });
        }
        story.photoFile = fileToUpload;
        await syncFunction(story);
        await removePendingSync(story.id);
        alert(
          `✅ Story "${
            story.description?.slice(0, 25) || "Tanpa Judul"
          }" tersinkron ke server`
        );
      } catch (err) {
        console.error("❌ Gagal sync story:", story.id, err);
      }
    }
  },
  async getPendingSyncStories() {
    return await getPendingSyncStories();
  },
  async getStoryById(id) {
    if (!id) throw new Error("`id` is required.");
    const key = String(id).trim();
    const story = await (await dbPromise).get(OBJECT_STORE_NAME, key);

    // auto generate photo URL jika belum ada
    if (story?.photoFile && !story.photoUrl) {
      try {
        story.photoUrl = URL.createObjectURL(story.photoFile);
      } catch {
        story.photoUrl = "/images/no-image.png";
      }
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

    const promises = stories.map(async (story) => {
      if (!story.id) throw new Error("Each story must have an id");

      const existing = await tx.store.get(story.id);

      const mergedStory = {
        ...existing, // data lama
        ...story, // overwrite dengan data baru
        liked: existing?.liked ?? false, // preserve status like
      };

      return tx.store.put(mergedStory);
    });

    await Promise.all(promises);
    await tx.done;

    return stories.length;
  },

  async toggleLike(storyId, fullStory = null) {
    try {
      const id = String(storyId).trim();
      let story = await this.getStoryById(id);

      // 🔹 Kalau belum pernah tersimpan, buat entry baru
      if (!story) {
        if (!fullStory)
          throw new Error("Full story data wajib saat pertama kali Like");

        // fallback default biar gak null
        const newStory = {
          id,
          name: fullStory.name || "Anonim",
          description: fullStory.description || "",
          createdAt: fullStory.createdAt || new Date().toISOString(),
          lat: fullStory.lat ?? null,
          lon: fullStory.lon ?? null,
          liked: true,
          photoUrl: fullStory.photoUrl || "/images/no-image.png",
        };

        await this.putStory(newStory);
        console.log("💾 Created new liked story:", newStory);
        return newStory;
      }

      // 🔹 Kalau sudah ada, toggle status like
      const updatedStory = { ...story, liked: !story.liked };
      await this.putStory(updatedStory);
      console.log("🔁 Updated liked state:", updatedStory);
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
