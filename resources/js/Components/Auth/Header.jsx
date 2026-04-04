import BreadCrumb from "@/Components/BreadCrumb";
import UserProfile from "@/Components/Auth/UserProfile";
import { usePage } from "@inertiajs/react";
import styles from "/resources/css/admin.module.css";
export default function Header() {
    return (
        <header className={styles.Header}>
            <BreadCrumb />
            <UserProfile />
        </header >
    );
}