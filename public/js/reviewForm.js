import axios from "axios";
import { showAlert } from "./alerts";

export const addReview = async (userId, tourId, rating, review) => {
    try {
        const res = await axios({
            method: "POST",
            url: `http://127.0.0.1:3000/api/v1/tours/${tourId}/reviews`,
            data: {
                review,
                rating,
                userId,
            },
        });
        if (res.data.status === "success") {
            showAlert("success", "Review has been added successfully!");
        }
    } catch (error) {
        console.log(error);
        showAlert("error", `ERROR: ${error.response.data.message}`);
    }
};
