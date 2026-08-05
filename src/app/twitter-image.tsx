import { ImageResponse } from "next/og";
import { SocialCard, SOCIAL_IMAGE_SIZE } from "@/lib/ogImage";

export const alt = "Houselights — track your concerts";
export const size = SOCIAL_IMAGE_SIZE;
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(<SocialCard />, { ...size });
}
