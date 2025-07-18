import { login, logout } from "./login.js";
import { displayMap } from "./leaflet.js";

// DOM ELEMENTS
const map = document.getElementById("map");
const loginForm = document.querySelector(".form");
const logoutBtn = document.querySelector(".nav__el--logout");
// Values

// Delegation
if (map) {
    const locations = JSON.parse(map.dataset.locations);
    const maptilerKey = map.dataset.maptilerkey;
    displayMap(locations, maptilerKey);
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
