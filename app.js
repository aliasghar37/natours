const fs = require("fs");
const express = require("express");
const { error } = require("console");
const app = express();

app.use(express.json());
// app.get("/", (req, res) => {
//     res.status(200);
//     res.json({
//         message: "Hello from the server sise!",
//         from: "server",
//         app: "natours",
//     });
// });

// app.post("/post", (req, res) => {
//     res.status(200).send("Hello it's post method of http");
// });

const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/dev-data/data/tours-simple.json`)
);

app.get("/api/v1/tours", (req, res) => {
    res.statusCode = 200;
    res.json({
        status: "success",
        result: tours.length,
        data: { tours },
    });
});

app.get("/api/v1/tours/:id", (req, res) => {
    console.log(req);
    const id = +req.params.id;
    const tour = tours.find((el) => el.id === id);
    // If no tour found
    if (!tour) {
        res.status(404).json({
            status: "fail",
            message: "Invalid ID",
        });
    }

    res.status(200).json({
        status: "success",
        data: {
            tour,
        },
    });
});

app.post("/api/v1/tours", (req, res) => {
    // console.log(req.body);
    // const id = +req.params.id;
    // const tour = tours.find((el) => el.id === id);
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

    // res.send("done");
});

app.patch("/api/v1/tours/", (req, res) => {
    let tour = tours.find((el) => el.id === req.body.id);
    if (!tour) {
        res.status(404).send({
            status: "fail",
            message: "Invalid ID",
        });
    }
    tours[req.body.id] = { ...req.body };
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        (error) => {
            res.status(201).json({
                status: "success",
                data: {
                    tour: tours[req.body.id],
                },
            });
        }
    );
});
app.delete("/api/v1/tours/:id", (req, res) => {
    const id = +req.params.id;
    let tour = tours.findIndex((el) => el.id === id);
    if (!tour) {
        res.status(404).send({
            status: "fail",
            message: "Invalid ID",
        });
    }
    tours.splice(tour, 1);
    fs.writeFile(
        `${__dirname}/dev-data/data/tours-simple.json`,
        JSON.stringify(tours),
        (error) => {
            res.status(204).json({
                status: "success",
                data: null,
            });
        }
    );
});

const port = 3000;
app.listen(port, () => {
    console.log(`App is listenning at ${port}`);
});
