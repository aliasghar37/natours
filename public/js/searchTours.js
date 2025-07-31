import { showAlert } from "./alerts";
import axios from "axios";

export const searchTours = async (name) => {
    try {
        const res = await axios({
            method: "GET",
            url: `http://127.0.0.1:3000/api/v1/tours?name=${encodeURIComponent(name)}`,
        });
        const tours = res.data.data.data;
        if (res.data.status === "success") {
            tours.forEach((tour) => {
                const month = [
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                ];
                const date = new Date(tour.startDates[0]);
                const formattedDate = `${month[date.getMonth()]} ${date.getFullYear()}`;

                console.log(formattedDate);
                const markup = `
                    <div class="card">
                        <div class="card__header">
                            <div class="card__picture">
                                <div class="card__picture-overlay">&nbsp;</div>
                                <img
                                    src="img/tours/${tour.imageCover}"
                                    alt="Photo of ${tour.mame}"
                                    class="card__picture-img"
                                />
                            </div>

                            <h3 class="heading-tertirary">
                                <span>${tour.name}</span>
                            </h3>
                        </div>

                        <div class="card__details">
                            <h4 class="card__sub-heading">${tour.difficulty} ${tour.duration}-day tour</h4>
                            <p class="card__text">
                                ${tour.summary}
                            </p>
                            <div class="card__data">
                                <svg class="card__icon">
                                    <use
                                        xlink:href="img/icons.svg#icon-map-pin"
                                    ></use>
                                </svg>
                                <span>${tour.startLocation.description}</span>
                            </div>
                            <div class="card__data">
                                <svg class="card__icon">
                                    <use
                                        xlink:href="img/icons.svg#icon-calendar"
                                    ></use>
                                </svg>
                                <span>${formattedDate}</span>
                            </div>
                            <div class="card__data">
                                <svg class="card__icon">
                                    <use xlink:href="img/icons.svg#icon-flag"></use>
                                </svg>
                                <span>${tour.locations.length} stops</span>
                            </div>
                            <div class="card__data">
                                <svg class="card__icon">
                                    <use xlink:href="img/icons.svg#icon-user"></use>
                                </svg>
                                <span>${tour.maxGroupSize} people</span>
                            </div>
                        </div>
~
                        <div class="card__footer">
                            <p>
                                <span class="card__footer-value">$${tour.price}</span>
                                <span class="card__footer-text">per person</span>
                            </p>
                            <p class="card__ratings">
                                <span class="card__footer-value">${Math.round(tour.ratingsAverage * 10) / 10}</span>
                                <span class="card__footer-text">rating (${tour.ratingsQuantity})</span>
                            </p>
                            <a href="/tours/${tour.slug}" class="btn btn--green btn--small"
                                >Details</a
                            >
                        </div>
                    </div>
                    `;

                document.querySelector(".card-container").innerHTML = markup;
            });
        }
    } catch (error) {
        showAlert("error", `ERROR: ${error}`);
    }
};
