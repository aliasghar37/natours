import axios from "axios";
import { showAlert } from "./alerts";

export const addReview = async (userId, tourId, rating, review) => {
    try {
        const res = await axios({
            method: "POST",
            url: `${process.env.API_BASE_URL}/api/v1/tours/${tourId}/reviews`,
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
        console.log("ERROR 💥", error);
        showAlert("error", `ERROR: ${error.response.data.message}`);
    }
};
