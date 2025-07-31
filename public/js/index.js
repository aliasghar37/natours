import { login, logout, forgotPassword, resetPassword } from "./login.js";
import { signup } from "./signup";
import { updateSettings } from "./updateSettings.js";
import { searchTours } from "./searchTours.js";
import { displayMap } from "./leaflet.js";
import { bookTour } from "./stripe.js";
import { showAlert } from "./alerts.js";
import { addReview } from "./reviewForm.js";

// DOM ELEMENTS
const map = document.getElementById("map");
const loginForm = document.querySelector(".form-login");
const signupForm = document.querySelector(".form-signup");
const forgotPasswordForm = document.querySelector(".form-forgot-password");
const resetPasswordForm = document.querySelector(".form-reset-password");
const userDataForm = document.querySelector(".form-user-data");
const userPasswordForm = document.querySelector(".form-user-password");
const navSearchForm = document.querySelector(".nav__search");
const reviewForm = document.querySelector(".review-form");
const logoutBtn = document.querySelector(".nav__el--logout");
const bookTourBtn = document.querySelector("#book-tour");
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

if (userDataForm) {
    userDataForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const form = new FormData();
        form.append("name", document.querySelector("#name").value);
        form.append("email", document.querySelector("#email").value);
        form.append("photo", document.querySelector("#photo").files[0]);
        const msg = "Your account settings has been changed successfully!";
        updateSettings(form, "data", msg);
    });
}

if (userPasswordForm) {
    userPasswordForm.addEventListener("submit", (e) => {
        e.preventDefault();
        document.querySelector(".btn--save-password").textContent =
            "Updating...";
        const passwordCurrent =
            document.querySelector("#password-current").value;
        const password = document.querySelector("#password").value;
        const passwordConfirm =
            document.querySelector("#password-confirm").value;
        const msg =
            "Your password has been changed successfully, please log in again.";

        updateSettings(
            { passwordCurrent, password, passwordConfirm },
            "password",
            msg
        );
        document.querySelector(".btn--save-password").textContent =
            "Save password";
        document.querySelector("#password-current").value = "";
        document.querySelector("#password").value = "";
        document.querySelector("#password-confirm").value = "";
    });
}
if (navSearchForm) {
    navSearchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = document.querySelector(".nav__search-input").value;
        searchTours(name);
        document.querySelector(".nav__search-input").value = "";
    });
}

if (bookTourBtn) {
    bookTourBtn.addEventListener("click", (e) => {
        e.target.textContent = "Processing...";
        const { tourid } = e.target.dataset;
        bookTour(tourid);
    });
}

// REVIEW FORM
document.querySelectorAll(".reviews__card form").forEach((form) => {
    const stars = form.querySelectorAll(".reviews__star");
    stars.forEach((star, index) => {
        star.addEventListener("click", () => {
            stars.forEach((s, i) => {
                s.classList.toggle("reviews__star--active", i <= index);
                s.classList.toggle("reviews__star--inactive", i > index);
            });
            form.dataset.rating = index + 1;
        });
    });
});

if (reviewForm)
    reviewForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const userId = reviewForm.dataset.user;
        if (!userId) {
            showAlert("error", "Please log in to add a review");
            return;
        }
        const tourId = reviewForm.dataset.tour;
        const rating = reviewForm.dataset.rating;
        const review = document.querySelector(".form__input").value;
        addReview(userId, tourId, rating, review);
    });
