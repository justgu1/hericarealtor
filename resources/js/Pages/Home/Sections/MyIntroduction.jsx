import styles from "/resources/css/SocialIcons.module.css";
import Facebook from "@/Components/Icons/Facebook";
import Instagram from "@/Components/Icons/Instagram";
import Phone from "@/Components/Icons/Phone";
import Whatsapp from "@/Components/Icons/Whatsapp";
import Linkedin from "@/Components/Icons/Linkedin";
import Youtube from "@/Components/Icons/Youtube";
import { usePage } from '@inertiajs/react';


export default function MyIntroduction({ aboutPage = false }) {
    const { settings } = usePage().props;

    return (
        <section id="MyIntroduction" className="myIntroduction mt-8">
            <div className="aboutMeContainer">
                <article className="pt-8 md:p-0 w-full md:w-4/6">
                    <h3 className="text-bv-black lg:text-6xl break-all">Herica DeOliveira</h3>
                    <p className="text-bv-black text-xl">Realtor</p>
                    <p className="text-bv-black text-2xl">Let Me Guide You Home</p>
                    <p className="text-bv-black text-xl font-bold my-4">VantaSure Realty</p>
                    <p className="text-bv-black text-xl">
                        <a href={`tel:${settings.phone}`}>
                            (508) 509-2287
                        </a>
                    </p>
                    <p className="text-bv-black text-lg md:text-lg xl:text-xl mt-4">
                        {
                            aboutPage == true ? <>
                                Herica DeOliveira is a reliable and hard-working Real Estate Agent with expertise in areas from West Palm Beach to Miami. She is also active in the Orlando and Tampa areas. She's known for her exceptional customer service, quick response, and negotiation skills. With about five years of Real Estate experience, Herica strives to make each transaction as smooth and stress-free as possible for her clients. Herica began her career in Real Estate in 2019 and has become a top producer with about twenty million in sales. She joined Skye Louis Realty, The Keyes Company, and then merged with VantaSure Realty, where she has provided numerous clients with her knowledge, expertise, and unparalleled passion for the field. In addition to helping clients buy and sell homes, Herica is highly skilled in luxury properties, new construction homes, and commercial properties. Herica will be sure to exceed your Real Estate expectations. Contact her today!
                            </> : <>
                                is a professional who has reached  the Palm Beach through Miami real estate market with her dedication and knowledge. With personalized service and a deep understanding of her clients' needs, she has become a reference for those looking to buy or sell properties in the entire state of Florida. Her unique approach, combined with her experience, ensures trust and success in each transaction.
                            </>
                        }
                    </p>
                </article>
                <div className="w-full md:w-2/6 flex flex-col gap-4 items-center justify-end">
                    <img src="img/herica.png" className="w-full h-auto max-h-96 max-w-sm" />
                    <div className="rounded-xl p-1 bg-gradient-to-b from-bv-brown via-yellow to-bv-orange dark:from-bv-brown dark:via-bv-yellow dark:to-bv-orange">
                        <div className="FixedSocialIcons SocialIcons bg-bv-white p-4 rounded-lg">
                            <ul className="flex gap-4">
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
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
