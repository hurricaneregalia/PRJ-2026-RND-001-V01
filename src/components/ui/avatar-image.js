import Image from "next/image";

export default function AvatarImage({ src, alt, width = 80, height = 80 }) {
  if (!src) {
    return null;
  }

  return <Image src={src} alt={alt} width={width} height={height} />;
}
