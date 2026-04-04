import FullLogo from "../Icons/FullLogo";
import SocialIcons from "../SocialIcons";

export default function Footer({ links }) {
    return (
        <footer className="footer">
            <h3 className="text-6xl pt-8 col-span-12 text-center">
                Let Me Guide You Home
            </h3>
            <div className="logo bg-bv-white rounded-md p-4">
                <a href={route('Home')}><img src="/img/vantasure.png" /></a>
            </div>
            <nav>
                {Nav(links)}
            </nav>
            <div className={`hericaFooterImage`}>
                <img src="/img/herica2.webp" />
            </div>
        </footer>
    );
}
function Nav(links) {


    return (
        <ul className="footerList">
            {links.map((link) => (
                <li key={link.route} className="NavItemContainer">
                    <div className="NavItem">
                        <a className="TextGradient" href={`${route(link.route)}`} data-content={link.name}>
                            {link.name}
                        </a>
                    </div>
                </li>
            ))}
        </ul>
    );
}
