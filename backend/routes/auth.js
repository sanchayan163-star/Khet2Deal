const express = require("express");
const bcrypt = require("bcryptjs");

const db = require("../db");

const router = express.Router();


// =====================================================
// REVERSE GEOCODING
// GPS → ADDRESS / DISTRICT / STATE / PINCODE
// =====================================================

async function getLocationDetails(latitude, longitude) {

    const url =
        `https://nominatim.openstreetmap.org/reverse` +
        `?format=jsonv2` +
        `&lat=${encodeURIComponent(latitude)}` +
        `&lon=${encodeURIComponent(longitude)}` +
        `&zoom=18` +
        `&addressdetails=1`;

    const response = await fetch(url, {
        headers: {
            "User-Agent": "Khet2Deal/1.0"
        }
    });

    if (!response.ok) {
        throw new Error(
            "Could not determine location from GPS"
        );
    }

    const data = await response.json();

    if (!data.address) {
        throw new Error(
            "Location address could not be found"
        );
    }

    const address = data.address;


    // ===============================
    // FIND DISTRICT
    // ===============================

    const district =
        address.county ||
        address.state_district ||
        address.city_district ||
        address.municipality ||
        address.city ||
        address.town ||
        address.village ||
        "Unknown";


    // ===============================
    // FIND STATE
    // ===============================

    const state =
        address.state ||
        "Unknown";


    // ===============================
    // FIND PINCODE
    // ===============================

    const pincode =
        address.postcode ||
        "N/A";


    // ===============================
    // FULL ADDRESS
    // ===============================

    const fullAddress =
        data.display_name ||
        `${latitude}, ${longitude}`;


    return {

        address:
            fullAddress.substring(0, 255),

        district:
            district.substring(0, 100),

        state:
            state.substring(0, 100),

        pincode:
            String(pincode).substring(0, 20),

        latitude,

        longitude

    };

}


// =====================================================
// REGISTER
// =====================================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            phone,
            role,
            latitude,
            longitude
        } = req.body;


        // =================================================
        // BASIC VALIDATION
        // =================================================

        if (
            !name ||
            !email ||
            !password ||
            !role
        ) {

            return res.status(400).json({

                error:
                    "Name, email, password and role are required"

            });

        }


        // =================================================
        // ROLE VALIDATION
        // =================================================

        if (
            role !== "farmer" &&
            role !== "buyer"
        ) {

            return res.status(400).json({

                error:
                    "Role must be farmer or buyer"

            });

        }


        // =================================================
        // LOCATION VALIDATION
        // =================================================

        if (
            latitude === undefined ||
            longitude === undefined ||
            latitude === null ||
            longitude === null
        ) {

            return res.status(400).json({

                error:
                    "Location permission is required"

            });

        }


        const lat =
            Number(latitude);

        const lon =
            Number(longitude);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
        ) {

            return res.status(400).json({

                error:
                    "Invalid latitude or longitude"

            });

        }


        if (
            lat < -90 ||
            lat > 90 ||
            lon < -180 ||
            lon > 180
        ) {

            return res.status(400).json({

                error:
                    "Invalid GPS coordinates"

            });

        }


        // =================================================
        // GET LOCATION DETAILS
        // =================================================

        let location;

        try {

            location =
                await getLocationDetails(
                    lat,
                    lon
                );

        }

        catch (locationError) {

            console.error(
                "Location error:",
                locationError.message
            );

            return res.status(400).json({

                error:
                    "Could not detect your address. Please try again."

            });

        }


        // =================================================
        // HASH PASSWORD
        // =================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // =================================================
        // INSERT USER
        // =================================================

        const userSQL = `

            INSERT INTO users
            (
                name,
                email,
                password,
                phone,
                role
            )

            VALUES (?, ?, ?, ?, ?)

        `;


        db.query(

            userSQL,

            [
                name,
                email,
                hashedPassword,
                phone || null,
                role
            ],

            (err, result) => {

                if (err) {

                    console.error(
                        "User insert error:",
                        err.message
                    );


                    // Duplicate email / phone
                    if (
                        err.code ===
                        "ER_DUP_ENTRY"
                    ) {

                        return res.status(409).json({

                            error:
                                "Email or phone already exists"

                        });

                    }


                    return res.status(500).json({

                        error:
                            err.message

                    });

                }


                const userId =
                    result.insertId;


                // =================================================
                // FARMER PROFILE
                // =================================================

                if (
                    role === "farmer"
                ) {

                    const farmerSQL = `

                        INSERT INTO farmer_profiles
                        (
                            user_id,
                            farm_name,
                            address,
                            district,
                            state,
                            pincode,
                            latitude,
                            longitude
                        )

                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)

                    `;


                    db.query(

                        farmerSQL,

                        [

                            userId,

                            `${name}'s Farm`,

                            location.address,

                            location.district,

                            location.state,

                            location.pincode,

                            location.latitude,

                            location.longitude

                        ],

                        (farmerError, farmerResult) => {

                            if (farmerError) {

                                console.error(
                                    "Farmer profile error:",
                                    farmerError.message
                                );


                                // Remove user if profile creation fails
                                db.query(
                                    "DELETE FROM users WHERE user_id = ?",
                                    [userId]
                                );


                                return res.status(500).json({

                                    error:
                                        farmerError.message

                                });

                            }


                            return res.status(201).json({

                                message:
                                    "Farmer registered successfully ✅",

                                user_id:
                                    userId,

                                farmer_id:
                                    farmerResult.insertId,

                                location: {

                                    address:
                                        location.address,

                                    district:
                                        location.district,

                                    state:
                                        location.state,

                                    pincode:
                                        location.pincode,

                                    latitude:
                                        location.latitude,

                                    longitude:
                                        location.longitude

                                }

                            });

                        }

                    );

                }


                // =================================================
                // BUYER PROFILE
                // =================================================

                else {

                    const buyerSQL = `

                        INSERT INTO buyer_profiles
                        (
                            user_id,
                            business_name,
                            address,
                            district,
                            state,
                            pincode,
                            latitude,
                            longitude
                        )

                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)

                    `;


                    db.query(

                        buyerSQL,

                        [

                            userId,

                            `${name}'s Business`,

                            location.address,

                            location.district,

                            location.state,

                            location.pincode,

                            location.latitude,

                            location.longitude

                        ],

                        (buyerError, buyerResult) => {

                            if (buyerError) {

                                console.error(
                                    "Buyer profile error:",
                                    buyerError.message
                                );


                                // Remove user if profile creation fails
                                db.query(
                                    "DELETE FROM users WHERE user_id = ?",
                                    [userId]
                                );


                                return res.status(500).json({

                                    error:
                                        buyerError.message

                                });

                            }


                            return res.status(201).json({

                                message:
                                    "Buyer registered successfully ✅",

                                user_id:
                                    userId,

                                buyer_id:
                                    buyerResult.insertId,

                                location: {

                                    address:
                                        location.address,

                                    district:
                                        location.district,

                                    state:
                                        location.state,

                                    pincode:
                                        location.pincode,

                                    latitude:
                                        location.latitude,

                                    longitude:
                                        location.longitude

                                }

                            });

                        }

                    );

                }

            }

        );

    }

    catch (error) {

        console.error(
            "Registration error:",
            error
        );


        res.status(500).json({

            error:
                error.message

        });

    }

});


// =====================================================
// LOGIN
// =====================================================

router.post("/login", (req, res) => {

    const {
        email,
        password
    } = req.body;


    if (
        !email ||
        !password
    ) {

        return res.status(400).json({

            error:
                "Email and password are required"

        });

    }


    const sql = `

        SELECT

            u.user_id,
            u.name,
            u.email,
            u.password,
            u.phone,
            u.role,

            fp.farmer_id,
            bp.buyer_id

        FROM users u

        LEFT JOIN farmer_profiles fp
            ON u.user_id = fp.user_id

        LEFT JOIN buyer_profiles bp
            ON u.user_id = bp.user_id

        WHERE u.email = ?

    `;


    db.query(

        sql,

        [email],

        async (err, results) => {

            if (err) {

                return res.status(500).json({

                    error:
                        err.message

                });

            }


            if (
                results.length === 0
            ) {

                return res.status(401).json({

                    error:
                        "Invalid email or password"

                });

            }


            const user =
                results[0];


            const passwordMatch =
                await bcrypt.compare(

                    password,

                    user.password

                );


            if (!passwordMatch) {

                return res.status(401).json({

                    error:
                        "Invalid email or password"

                });

            }


            res.json({

                message:
                    "Login successful ✅",

                user: {

                    user_id:
                        user.user_id,

                    name:
                        user.name,

                    email:
                        user.email,

                    phone:
                        user.phone,

                    role:
                        user.role,

                    farmer_id:
                        user.farmer_id,

                    buyer_id:
                        user.buyer_id

                }

            });

        }

    );

});


module.exports = router;