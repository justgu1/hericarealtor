import FadeInWhenVisible from "@/Components/FadeInWhenVisible";
import MyIntroduction from "../Home/Sections/MyIntroduction";
import LeadsForm from "../Home/Sections/LeadForm";
import { Head } from "@inertiajs/react";
export default function About() {
    return (
        <div className="page grid grid-cols-12 overflow-hidden">
            <FadeInWhenVisible>
                <Head title="About" />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <MyIntroduction aboutPage={true} />
            </FadeInWhenVisible>
            <FadeInWhenVisible>
                <LeadsForm />
            </FadeInWhenVisible>
        </div>
    )
}
