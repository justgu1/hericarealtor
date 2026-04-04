import { Head, useForm } from '@inertiajs/react';
import styles from '/resources/css/admin.module.css';
import SectionTitle from '@/Components/SectionTitle';
import InputGroup from '@/Components/Form/InputGroup';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function Add({ type }) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        type: type || 'general',
    });

    const swal = withReactContent(Swal);

    const handleSubmit = (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: true,
            background: 'none',
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        post(route('admin.listings.features.store'), {
            onSuccess: () => {
                swal.close();
                swal.fire({
                    icon: 'success',
                    title: `${data.type} feature created successfully!`,
                    timer: 2000,
                    showConfirmButton: true,
                }).then(() => {
                    window.location.href = route('admin.listings.features.index', { type: data.type });
                });
            },
            onError: (errors) => {
                swal.close();
                swal.fire({
                    icon: 'error',
                    title: 'Something went wrong',
                    text: 'Please verify the fields.',
                });
            },
        });
    };

    return (
        <div id="AddFeature" className={styles.Section}>
            <Head title={`Add ${type} Feature`} />
            <SectionTitle h2="New" h3={`${type} feature`} />
            <section>
                <form onSubmit={handleSubmit}>
                    <fieldset>
                        <legend>Basic Information</legend>
                        <InputGroup
                            type="text"
                            placeholder="Feature name (slug auto-generated)"
                            label="Name"
                            id="name"
                            name="name"
                            required
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            error={errors.name}
                        />
                    </fieldset>
                    <fieldset className={styles.Rightcolumn}>
                        <div>
                            <button type="submit" className="principal" disabled={processing}>
                                Save feature
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    );
}