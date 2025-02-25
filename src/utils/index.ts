export const escapeHtml = (unsafe: string) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const normalizeUrl = (link: string, baseUrl: string) => {
  try {
    const url = new URL(link, baseUrl);
    url.search = "";
    url.hash = "";
    return url.href;
  } catch (error) {
    console.error("Error normalizing URL:", link);
    return null;
  }
};
