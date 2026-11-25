import Image from "next/image";

export default function AvatarImage({ src, alt, size = 80 }) {
  if (!src) {
    return null;
  }

  return <Image src={src} alt={alt} width={size} height={size} />;
}
