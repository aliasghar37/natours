import axios from "axios";
import { showAlert } from "./alerts";

export const updateSettings = async (data, type, msg) => {
    try {
        const res = await axios({
            method: "PATCH",
            url: `/api/v1/users/${type === "password" ? "updateMyPassword" : "updateMe"}`,
            data,
        });
        if (res.data.status === "success") {
            showAlert("success", msg);
            if (type === "password") {
                window.setTimeout(() => {
                    location.assign("/");
                }, 2000);
            }
        }
    } catch (error) {
        showAlert("error", `ERROR: ${error.response.data.message}`);
    }
};
