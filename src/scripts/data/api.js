import CONFIG from "../config";

const ENDPOINTS = {
  ENDPOINT: `${CONFIG.BASE_URL}/v1`,
};

export async function sendStoryToServer(story) {
  const { description, photo, lat, lon } = story;
  return await postStory({ description, photo, lat, lon });
}
export async function getStories() {
  try {
    const fetchResponse = await fetch(ENDPOINTS.ENDPOINT + "/stories", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const { listStory } = await fetchResponse.json();

    return { listStory };
  } catch (error) {
    return { listStory: [] };
  }
}

export async function getStory(id) {
  try {
    const fetchResponse = await fetch(ENDPOINTS.ENDPOINT + `/stories/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    const { story } = await fetchResponse.json();

    return { story };
  } catch (error) {
    console.error("Online fetch failed, trying offline:", error);

    return { story: null };
  }
}

export async function postLogin(email, password) {
  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT + "/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return await fetchResponse.json();
}

export async function postRegister(name, email, password) {
  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT + "/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
  return await fetchResponse.json();
}

export async function postStory({ description, photo, lat, lon }) {
  const formData = new FormData();
  formData.append("photo", photo);
  formData.append("description", description);

  if (lat !== undefined && lat !== null) formData.append("lat", lat);
  if (lon !== undefined && lon !== null) formData.append("lon", lon);

  const token = localStorage.getItem("token");
  if (!token) throw new Error("Token kosong, login dulu!");

  const fetchResponse = await fetch(ENDPOINTS.ENDPOINT + "/stories", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!fetchResponse.ok) {
    const text = await fetchResponse.text();
    throw new Error(
      `Server error ${fetchResponse.status}: ${fetchResponse.statusText}\n${text}`
    );
  }

  return await fetchResponse.json();
}

export async function subscribePushNotification({
  endpoint,
  keys: { p256dh, auth },
}) {
  const url = `${ENDPOINTS.ENDPOINT}/notifications/subscribe`;

  const data = JSON.stringify({
    endpoint,
    keys: { p256dh, auth },
  });

  const fetchResponse = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}

export async function unsubscribePushNotification({ endpoint }) {
  const url = `${ENDPOINTS.ENDPOINT}/notifications/subscribe`;

  const data = JSON.stringify({ endpoint });

  const fetchResponse = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: data,
  });
  const json = await fetchResponse.json();

  return {
    ...json,
    ok: fetchResponse.ok,
  };
}
