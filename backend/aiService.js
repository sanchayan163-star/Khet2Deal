const axios = require("axios");


// =====================================================
// FLASK AI API URL
// =====================================================

const AI_API_URL =
    "https://inkjet-joining-order-adipex.trycloudflare.com";


// =====================================================
// CHECK AI API
// =====================================================

async function checkAIHealth() {

    try {

        const response = await axios.get(
            `${AI_API_URL}/health`
        );

        return response.data;

    } catch (error) {

        console.error(
            "AI API health check failed:",
            error.message
        );

        throw error;
    }
}


// =====================================================
// CROP QUALITY
// =====================================================

async function predictQuality(imagePath) {

    try {

        const FormData = require("form-data");
        const fs = require("fs");

        const form = new FormData();

        form.append(
            "image",
            fs.createReadStream(imagePath)
        );


        const response = await axios.post(
            `${AI_API_URL}/predict-quality`,
            form,
            {
                headers: {
                    ...form.getHeaders()
                },

                maxBodyLength:
                    Infinity,

                maxContentLength:
                    Infinity
            }
        );


        return response.data;

    } catch (error) {

        console.error(
            "Quality prediction failed:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
}


// =====================================================
// PRICE PREDICTION
// =====================================================

async function predictPrice(data) {

    try {

        const response = await axios.post(
            `${AI_API_URL}/predict-price`,
            data
        );


        return response.data;

    } catch (error) {

        console.error(
            "Price prediction failed:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
}


// =====================================================
// DEMAND PREDICTION
// =====================================================

async function predictDemand(data) {

    try {

        const response = await axios.post(
            `${AI_API_URL}/predict-demand`,
            data
        );


        return response.data;

    } catch (error) {

        console.error(
            "Demand prediction failed:",
            error.response?.data ||
            error.message
        );

        throw error;
    }
}


// =====================================================
// EXPORT
// =====================================================

module.exports = {

    checkAIHealth,

    predictQuality,

    predictPrice,

    predictDemand

};