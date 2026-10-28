import OpenGraphImage from "./opengraph-image";

export const alt = "Mastery Academy certificate";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 60;

/** X/Twitter cards use the same preview as Open Graph (the root `twitter-image.jpg` would win otherwise). */
export default function Image(props: { params: Promise<{ code: string }> }) {
  return OpenGraphImage(props);
}
