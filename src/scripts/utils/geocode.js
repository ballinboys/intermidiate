export async function getCityCountryFromCoords(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    const city = data.address.city || data.address.town || "";
    const country = data.address.country || "";
    return city && country
      ? `${city}, ${country}`
      : country || "Lokasi tidak ditemukan";
  } catch {
    return "Lokasi tidak ditemukan";
  }
}
