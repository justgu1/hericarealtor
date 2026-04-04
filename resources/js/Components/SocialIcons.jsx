import styles from "/resources/css/SocialIcons.module.css";

import Facebook from "./Icons/Facebook";
import Instagram from "./Icons/Instagram";
import Phone from "./Icons/Phone";
import Whatsapp from "./Icons/Whatsapp";
import Linkedin from "./Icons/Linkedin";
import Youtube from "./Icons/Youtube";
import { usePage } from '@inertiajs/react';

export default function SocialIcons() {
    const { settings } = usePage().props;

    return (
        <aside className={`${styles.SocialIcons} SocialIcons`}>
            <ul>
                <li>
                    <a href={settings.facebook_link}>
                        <Facebook />
                    </a>
                </li>
                <li>
                    <a href={settings.instagram_link}>
                        <Instagram />
                    </a>
                </li>
                <li>
                    <a href={settings.youtube_link}>
                        <Youtube />
                    </a>
                </li>
                <li>
                    <a href={settings.linkedin_link}>
                        <Linkedin />
                    </a>
                </li>
                <li>
                    <a href={`https://wa.me/${settings.whatsapp}`}>
                        <Whatsapp />
                    </a>
                </li>
                <li>
                    <a href={`tel:${settings.phone}`}>
                        <Phone />
                    </a>
                </li>
            </ul>
        </aside>
    );
}
