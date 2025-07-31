const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Tour = require(`${__dirname}/../models/tourModel.js`);
const Booking = require(`${__dirname}/../models/bookingModel.js`);
const catchAsync = require(`${__dirname}/../utils/catchAsync.js`);
const handlerFactory = require(`${__dirname}/../controllers/handlerFactory.js`);

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
    const tour = await Tour.findById(req.params.tourId);

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        success_url: `${req.protocol}://${req.get("host")}?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get("host")}/tours/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: "usd",
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [
                            `https://www.natours.dev/img/tours/${tour.imageCover}`,
                        ],
                    },
                },
            },
        ],
        mode: "payment",
    });

    res.status(200).json({
        status: "success",
        session,
    });
});

exports.createBookingCheckout = async (req, res, next) => {
    // TEMPORARY SOLUTION - UNSECURE
    const { tour, user, price } = req.query;
    if (!tour && !user && !price) return next();

    await Booking.create({ tour, user, price });
    res.redirect(req.originalUrl.split("?")[0]);
};

// ROUTE CALLBACKS
exports.getAllBookings = handlerFactory.getAll(Booking);
exports.getBooking = handlerFactory.getOne(Booking);
exports.createBooking = handlerFactory.createOne(Booking);
exports.updateBooking = handlerFactory.updateOne(Booking);
exports.deleteBooking = handlerFactory.deleteOne(Booking);
