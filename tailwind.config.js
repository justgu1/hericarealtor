import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            colors: {
                "bv-white": {
                    DEFAULT: "#F4EDE4",
                    100: "#FBF8F4",
                    200: "#F7F2EB",
                    300: "#F3ECE1",
                    400: "#EFE6D7",
                    500: "#F4EDE4",
                    600: "#E3DBD3",
                    700: "#D3CAC2",
                    800: "#C2B8B0",
                    900: "#B2A79F",
                },
                "bv-black": {
                    DEFAULT: "#11151C",
                    100: "#31363F",
                    200: "#2B3038",
                    300: "#252A31",
                    400: "#1F242A",
                    500: "#11151C",
                    600: "#0F131A",
                    700: "#0D1117",
                    800: "#0B0E14",
                    900: "#090C11",
                },
                "bv-brown": {
                    DEFAULT: "#C08310",
                    100: "#FBE9C8",
                    200: "#F7D9A6",
                    300: "#F3C985",
                    400: "#EFB962",
                    500: "#C08310",
                    600: "#AB750E",
                    700: "#96670D",
                    800: "#82590B",
                    900: "#6D4B09",
                },
                "bv-orange": {
                    DEFAULT: "#F9AF04",
                    100: "#FEE9B8",
                    200: "#FED987",
                    300: "#FEC956",
                    400: "#FDBA25",
                    500: "#F9AF04",
                    600: "#DA9A03",
                    700: "#BB8503",
                    800: "#9D7002",
                    900: "#7E5C02",
                },
                "bv-yellow": {
                    DEFAULT: "#F7EB61",
                    100: "#FDF9D0",
                    200: "#FCF5AA",
                    300: "#FBF085",
                    400: "#FAEC60",
                    500: "#F7EB61",
                    600: "#D8CE54",
                    700: "#BAB046",
                    800: "#9B9238",
                    900: "#7D752A",
                },
            },
            backgroundImage: {
                'bv-gradient': 'linear-gradient(to right, #C18310 0%, #F9AF04 20%, #C18310 36%, #F7EB61 57%, #C18310 78%, #F9AF04 100%)',
                'bv-b-gradient': 'linear-gradient(to bottom, #C18310 0%, #F9AF04 20%, #C18310 36%, #F7EB61 57%, #C18310 78%, #F9AF04 100%)',
            },
            fontFamily: {
                handwrite: ["Dancing Script", "cursive"],
            },
            spacing: {
                '3.5': '85%',
            },
            inset: {
                '1/5': '20%',
                '3.5/4': '85%',
                'fit': 'fit-content',
                '1.5/4': '15%'
            },
            transitionDuration: {
                800: '800ms',
            },
            transitionTimingFunction: {
                'custom': 'cubic-bezier(0.15, 0.2, 0.1, 1)',
            },
        },
    },
    plugins: [forms],
};
