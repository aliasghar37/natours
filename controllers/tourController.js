const fs = require("fs");
const Tour = require(`${__dirname}/../models/tourModel.js`);

// Reading the tours json data
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);

exports.getAllTours = (req, res) => {
    res.statusCode = 200;
    res.json({
        status: "success",
        result: tours.length,
        data: { tours },
    });
};
exports.getTour = (req, res) => {
    res.status(200).json({
        status: "success",
        data: {
            tour: tours[req.params.id],
        },
    });
};
exports.createTour = (req, res) => {
    const newId = tours[tours.length - 1].id + 1;
    const newTour = Object.assign({ id: newId }, req.body);
    tours.push(newTour);

    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        (error) => {
            res.status(201).json({ message: "success", data: newTour });
        }
    );
};
exports.updateTour = (req, res) => {
    tours[+req.params.id] = { ...req.body };
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        (error) => {
            res.status(201).json({
                status: "success",
                data: {
                    tour: tours[+req.params.id],
                },
            });
        }
    );
};
exports.deleteTour = (req, res) => {
    const updatedTour = tours.filter((el) => el.id !== +req.params.id);
    console.log(updatedTour);
    fs.writeFile(
        `${__dirname}/../dev-data/data/tours-simple.json`,
        JSON.stringify(updatedTour),
        (error) => {
            res.status(204).json({
                status: "success",
                data: null,
            });
        }
    );
};
