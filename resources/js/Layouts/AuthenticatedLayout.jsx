import { usePage } from "@inertiajs/react";
import React, { useState } from 'react';
import AuthenticatedSideMenu from "@/Components/Auth/AuthenticatedSideMenu";
import AuthenticatedHeader from "@/Components/Auth/Header";
import styles from "/resources/css/admin.module.css";

export default function AuthenticatedLayout({ children }) {
    const { props } = usePage();
    const user = props.auth?.user;
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    let color = "darkness";
    const links = [
        { route: "dashboard", name: "Dashboard", icon: "MdDashboard" },
        { route: "leads.index", name: "Leads", icon: "IoMdMail" },
        {
            route: "blog.posts.index", name: "Posts", icon: "TiPin", childrens: [
                { route: "blog.posts.add", name: "New post", icon: "FaPlus" },
                { route: "blog.categories.index", name: "Categories", icon: "FaRegFolderOpen" },
                { route: "blog.tags.index", name: "Tags", icon: "FaTag" },
            ]
        },
        {
            route: "listings.index", name: "Listings", icon: "GiHouse", childrens: [
                { route: "listings.add", name: "New listing", icon: "FaPlus" },
                { route: "listings.amenities.index", name: "Amenities", icon: "BsHouseHeartFill" },
                { route: "listings.features.index", name: "Features", icon: "FaIcons" },
            ],
        },
        {
            route: "reviews.index", name: "Reviews", icon: "FaCommentDots", childrens: [
                { route: "reviews.add", name: "New review", icon: "FaPlus" },
            ],
        },
        { route: "settings", name: "Settings", icon: "MdDashboard" },
    ];

    return (
        <div id="AuthenticatedLayout" className={`${color == "darkness" ? "darkness" : "brightness"} layout`}>
            <AuthenticatedSideMenu links={links} sideMenuOpen={sideMenuOpen} setSideMenuOpen={setSideMenuOpen} />
            <main
                className={`${styles.Authenticated} ${sideMenuOpen ? styles.OpennedSideMenu : ''}`}
                onClick={() => {
                    if (sideMenuOpen) {
                        setSideMenuOpen(false);
                    }
                }}
            >
                <AuthenticatedHeader />
                {children}
            </main>
        </div>
    );
}
