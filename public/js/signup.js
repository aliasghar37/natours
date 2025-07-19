import axios from "axios";
import { showAlert } from "./alerts";

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: "POST",
            url: "http://127.0.0.1:3000/api/v1/users/signup",
            data: {
                name,
                email,
                password,
                passwordConfirm,
            },
        });
        if (res.data.status === "success") {
            showAlert(
                "success",
                "Your account has been created, Please log in to proceed."
            );
            window.setTimeout(() => {
                location.assign("/");
            }, 500);
        }
    } catch (err) {
        showAlert("error", `ERROR: ${err.response.data.message}`);
    }
};
