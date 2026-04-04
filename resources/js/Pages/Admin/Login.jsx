
import styles from "/resources/css/auth.module.css";
import InputGroup from '@/Components/Form/InputGroup';
import FullLogo from '@/Components/Icons/FullLogo';
import MinLogo from '@/Components/Icons/MinLogo';
import SectionTitle from '@/Components/SectionTitle';
import { Head, Link, useForm } from '@inertiajs/react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: true,
    });

    const swal = withReactContent(Swal);

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value
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

        post(route("login"), {
            onSuccess: () => {
                swal.fire({
                    icon: "success",
                    title: "Login successful!",
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    window.location.href = route("admin.dashboard");
                });
            },
            onError: (errors) => {
                swal.fire({
                    icon: "error",
                    title: "Login failed",
                    text: errors.email || errors.password || "Please check your credentials and try again.",
                });
            },
            onFinish: () => reset("password"),
        });
    };

    const rememberMeInputData = [{ title: "remember me", value: true }];

    return (
        <main className={styles.Main}>
            <section className={styles.left}>
                <form onSubmit={handleSubmit} className={`${styles.Form}`}>
                    <SectionTitle h2="Sign In" h3="" />
                    <InputGroup type="email" label="Email" placeholder="enter your email" id="email" name="email" onChange={handleChange} required={true} />
                    <InputGroup type="password" label="Password" placeholder="Enter your password" id="password" name="password" onChange={handleChange} required={true} />
                    <footer>
                        <div className={styles.secondaryButtons}>
                            <div className="InputGroup">
                                <label className="checkbox radio">
                                    remember me
                                    <input type="checkbox" onChange={handleChange} id="remember" name="remember" checked={data.remember} />
                                </label>
                            </div>
                            <a href={route('password.request')}>Forgot your password?</a>
                        </div>
                        <button type="submit" className="principal">Log in</button>
                    </footer>
                </form>
            </section>
            <aside className={styles.right}>
                <figure>
                    <img className={styles.RightBackground} src="/img/banner.png" alt={`realstate background image`} />
                </figure>
                <MinLogo />
            </aside>
        </main>
    )
}