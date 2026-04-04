import SectionTitle from "@/Components/SectionTitle";
import { Head, useForm, router } from "@inertiajs/react";
import { useState } from "react";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function LeadsForm({ form, h2, h3 }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        message: '',
        form: form || 'home'
    });

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
        <section id="LeadsFormSection" className="LeadsFormSection">
            <SectionTitle h2={h2 ?? "Join our"} h3={h3 ?? "Newsletter"} color="darkness" />
            <div className="leadsFormContent">
                <img className="overlayReverseImage" src="img/herica1.webp" />
                <div className="leadsFormSectionContainer">
                    <form onSubmit={handleSubmit} className="LeadsFormForm minimalForm">
                        <div className="LeadGroupName">
                            <input placeholder="name" type="text" maxLength='255' id="LeadFormName" className="LeadName" onChange={(e) => onChange(e.target, 'name')} />
                            <p className="error">{localErrors?.LeadFormName}</p>
                        </div>
                        <div className="LeadGroupEmail">
                            <input placeholder="email" type="email" maxLength='255' id="LeadFormEmail" className="LeadEmail" onChange={(e) => onChange(e.target, 'email')} />
                            <p className="error">{localErrors?.LeadFormEmail}</p>
                        </div>
                        <div className="LeadGroupMessage">
                            <textarea placeholder="message" id="LeadFormMessage" className="LeadMessage" onChange={(e) => onChange(e.target, 'message')} />
                            <p className="error">{localErrors?.LeadMessage}</p>
                        </div>
                        <button type="submit">Submit</button>
                    </form>
                </div>
            </div>
        </section >
    );
}
