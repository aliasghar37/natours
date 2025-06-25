const mongoose = require("mongoose");

// MONGOOSE SCHEMA
const tourSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, "Tour name is required"],
        unique: true,
    },
    rating: {
        type: Number,
        default: 4.5,
    },
    price: {
        type: Number,
        required: [true, "Tour price is required"],
    },
});

const Tour = mongoose.model("Tour", tourSchema);
module.exports = Tour;
