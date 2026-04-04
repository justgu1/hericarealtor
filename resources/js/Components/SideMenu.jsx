import FullLogo from "./Icons/FullLogo";
import SocialIcons from "./SocialIcons";
import styles from "/resources/css/SideMenu.module.css";
export default function SideMenu({ links, user }) {
    return (
        <aside className={`${styles.SideMenu} SideMenu`}>
            <FullLogo />

            <nav>
                {Nav(links)}
            </nav>
            <SocialIcons />
        </aside>
    );
}

function Nav(links) {


    return (
        <ul className={styles.SideMenuList}>
            {links.map((link) => (
                <li key={link.route} className="NavItemContainer">
                    <div className="NavItem">
                        <a className="TextGradient" href={`${route(link.route)}`} data-content={link.name}>
                            {link.name}
                        </a>
                    </div>
                    {link.childrens && link.childrens.length > 0 && (
                        <ul className="SubItems">
                            {link.childrens.map((child) => (
                                <li key={child.route} className="NavSubItem">
                                    <a className="TextGradient" href={`${route(child.route)}`} data-content={child.name}>
                                        {child.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            ))}
        </ul>
    );
}