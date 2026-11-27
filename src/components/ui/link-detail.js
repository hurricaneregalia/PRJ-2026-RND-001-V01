import Link from "next/link";

export default function LinkDetail({ href, children }) {
  return <Link href={href}>{children}</Link>;
}