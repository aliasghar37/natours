import { login, logout, forgotPassword, resetPassword } from "./login.js";
import { signup } from "./signup";
import { displayMap } from "./leaflet.js";

// DOM ELEMENTS
const map = document.getElementById("map");
const loginForm = document.querySelector(".form_login");
const signupForm = document.querySelector(".form_signup");
const forgotPasswordForm = document.querySelector(".form_forgot_password");
const resetPasswordForm = document.querySelector(".form_reset_password");
const logoutBtn = document.querySelector(".nav__el--logout");
// Values

// Delegation
if (map) {
    const locations = JSON.parse(map.dataset.locations);
    const maptilerKey = map.dataset.maptilerkey;
    displayMap(locations, maptilerKey);
}

if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.querySelector("#email").value;
        forgotPassword(email);
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;
        login(email, password);
    });
}
if (logoutBtn) logoutBtn.addEventListener("click", logout);

if (signupForm) {
    signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.querySelector("#name").value;
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#password").value;
        const passwordConfirm =
            document.querySelector("#password__confirm").value;
        signup(name, email, password, passwordConfirm);
    });
}
if (resetPasswordForm) {
    resetPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const password = document.querySelector("#password").value;
        const passwordConfirm =
            document.querySelector("#password__confirm").value;

        const token = resetPasswordForm.dataset.token;
        resetPassword(password, passwordConfirm, token);
    });
}
