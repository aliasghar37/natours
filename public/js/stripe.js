import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
    process.env.STRIPE_PUBLIC_KEY
);

export const bookTour = async (tourId) => {
    try {
        const session = await axios(
            `${process.env.API_BASE_URL}/api/v1/bookings/checkout-session/${tourId}`
        );
        window.location = session.data.session.url;
    } catch (error) {
        console.log("ERROR 💥", error);
        showAlert("error", error);
    }
};
