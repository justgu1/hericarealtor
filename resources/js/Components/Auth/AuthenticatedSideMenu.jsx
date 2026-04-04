import FullLogo from "@/Components/Icons/FullLogo.jsx";
import styles from "/resources/css/SideMenu.module.css";
import { MdDashboard } from "react-icons/md";
import { SlNotebook } from "react-icons/sl";
import { IoMdMail, IoIosSettings } from "react-icons/io";
import { TiPin } from "react-icons/ti";
import { FaPlus, FaIcons } from "react-icons/fa";
import { FaRegFolderOpen } from "react-icons/fa6";
import { BsHouseHeartFill } from "react-icons/bs";
import { GiHouse } from "react-icons/gi";
import { PiFilesFill } from "react-icons/pi";
import { FaTag } from "react-icons/fa";
import { FaCommentDots } from "react-icons/fa";
const iconMap = {
    MdDashboard: MdDashboard,
    PiFilesFill: PiFilesFill,
    IoMdMail: IoMdMail,
    TiPin: TiPin,
    FaPlus: FaPlus,
    FaIcons: FaIcons,
    FaRegFolderOpen: FaRegFolderOpen,
    BsHouseHeartFill: BsHouseHeartFill,
    IoIosSettings: IoIosSettings,
    GiHouse: GiHouse,
    FaTag: FaTag,
    FaCommentDots: FaCommentDots
};

export default function AuthenticatedSideMenu({ links, user }) {
    return (
        <aside className={`${styles.SideMenu} ${styles.Authenticated} SideMenu Authenticated`}>
            <FullLogo />
            <nav>
                {Nav(links)}
            </nav>
        </aside>
    );
}

function Nav(links) {
    return (
        <ul className={styles.SideMenuList}>
            {links.map((link) => {
                const IconComponent = iconMap[link.icon];

                return (
                    <li key={link.route} className="NavItemContainer">
                        <div className="NavItem flex items-center gap-2">
                            {IconComponent && <IconComponent className="text-xl" />}
                            <a className="TextGradient" href={`${route(`admin.${link.route}`)}`} data-content={link.name}>
                                {link.name}
                            </a>
                        </div>
                        {link.childrens && link.childrens.length > 0 && (
                            <ul className="SubItems">
                                {link.childrens.map((child) => {
                                    const ChildIcon = iconMap[child.icon];

                                    return (
                                        <li key={child.route} className="NavSubItem flex items-center gap-2">
                                            {ChildIcon && <ChildIcon className="text-lg" />}
                                            <a className="TextGradient" href={route(`admin.${child.route}`)} data-content={child.name}>
                                                {child.name}
                                            </a>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
