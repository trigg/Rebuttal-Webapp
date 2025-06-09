import { create_app } from "./app";

window.onload = () => {
    // Store on window to allow access from debug console
    window.rebuttal_app = create_app();
};
