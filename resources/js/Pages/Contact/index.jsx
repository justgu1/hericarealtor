import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import SectionTitle from "@/Components/SectionTitle";
import LeadsForm from "../Home/Sections/LeadForm";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import FullLogo from "@/Components/Icons/FullLogo";
import Facebook from "@/Components/Icons/Facebook";
import Instagram from "@/Components/Icons/Instagram";
import Whatsapp from "@/Components/Icons/Whatsapp";
import Phone from "@/Components/Icons/Phone";
import Youtube from "@/Components/Icons/Youtube";
import Linkedin from "@/Components/Icons/Linkedin";
import { usePage } from '@inertiajs/react';

export default function Contact() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        phone: '',
        message: '',
        form: 'contact me'
    });

    const { settings } = usePage().props;

    const [localErrors, setLocalErrors] = useState({});

    const swal = withReactContent(Swal);

    const onChange = (e, name) => {
        data[name] = e.value
        console.log(data)
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route("leads.store"), {
            onSuccess: () => {
                swal.close();
                swal.fire({
                    icon: "success",
                    title: "message sent successfully!",
                    text: "we will contact you!",
                    showConfirmButton: true,
                }).then(() => {

                })
            },
            onError: (errors) => {
                swal.close();
                swal.fire({
                    icon: "error",
                    title: "Something went wrong",
                    text: 'verify fields',
                });
                setLocalErrors((prevErrors) => ({
                    ...prevErrors,
                    errors
                }));
            },
        });
    }

    return (
        <div className="page grid grid-cols-12">
            <Head title="Contact" />
            <section id="contactMe">
                <SectionTitle h2="Contact" h3="Me" color="darkness" />
                <div className="contactContainer">
                    <form onSubmit={handleSubmit} className="contactMeForm minimalForm">
                        <div className="leadGroup">
                            <input placeholder="name" type="text" maxLength='255' id="name" className="LeadName" onChange={(e) => onChange(e.target, 'name')} />
                            <p className="error">{localErrors?.LeadFormName}</p>
                        </div>
                        <div className="leadGroup rightGroup">
                            <input placeholder="email" type="email" maxLength='255' id="email" className="LeadEmail" onChange={(e) => onChange(e.target, 'email')} />
                            <p className="error">{localErrors?.LeadFormEmail}</p>
                        </div>
                        <div className="leadGroup">
                            <input placeholder="enter your phone" type="tel" maxLength='255' id="phone" className="LeadPhone" onChange={(e) => onChange(e.target, 'phone')} />
                            <p className="error">{localErrors?.LeadFormPhone}</p>
                        </div>
                        <div className="leadGroup textArea">
                            <textarea placeholder="message" id="LeadFormMessage" className="message" onChange={(e) => onChange(e.target, 'message')} />
                            <p className="error">{localErrors?.LeadMessage}</p>
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                    <aside className="sobrepositionAside">
                        <div className="w-full md:w-3/6 flex flex-col gap-4 items-center justify-end">
                        <div className="logo">
                            <FullLogo />
                        </div>
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
                    </aside>
                </div>
            </section>
            <LeadsForm />
        </div>
    );
}
