import { Link, usePage } from "@inertiajs/react";
import { FaAngleRight, FaHome } from "react-icons/fa";
export default function Breadcrumb() {
    const { url } = usePage();
    const paths = url.split("?")[0].split("/").filter(Boolean);

    const breadcrumbs = paths.map((path, index) => {
        const href = "/" + paths.slice(0, index + 1).join("/");
        return { label: decodeURIComponent(path), url: href };
    });

    return (
        <nav className="breadcrumb">
            <ul className="breadcrumb-list">
                <li className="breadcrumb-item">
                    <Link href="/" className="breadcrumb-link">
                        <FaHome className="breadcrumb-icon" />
                    </Link>
                </li>
                {breadcrumbs.map((item, index) => (
                    <li key={index} className="breadcrumb-item">
                        <FaAngleRight className="breadcrumb-separator" />
                        {index === breadcrumbs.length - 1 ? (
                            <span className="breadcrumb-text">{item.label}</span>
                        ) : (
                            <a href={item.label != "admin" ? item.url : route("admin.dashboard")} className="breadcrumb-link">{item.label}</a>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};
