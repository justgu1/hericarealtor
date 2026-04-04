import styles from "/resources/css/auth.module.css";
import InputGroup from '@/Components/Form/InputGroup';
import SectionTitle from '@/Components/SectionTitle';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function ForgotPassword() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const swal = withReactContent(Swal);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: false,
            background: "none",
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        post(route("password.email"), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Email sent!",
                    text: "Check your inbox for password reset instructions.",
                    timer: 3000,
                    showConfirmButton: false,
                });
            },
            onError: (errors) => {
                swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errors.email || "Something went wrong. Please try again.",
                });
            },
        });
    };

    return (
        <main className={styles.Main}>
            <section className={styles.left}>
                <form onSubmit={handleSubmit} className={`${styles.Form}`}>
                    <SectionTitle h2="Forgot" h3="Password" />
                    <InputGroup type="email" label="Email" placeholder="Enter your email" id="email" name="email" onChange={handleChange} required={true} />
                    <footer>
                        <div className={styles.secondaryButtons}>
                            <div className="InputGroup">
                            </div>
                            <a href={route('login')} className="w-full">Forgot your password?</a>
                        </div>
                        <button type="submit" className="principal" disabled={processing}>Send Reset Link</button>
                    </footer>
                </form>
            </section>
            <aside className={styles.right}>
                <figure>
                    <img className={styles.RightBackground} src="/img/banner.png" alt="real estate background image" />
                </figure>
            </aside>
        </main>
    );
}
