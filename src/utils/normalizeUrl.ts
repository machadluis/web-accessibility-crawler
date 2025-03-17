import { URL } from 'url';

export default (link: string, baseUrl: string) => {
  if (!URL.canParse(link, baseUrl)) {
    console.error(`Error normalizing URL: ${link}`);
    return null;
  }

  const url = new URL(link, baseUrl);

  url.search = "";
  url.hash = "";

  return url.toString();
};
