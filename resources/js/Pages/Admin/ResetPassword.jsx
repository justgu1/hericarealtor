import styles from "/resources/css/auth.module.css";
import InputGroup from '@/Components/Form/InputGroup';
import SectionTitle from '@/Components/SectionTitle';
import { Head, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function ResetPassword(backendData) {
    const props = backendData.props
    const { data, setData, post, processing, errors, reset } = useForm({
        token: props.token,
        email: props.email,
        password: '',
        password_confirmation: '',
    });
    console.log(props)
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

        post(route("password.store"), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Password Reset Successful!",
                    text: "You can now log in with your new password.",
                    timer: 3000,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = route("login");
                });
            },
            onError: (errors) => {
                swal.fire({
                    icon: "error",
                    title: "Error",
                    text: errors.password || errors.password_confirmation || "Something went wrong. Please try again.",
                });
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <main className={styles.Main}>
            <section className={styles.left}>
                <form onSubmit={handleSubmit} className={`${styles.Form}`}>
                    <SectionTitle h2="Reset" h3="Password" />
                    <InputGroup type="email" label="Email" placeholder="Enter your email" id="email" name="email" value={data.email} onChange={handleChange} required={true} disabled={true} />
                    <InputGroup type="password" label="New Password" placeholder="Enter new password" id="password" name="password" onChange={handleChange} required={true} />
                    <InputGroup type="password" label="Confirm Password" placeholder="Confirm new password" id="password_confirmation" name="password_confirmation" onChange={handleChange} required={true} />
                    <footer>
                        <button type="submit" className="principal" disabled={processing}>Reset Password</button>
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
