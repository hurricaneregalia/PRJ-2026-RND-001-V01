import Link from "next/link";

export default function PageHeader({ title, description, breadcrumbs = [], actions }) {
  return (
    <header>
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {breadcrumbs.length > 0 ? (
        <nav aria-label="Breadcrumb">
          {breadcrumbs.map((item, index) => (
            <span key={`${item.label}-${index}`}>
              {index > 0 ? " / " : null}
              {item.href ? (
                <Link href={item.href}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      {actions ? <div>{actions}</div> : null}
    </header>
  );
}
