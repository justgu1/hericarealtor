import { Head, useForm } from "@inertiajs/react";
import styles from "/resources/css/admin.module.css";
import InputGroup from "@/Components/Form/InputGroup";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const swal = withReactContent(Swal);

export default function Settings(backendProps) {

    const settings = backendProps.props.settings;

    const { data, setData, post, processing, errors } = useForm({
        google_analytics: settings.google_analytics || '',
        facebook_pixel: settings.facebook_pixel || '',
        zillow_api_key: settings.zillow_api_key || '',
        facebook_link: settings.facebook_link || '',
        instagram_link: settings.instagram_link || '',
        linkedin_link: settings.linkedin_link || '',
        youtube_link_link: settings.youtube_link_link || '',
        whatsapp: settings.whatsapp || '',
        phone: settings.phone || '',
        email: settings.email || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!/^\+\d{4}-\d{3}-\d{4}$/.test(data.phone)) {
            return swal.fire({
                icon: "error",
                title: "Phone format invalid",
                text: "Please use the format: +1000-000-0000",
            });
        }

        if (!/^\d{11}$/.test(data.whatsapp)) {
            return swal.fire({
                icon: "error",
                title: "WhatsApp format invalid",
                text: "Please use only digits, 11 numbers (e.g. 11912345678)",
            });
        }

        swal.fire({
            allowOutsideClick: false,
            background: "none",
            showConfirmButton: false,
            didOpen: () => swal.showLoading(),
        });

        post(route("admin.settings.update"), {
            preserveState: true,
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Configurations saved!",
                    timer: 2000,
                    showConfirmButton: false,
                });
            },
            onError: () => {
                swal.fire({
                    icon: "error",
                    title: "Failed to save settings",
                });
            },
        });
    };

    return (
        <div id="Settings" className={styles.Section}>
            <Head title="Settings" />
            <h3 className="py-8">Site Settings</h3>

            <form onSubmit={handleSubmit} className="">
                <div className="form-config">
                    <InputGroup label="Google Analytics ID" value={data.google_analytics} onChange={e => setData('google_analytics', e.target.value)} />
                    <InputGroup label="Facebook Pixel ID" value={data.facebook_pixel} onChange={e => setData('facebook_pixel', e.target.value)} />
                    <InputGroup label="Zillow API Key" value={data.zillow_api_key} onChange={e => setData('zillow_api_key', e.target.value)} />
                    <InputGroup label="Facebook Link" value={data.facebook_link} onChange={e => setData('facebook_link', e.target.value)} />
                    <InputGroup label="Instagram Link" value={data.instagram_link} onChange={e => setData('instagram_link', e.target.value)} />
                    <InputGroup label="Linkedin Link" value={data.linkedin_link} onChange={e => setData('linkedin_link', e.target.value)} />
                    <InputGroup label="Youtube Link" value={data.youtube_link} onChange={e => setData('youtube_link', e.target.value)} />
                    <InputGroup label="WhatsApp" value={data.whatsapp} placeholder="11912345678" onChange={e => {
                        const onlyDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setData('whatsapp', onlyDigits);
                    }} />
                    <InputGroup
                        label="Phone"
                        value={data.phone}
                        placeholder="+1000-000-0000"
                        onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');

                            let formatted = '';
                            if (raw.length > 0) {
                                formatted = '+' + raw.slice(0, 4);
                            }
                            if (raw.length >= 5) {
                                formatted += '-' + raw.slice(4, 7);
                            }
                            if (raw.length >= 8) {
                                formatted += '-' + raw.slice(7, 11);
                            }

                            setData('phone', formatted);
                        }}
                    />
                    <InputGroup label="Email" type="email" value={data.email} onChange={e => setData('email', e.target.value)} />
                </div>

                <div className="flex justify-end gap-4 mt-4">
                    <button type="submit" className="btn principal" disabled={processing}>
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}
