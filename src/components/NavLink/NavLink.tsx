import { useRouter } from "next/router";
import Link from "next/link";
import classNames from "classnames";

export default function NavLink({
  href,
  exact,
  activeClassName,
  className,
  children,
  ...props
}: any) {
  const { asPath } = useRouter();
  const isActive = exact ? asPath === href : asPath.startsWith(href);


  return (
    <Link href={href} legacyBehavior>
      <a
        className={classNames(className, { [activeClassName]: isActive })}
        {...props}
      >
        {children}
      </a>
    </Link>
  );
}
