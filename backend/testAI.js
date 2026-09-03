const {
    checkAIHealth
} = require("./aiService");

async function test() {

    try {

        const result =
            await checkAIHealth();

        console.log(
            "AI API Response:",
            result
        );

    } catch (error) {

        console.error(
            "AI connection failed ❌"
        );

    }

}

test();