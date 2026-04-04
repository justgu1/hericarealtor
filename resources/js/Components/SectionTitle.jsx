import styles from '/resources/css/SectionTitle.module.css';

export default function SectionTitle({ h2, h3, color }) {
    return (
        <div className={`${styles.SectionTitle} ${color === 'darkness' ? styles.darkness : styles.brightness}`}>
            <div className={"flex flex-col flex-end items-end"}>
                <h2>
                    {h2}
                </h2>
                <span className="relative">
                    <h3 className="lg:translate-x-32">
                        {h3}
                    </h3>
                </span>
            </div>
        </div>
    );
}
