import '../css/embla.css';
import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import GuestLayout from '@/Layouts/GuestLayout';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Analytics from '@/Components/Analytics';

const appName = import.meta.env.VITE_APP_NAME || 'Herica Realtor';

// Função auxiliar para determinar o layout
const getLayout = (name, pageProps) => {
    const ignoredLayouts = ["Admin/Login", "Admin/ForgotPassword", "Admin/ResetPassword"];
    const user = pageProps.props.auth?.user;
    const isAdminRoute = window.location.pathname.startsWith('/admin');

    if (ignoredLayouts.includes(name)) {
        return null;
    }

    return user && isAdminRoute ? AuthenticatedLayout : GuestLayout;
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: async (name) => {
        const pageModule = await resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx')
        );

        const PageComponent = pageModule.default;

        if (!PageComponent.layout) {
            PageComponent.layout = (pageProps) => {
                const Layout = getLayout(name, pageProps);
                if (!Layout) {
                    return <PageComponent {...pageProps} />;
                }
                return (
                    <Layout>
                        <PageComponent {...pageProps} />
                    </Layout>
                );
            };
        }

        return PageComponent;
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        const settings = props.initialPage.props.settings || {};
        const tagManagerId = settings.google_analytics;
        const pixelId = settings.facebook_pixel;
        root.render(
            <>
                <Analytics tagManagerId={tagManagerId} pixelId={pixelId} />
                <App {...props} />
            </>
        );
    },
    progress: {
        color: '#4B5563',
    },
});
