const express = require("express");
const multer = require("multer");
const path = require("path");

const db = require("../db");
const { predictQuality } = require("../aiService");

const router = express.Router();


// =========================================
// IMAGE UPLOAD CONFIGURATION
// =========================================

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },

    filename: (req, file, cb) => {

        const uniqueName =
            Date.now() +
            "-" +
            Math.round(Math.random() * 1E9) +
            path.extname(file.originalname);

        cb(null, uniqueName);
    }

});


const upload = multer({

    storage: storage,

    limits: {
        fileSize: 5 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {

        const allowedTypes =
            /jpeg|jpg|png|webp/;

        const extension =
            allowedTypes.test(
                path.extname(file.originalname).toLowerCase()
            );

        const mimeType =
            allowedTypes.test(file.mimetype);

        if (extension && mimeType) {

            cb(null, true);

        } else {

            cb(
                new Error(
                    "Only JPG, JPEG, PNG and WEBP images are allowed"
                )
            );

        }

    }

});


// =========================================
// CREATE CROP LISTING
// =========================================

router.post(
    "/",
    upload.single("cropImage"),

    async (req, res) => {

        const {
            farmer_id,
            crop_id,
            quantity,
            unit,
            expected_price,
            harvest_date,
            description
        } = req.body;


        // =====================================
        // VALIDATION
        // =====================================

        if (
            !farmer_id ||
            !crop_id ||
            !quantity ||
            !unit
        ) {

            return res.status(400).json({

                error:
                    "farmer_id, crop_id, quantity and unit are required"

            });

        }


        if (!req.file) {

            return res.status(400).json({

                error:
                    "Crop image is required"

            });

        }


        const imagePath =
            req.file.path;


        try {

            // =================================
            // STEP 1: AI QUALITY PREDICTION
            // =================================

            console.log(
                "Checking crop quality with AI..."
            );


            const qualityResult =
                await predictQuality(imagePath);


            console.log(
                "AI Quality Result:",
                qualityResult
            );


            // =================================
            // STEP 2: CREATE CROP LISTING
            // =================================

            const listingSQL =
                "INSERT INTO crop_listings " +
                "(farmer_id, crop_id, quantity, unit, expected_price, harvest_date, description) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)";


            db.query(

                listingSQL,

                [
                    farmer_id,
                    crop_id,
                    quantity,
                    unit,
                    expected_price || null,
                    harvest_date || null,
                    description || null
                ],

                (err, result) => {

                    if (err) {

                        console.error(
                            "Create listing error:",
                            err
                        );

                        return res.status(500).json({

                            error:
                                err.message

                        });

                    }


                    const listingId =
                        result.insertId;


                    // =================================
                    // STEP 3: SAVE IMAGE
                    // =================================

                    const imageUrl =
                        "/uploads/" +
                        req.file.filename;


                    const imageSQL =
                        "INSERT INTO listing_images " +
                        "(listing_id, image_url, is_primary) " +
                        "VALUES (?, ?, ?)";


                    db.query(

                        imageSQL,

                        [
                            listingId,
                            imageUrl,
                            1
                        ],

                        (imageError) => {

                            if (imageError) {

                                console.error(
                                    "Save image error:",
                                    imageError
                                );

                                return res.status(500).json({

                                    error:
                                        imageError.message

                                });

                            }


                            // =================================
                            // STEP 4: SAVE AI QUALITY RESULT
                            // =================================

                            const qualitySQL =
                                "INSERT INTO quality_assessments " +
                                "(listing_id, quality_score, grade, model_version) " +
                                "VALUES (?, ?, ?, ?)";


                            db.query(

                                qualitySQL,

                                [
                                    listingId,
                                    qualityResult.quality_score,
                                    qualityResult.grade,
                                    "MobileNetV2-v1"
                                ],

                                (qualityError) => {

                                    if (qualityError) {

                                        console.error(
                                            "Save quality result error:",
                                            qualityError
                                        );

                                        return res.status(500).json({

                                            error:
                                                qualityError.message

                                        });

                                    }


                                    // =================================
                                    // FINAL RESPONSE
                                    // =================================

                                    res.status(201).json({

                                        message:
                                            "Crop listing created successfully with AI quality assessment",

                                        listing_id:
                                            listingId,

                                        image_url:
                                            imageUrl,

                                        quality_score:
                                            qualityResult.quality_score,

                                        grade:
                                            qualityResult.grade

                                    });

                                }

                            );

                        }

                    );

                }

            );


        } catch (error) {

            console.error(

                "AI quality prediction failed:",

                error.response?.data ||
                error.message

            );


            return res.status(500).json({

                error:
                    "AI quality prediction failed",

                details:
                    error.response?.data ||
                    error.message

            });

        }

    }

);


// =========================================
// GET FARMER'S CROP LISTINGS
// =========================================

router.get(
    "/farmer/:farmer_id",

    (req, res) => {

        const farmer_id =
            req.params.farmer_id;


        const sql =
            "SELECT " +
            "cl.listing_id, " +
            "cl.farmer_id, " +
            "cl.crop_id, " +
            "c.crop_name, " +
            "cl.quantity, " +
            "cl.unit, " +
            "cl.expected_price, " +
            "cl.harvest_date, " +
            "cl.description, " +
            "cl.status, " +
            "li.image_url, " +
            "qa.quality_score, " +
            "qa.grade " +

            "FROM crop_listings cl " +

            "JOIN crops c " +
            "ON cl.crop_id = c.crop_id " +

            "LEFT JOIN listing_images li " +
            "ON cl.listing_id = li.listing_id " +
            "AND li.is_primary = 1 " +

            "LEFT JOIN quality_assessments qa " +
            "ON cl.listing_id = qa.listing_id " +

            "WHERE cl.farmer_id = ? " +

            "ORDER BY cl.created_at DESC";


        db.query(

            sql,

            [farmer_id],

            (err, results) => {

                if (err) {

                    console.error(
                        "Load farmer listings error:",
                        err
                    );

                    return res.status(500).json({

                        error:
                            err.message

                    });

                }


                res.json(results);

            }

        );

    }

);


// =========================================
// GET ALL ACTIVE CROP LISTINGS FOR BUYERS
// =========================================

router.get(
    "/available",

    (req, res) => {

        const sql =
            "SELECT " +
            "cl.listing_id, " +
            "cl.farmer_id, " +
            "cl.crop_id, " +
            "c.crop_name, " +
            "cl.quantity, " +
            "cl.unit, " +
            "cl.expected_price, " +
            "cl.harvest_date, " +
            "cl.description, " +
            "cl.status, " +
            "li.image_url, " +
            "qa.quality_score, " +
            "qa.grade, " +
            "fp.farm_name, " +
            "fp.address, " +
            "fp.district, " +
            "fp.state, " +
            "fp.pincode " +

            "FROM crop_listings cl " +

            "JOIN crops c " +
            "ON cl.crop_id = c.crop_id " +

            "JOIN farmer_profiles fp " +
            "ON cl.farmer_id = fp.farmer_id " +

            "LEFT JOIN listing_images li " +
            "ON cl.listing_id = li.listing_id " +
            "AND li.is_primary = 1 " +

            "LEFT JOIN quality_assessments qa " +
            "ON cl.listing_id = qa.listing_id " +

            "WHERE cl.status = 'active' " +

            "ORDER BY cl.created_at DESC";


        db.query(

            sql,

            (err, results) => {

                if (err) {

                    console.error(
                        "Load available crop listings error:",
                        err
                    );

                    return res.status(500).json({

                        error:
                            err.message

                    });

                }


                res.json(results);

            }

        );

    }

);


// =========================================
// EXPORT ROUTER
// =========================================

module.exports = router;
