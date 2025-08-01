import axios from "axios";
import { showAlert } from "./alerts";

export const signup = async (name, email, password, passwordConfirm) => {
    try {
        const res = await axios({
            method: "POST",
            url: `${process.env.API_BASE_URL}/api/v1/users/signup`,
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
                "Your account has been created, we're logging you in."
            );
            window.setTimeout(() => {
                location.assign("/");
            }, 500);
        }
    } catch (err) {
        showAlert("error", `ERROR: ${err.response.data.message}`);
    }
};
