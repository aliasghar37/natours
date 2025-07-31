import axios from "axios";
import { showAlert } from "./alerts";
const stripe = Stripe(
    "pk_test_51RppW2IfUbJPnEseCuYSuzFtwnJjjxGVWpagCLM99DWqX7PjKR4l658MZUGsWJDU2H0dsbcBLJZJHrq3oy2A3SWz00c1UUbxiv"
);

export const bookTour = async (tourId) => {
    try {
        const session = await axios(
            `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
        );
        window.location = session.data.session.url;
    } catch (error) {
        console.log(error);
        showAlert("error", error);
    }
};
