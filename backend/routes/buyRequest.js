const express = require("express");
const db = require("../db");

const router = express.Router();


// ==========================================
// CREATE BUY REQUEST
// POST /api/buy-requests
// ==========================================

router.post("/", (req, res) => {

    const {
        listing_id,
        buyer_id,
        requested_quantity,
        offered_price,
        message
    } = req.body;

    if (!listing_id || !buyer_id || !requested_quantity) {
        return res.status(400).json({
            error: "listing_id, buyer_id and requested_quantity are required"
        });
    }

    if (Number(requested_quantity) <= 0) {
        return res.status(400).json({
            error: "requested_quantity must be greater than 0"
        });
    }

    if (
        offered_price !== undefined &&
        offered_price !== null &&
        Number(offered_price) < 0
    ) {
        return res.status(400).json({
            error: "offered_price cannot be negative"
        });
    }

    const sql =
        "INSERT INTO buy_requests " +
        "(listing_id, buyer_id, requested_quantity, offered_price, message) " +
        "VALUES (?, ?, ?, ?, ?)";

    db.query(
        sql,
        [
            listing_id,
            buyer_id,
            requested_quantity,
            offered_price !== undefined ? offered_price : null,
            message || null
        ],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            res.status(201).json({
                message: "Buy request created successfully",
                request_id: result.insertId
            });
        }
    );
});


// ==========================================
// GET BUY REQUESTS FOR FARMER
// GET /api/buy-requests/farmer/:farmer_id
// ==========================================

router.get("/farmer/:farmer_id", (req, res) => {

    const farmer_id = req.params.farmer_id;

    const sql =
        "SELECT " +
        "br.request_id, " +
        "br.listing_id, " +
        "br.buyer_id, " +
        "br.requested_quantity, " +
        "br.offered_price, " +
        "br.message, " +
        "br.status, " +
        "br.created_at, " +

        "c.crop_name, " +

        "cl.quantity AS listing_quantity, " +
        "cl.unit, " +
        "cl.expected_price, " +

        "bp.business_name, " +
        "bp.address AS buyer_address, " +
        "bp.district AS buyer_district, " +
        "bp.state AS buyer_state, " +
        "bp.rating AS buyer_rating, " +

        "u.name AS buyer_name, " +
        "u.email AS buyer_email, " +
        "u.phone AS buyer_phone " +

        "FROM buy_requests br " +

        "JOIN crop_listings cl " +
        "ON br.listing_id = cl.listing_id " +

        "JOIN crops c " +
        "ON cl.crop_id = c.crop_id " +

        "JOIN buyer_profiles bp " +
        "ON br.buyer_id = bp.buyer_id " +

        "JOIN users u " +
        "ON bp.user_id = u.user_id " +

        "WHERE cl.farmer_id = ? " +

        "ORDER BY br.created_at DESC";

    db.query(
        sql,
        [farmer_id],
        (err, results) => {

            if (err) {
                console.error(
                    "Get farmer buy requests error:",
                    err.message
                );

                return res.status(500).json({
                    error: err.message
                });
            }

            res.json({
                requests: results
            });
        }
    );
});


// ==========================================
// ACCEPT BUY REQUEST
// PUT /api/buy-requests/:request_id/accept
// ==========================================

router.put("/:request_id/accept", (req, res) => {

    const request_id = req.params.request_id;

    const requestSql =
        "SELECT " +
        "br.request_id, " +
        "br.listing_id, " +
        "br.buyer_id, " +
        "br.requested_quantity, " +
        "br.offered_price, " +
        "br.status, " +
        "cl.farmer_id, " +
        "cl.quantity AS listing_quantity, " +
        "cl.expected_price " +

        "FROM buy_requests br " +

        "JOIN crop_listings cl " +
        "ON br.listing_id = cl.listing_id " +

        "WHERE br.request_id = ?";

    db.query(
        requestSql,
        [request_id],
        (err, results) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (results.length === 0) {
                return res.status(404).json({
                    error: "Buy request not found"
                });
            }

            const request = results[0];

            if (request.status !== "pending") {
                return res.status(400).json({
                    error: "Only pending requests can be accepted"
                });
            }

            const requestedQuantity =
                Number(request.requested_quantity);

            const listingQuantity =
                Number(request.listing_quantity);

            if (requestedQuantity <= 0) {
                return res.status(400).json({
                    error: "Invalid requested quantity"
                });
            }

            if (requestedQuantity > listingQuantity) {
                return res.status(400).json({
                    error:
                        "Requested quantity is greater than available listing quantity"
                });
            }

            let agreedPrice;

            if (
                request.offered_price !== null &&
                request.offered_price !== undefined
            ) {
                agreedPrice = Number(request.offered_price);
            } else {
                agreedPrice = Number(request.expected_price);
            }

            if (agreedPrice < 0) {
                return res.status(400).json({
                    error: "Invalid agreed price"
                });
            }

            const totalAmount =
                requestedQuantity * agreedPrice;

            const remainingQuantity =
                listingQuantity - requestedQuantity;

            let listingStatus = "active";

            if (remainingQuantity === 0) {
                listingStatus = "sold";
            }


            // Update buy request
            const updateRequestSql =
                "UPDATE buy_requests " +
                "SET status = 'accepted' " +
                "WHERE request_id = ?";

            db.query(
                updateRequestSql,
                [request_id],
                (err) => {

                    if (err) {
                        return res.status(500).json({
                            error: err.message
                        });
                    }


                    // Update listing quantity
                    const updateListingSql =
                        "UPDATE crop_listings " +
                        "SET quantity = ?, status = ? " +
                        "WHERE listing_id = ?";

                    db.query(
                        updateListingSql,
                        [
                            remainingQuantity,
                            listingStatus,
                            request.listing_id
                        ],
                        (err) => {

                            if (err) {
                                return res.status(500).json({
                                    error: err.message
                                });
                            }


                            // Create order
                            const orderSql =
                                "INSERT INTO orders " +
                                "(request_id, farmer_id, buyer_id, listing_id, quantity, agreed_price, total_amount, status) " +
                                "VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed')";

                            db.query(
                                orderSql,
                                [
                                    request.request_id,
                                    request.farmer_id,
                                    request.buyer_id,
                                    request.listing_id,
                                    requestedQuantity,
                                    agreedPrice,
                                    totalAmount
                                ],
                                (err, orderResult) => {

                                    if (err) {
                                        return res.status(500).json({
                                            error: err.message
                                        });
                                    }

                                    res.json({
                                        message:
                                            "Buy request accepted and order created successfully",

                                        request_id:
                                            request.request_id,

                                        order_id:
                                            orderResult.insertId,

                                        quantity:
                                            requestedQuantity,

                                        agreed_price:
                                            agreedPrice,

                                        total_amount:
                                            totalAmount,

                                        remaining_quantity:
                                            remainingQuantity
                                    });
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});


// ==========================================
// REJECT BUY REQUEST
// PUT /api/buy-requests/:request_id/reject
// ==========================================

router.put("/:request_id/reject", (req, res) => {

    const request_id = req.params.request_id;

    const sql =
        "UPDATE buy_requests " +
        "SET status = 'rejected' " +
        "WHERE request_id = ? " +
        "AND status = 'pending'";

    db.query(
        sql,
        [request_id],
        (err, result) => {

            if (err) {
                return res.status(500).json({
                    error: err.message
                });
            }

            if (result.affectedRows === 0) {
                return res.status(400).json({
                    error:
                        "Request not found or already processed"
                });
            }

            res.json({
                message:
                    "Buy request rejected successfully",

                request_id:
                    request_id
            });
        }
    );
});


// ==========================================
// TEST
// GET /api/buy-requests/test
// ==========================================

router.get("/test", (req, res) => {

    res.json({
        message: "Buy request route is working"
    });

});


module.exports = router;