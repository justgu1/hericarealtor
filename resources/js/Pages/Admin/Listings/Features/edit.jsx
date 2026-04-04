import { Head, useForm } from '@inertiajs/react';
import styles from '/resources/css/admin.module.css';
import SectionTitle from '@/Components/SectionTitle';
import InputGroup from '@/Components/Form/InputGroup';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

export default function Edit({ props: { feature, type } }) {
    const { data, setData, put, processing, errors } = useForm({
        name: feature.name,
        type: type || 'general',
    });

    const swal = withReactContent(Swal);

    const handleSubmit = (e) => {
        e.preventDefault();

        swal.fire({
            allowOutsideClick: false,
            background: 'transparent',
            showConfirmButton: false,
            didOpen: () => {
                swal.showLoading();
            },
        });

        put(route('admin.listings.features.update', { id: feature.id }), {
            onSuccess: () => {
                swal.close();
                window.location.href = route('admin.listings.features.index', { type: data.type });
            },
            onError: () => {
                swal.close();
            },
        });
    };

    return (
        <div id="EditFeature" className={styles.Section}>
            <Head title={`Edit ${type.charAt(0).toUpperCase() + type.slice(1)} Feature`} />
            <SectionTitle h2="Edit" h3={`${type.charAt(0).toUpperCase() + type.slice(1)} Feature`} />
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
                                Save Feature
                            </button>
                        </div>
                    </fieldset>
                </form>
            </section>
        </div>
    );
}