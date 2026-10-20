export async function reverseGeocode(lat, lng) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=18&addressdetails=1`,
      { headers: { "Accept-Language": "ro" } },
    );
    const data = await res.json();
    const a = data.address ?? {};
    const street = [a.road, a.house_number].filter(Boolean).join(" nr. ");
    const city = a.city ?? a.town ?? a.village ?? a.county ?? "";
    return [street, city].filter(Boolean).join(", ");
  } catch {
    return "";
  }
}
