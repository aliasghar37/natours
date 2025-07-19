import axios from "axios";
import { showAlert } from "./alerts.js";

export const login = async (email, password) => {
    try {
        const res = await axios({
            method: "POST",
            url: "http://127.0.0.1:3000/api/v1/users/login",
            data: {
                email,
                password,
            },
        });
        if (res.data.status === "success") {
            showAlert("success", "Logged in successfully!");
            window.setTimeout(() => {
                location.assign("/");
            }, 1500);
        }
    } catch (err) {
        showAlert("error", `ERROR: ${err.response.data.message}`);
    }
};

export const logout = async () => {
    try {
        const res = await axios({
            method: "GET",
            url: "http://127.0.0.1:3000/api/v1/users/logout",
        });
        if (res.data.status === "success") {
            showAlert("success", "Logged out successfully!");
            window.setTimeout(() => {
                location.reload(true);
            }, 1500);
        }
    } catch (err) {
        showAlert("error", `ERROR: ${err.response.data.message}`);
    }
};

export const forgotPassword = async (email) => {
    try {
        const res = await axios({
            method: "POST",
            url: "http://127.0.0.1:3000/api/v1/users/forgotPassword",
            data: {
                email,
            },
        });
        if (res.data.status === "success") {
            showAlert(
                "success",
                `Verification email sent to "${email}", check it out!`
            );
            window.setInterval(() => {
                location.assign("/");
            }, 2000);
        }
    } catch (err) {
        showAlert("error", `ERROR: ${err.response.data.message}`);
    }
};

export const resetPassword = async (password, passwordConfirm, token) => {
    try {
        const res = await axios({
            method: "PATCH",
            url: `http://127.0.0.1:3000/api/v1/users/resetPassword/${token}`,
            data: {
                password,
                passwordConfirm,
            },
        });
        console.log(res.data);
        if (res.data.status === "success") {
            showAlert("success", "Your password has been changed");
            window.setTimeout(() => {
                location.assign("/login");
            }, 2000);
        }
    } catch (err) {
        showAlert("error", `ERROR: ${err}`);
    }
};
