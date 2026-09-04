const API_URL = "https://khet2deal-backend.onrender.com";

// =====================================================
// LOGIN / SIGNUP ROLE
// =====================================================

let selectedRole = "";

// =====================================================
// OPEN LOGIN
// =====================================================

function openLogin(role) {
    selectedRole = role;

    const title = document.getElementById("loginTitle");

    if (title) {
        title.innerText =
            role === "farmer" ? "Farmer Login" : "Buyer Login";
    }

    const modal = document.getElementById("loginModal");

    if (modal) {
        modal.style.display = "flex";
    }

    const message = document.getElementById("loginMessage");

    if (message) {
        message.innerText = "";
    }
}

// =====================================================
// CLOSE LOGIN
// =====================================================

function closeLogin() {
    const modal = document.getElementById("loginModal");

    if (modal) {
        modal.style.display = "none";
    }
}

// =====================================================
// OPEN SIGNUP
// =====================================================

function openSignup(role) {
    selectedRole = role;

    const title = document.getElementById("signupTitle");

    if (title) {
        title.innerText =
            role === "farmer" ? "Farmer Sign Up" : "Buyer Sign Up";
    }

    const modal = document.getElementById("signupModal");

    if (modal) {
        modal.style.display = "flex";
    }

    const message = document.getElementById("signupMessage");

    if (message) {
        message.innerText = "";
    }

    const latitude = document.getElementById("signupLatitude");
    const longitude = document.getElementById("signupLongitude");
    const locationMessage = document.getElementById("locationMessage");
    const locationButton = document.getElementById("locationBtn");

    if (latitude) {
        latitude.value = "";
    }

    if (longitude) {
        longitude.value = "";
    }

    if (locationMessage) {
        locationMessage.innerText =
            "Please allow location access.";
    }

    if (locationButton) {
        locationButton.innerText = "📍 Allow Location";
        locationButton.disabled = false;
    }
}

// =====================================================
// CLOSE SIGNUP
// =====================================================

function closeSignup() {
    const modal = document.getElementById("signupModal");

    if (modal) {
        modal.style.display = "none";
    }
}

// =====================================================
// SWITCH LOGIN → SIGNUP
// =====================================================

function switchToSignup() {
    closeLogin();
    openSignup(selectedRole);
}

// =====================================================
// SWITCH SIGNUP → LOGIN
// =====================================================

function switchToLogin() {
    closeSignup();
    openLogin(selectedRole);
}

// =====================================================
// GET USER LOCATION
// =====================================================

function getUserLocation() {
    const locationMessage =
        document.getElementById("locationMessage");

    const locationButton =
        document.getElementById("locationBtn");

    if (!navigator.geolocation) {
        if (locationMessage) {
            locationMessage.innerText =
                "❌ Your browser does not support location.";
        }

        return;
    }

    if (locationMessage) {
        locationMessage.innerText =
            "📍 Requesting location permission...";
    }

    if (locationButton) {
        locationButton.disabled = true;
        locationButton.innerText =
            "📍 Getting Location...";
    }

    navigator.geolocation.getCurrentPosition(
        function (position) {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;

            const latitudeInput =
                document.getElementById("signupLatitude");

            const longitudeInput =
                document.getElementById("signupLongitude");

            if (latitudeInput) {
                latitudeInput.value = latitude;
            }

            if (longitudeInput) {
                longitudeInput.value = longitude;
            }

            console.log("Latitude:", latitude);
            console.log("Longitude:", longitude);

            if (locationMessage) {
                locationMessage.innerText =
                    "✅ Location detected successfully!";
            }

            if (locationButton) {
                locationButton.innerText =
                    "✅ Location Added";

                locationButton.disabled = false;
            }
        },

        function (error) {
            console.log("Location error:", error);

            if (locationButton) {
                locationButton.disabled = false;
                locationButton.innerText =
                    "📍 Allow Location";
            }

            if (!locationMessage) {
                return;
            }

            if (error.code === 1) {
                locationMessage.innerText =
                    "❌ Location permission denied. Please allow location.";
            } else if (error.code === 2) {
                locationMessage.innerText =
                    "❌ Location unavailable.";
            } else if (error.code === 3) {
                locationMessage.innerText =
                    "❌ Location request timed out.";
            } else {
                locationMessage.innerText =
                    "❌ Could not get location.";
            }
        },

        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        }
    );
}

// =====================================================
// REGISTER USER
// =====================================================

async function registerUser() {
    const name =
        document.getElementById("signupName")?.value.trim();

    const email =
        document.getElementById("signupEmail")?.value.trim();

    const phone =
        document.getElementById("signupPhone")?.value.trim();

    const password =
        document.getElementById("signupPassword")?.value;

    const latitude =
        document.getElementById("signupLatitude")?.value;

    const longitude =
        document.getElementById("signupLongitude")?.value;

    const message =
        document.getElementById("signupMessage");

    if (!name || !email || !password) {
        if (message) {
            message.innerText =
                "Name, email and password are required.";
        }

        return;
    }

    if (password.length < 6) {
        if (message) {
            message.innerText =
                "Password must be at least 6 characters.";
        }

        return;
    }

    if (
        selectedRole !== "farmer" &&
        selectedRole !== "buyer"
    ) {
        if (message) {
            message.innerText =
                "Please select Farmer or Buyer.";
        }

        return;
    }

    if (!latitude || !longitude) {
        if (message) {
            message.innerText =
                "📍 Please allow location before creating your account.";
        }

        return;
    }

    try {
        if (message) {
            message.innerText =
                "Creating your account...";
        }

        const response = await fetch(
            `${API_URL}/api/auth/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    phone: phone || null,
                    role: selectedRole,
                    latitude: parseFloat(latitude),
                    longitude: parseFloat(longitude)
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (
                data.error &&
                data.error.includes("Duplicate")
            ) {
                if (message) {
                    message.innerText =
                        "Email or phone already exists.";
                }
            } else {
                if (message) {
                    message.innerText =
                        data.error ||
                        data.message ||
                        "Registration failed.";
                }
            }

            return;
        }

        if (message) {
            message.innerText =
                "Account created successfully ✅";
        }

        setTimeout(() => {
            closeSignup();

            openLogin(selectedRole);

            const loginEmail =
                document.getElementById("loginEmail");

            if (loginEmail) {
                loginEmail.value = email;
            }

            alert(
                "Account created successfully! 🎉\n\n" +
                "Your location has also been saved automatically. 📍\n\n" +
                "Now login with your email and password."
            );
        }, 700);

    } catch (error) {
        console.error(error);

        if (message) {
            message.innerText =
                "Backend connection failed. Is Node.js server running?";
        }
    }
}

// =====================================================
// LOGIN USER
// =====================================================

async function loginUser() {
    const email =
        document.getElementById("loginEmail")?.value.trim();

    const password =
        document.getElementById("loginPassword")?.value;

    const message =
        document.getElementById("loginMessage");

    if (!email || !password) {
        if (message) {
            message.innerText =
                "Please enter email and password.";
        }

        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/auth/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            if (message) {
                message.innerText =
                    data.error ||
                    data.message ||
                    "Login failed.";
            }

            return;
        }

        if (
            data.user.role !== selectedRole
        ) {
            if (message) {
                message.innerText =
                    `This account is registered as ${data.user.role}.`;
            }

            return;
        }

        if (
            data.user.role === "farmer" &&
            !data.user.farmer_id
        ) {
            if (message) {
                message.innerText =
                    "Farmer profile not found. Please contact support.";
            }

            console.error(
                "Missing farmer_id:",
                data.user
            );

            return;
        }

        if (
            data.user.role === "buyer" &&
            !data.user.buyer_id
        ) {
            if (message) {
                message.innerText =
                    "Buyer profile not found. Please contact support.";
            }

            console.error(
                "Missing buyer_id:",
                data.user
            );

            return;
        }

        localStorage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        console.log(
            "Logged in user:",
            data.user
        );

        if (message) {
            message.innerText =
                "Login successful ✅";
        }

        setTimeout(() => {
            if (data.user.role === "farmer") {
                window.location.href = "farmer.html";
            } else if (data.user.role === "buyer") {
                window.location.href = "buyer.html";
            }
        }, 500);

    } catch (error) {
        console.error(error);

        if (message) {
            message.innerText =
                "Backend connection failed. Is Node.js server running?";
        }
    }
}

// =====================================================
// CREATE CROP LISTING + AI QUALITY
// =====================================================

async function createCropListing(event) {
    if (event) {
        event.preventDefault();
    }

    const userString =
        localStorage.getItem("user");

    if (!userString) {
        alert("Please login first.");
        return;
    }

    let user;

    try {
        user = JSON.parse(userString);
    } catch (error) {
        console.error(
            "Invalid user data:",
            error
        );

        alert("Please login again.");
        localStorage.removeItem("user");
        return;
    }

    if (
        user.role !== "farmer" ||
        !user.farmer_id
    ) {
        alert(
            "Only farmers can create crop listings."
        );

        return;
    }

    // =================================================
    // GET FORM VALUES
    // =================================================

    const cropId =
        document.getElementById("crop_id")?.value.trim();

    const quantity =
        document.getElementById("quantity")?.value.trim();

    const unit =
        document.getElementById("unit")?.value.trim();

    const expectedPrice =
        document.getElementById("expected_price")?.value.trim();

    const harvestDate =
        document.getElementById("harvest_date")?.value;

    const description =
        document.getElementById("description")?.value.trim();

    const imageInput =
        document.getElementById("cropImage");

    // =================================================
    // DEBUG
    // =================================================

    console.log(
        "========== CROP LISTING =========="
    );

    console.log(
        "Farmer ID:",
        user.farmer_id
    );

    console.log(
        "Crop ID:",
        cropId
    );

    console.log(
        "Quantity from input:",
        quantity
    );

    console.log(
        "Unit:",
        unit
    );

    console.log(
        "Expected Price:",
        expectedPrice
    );

    console.log(
        "Harvest Date:",
        harvestDate
    );

    // =================================================
    // VALIDATION
    // =================================================

    if (!cropId || !quantity || !unit) {
        alert(
            "Crop, quantity and unit are required."
        );

        return;
    }

    const quantityNumber =
        Number(quantity);

    if (
        !Number.isFinite(quantityNumber) ||
        quantityNumber <= 0
    ) {
        alert(
            "Please enter a valid quantity."
        );

        return;
    }

    if (
        !imageInput ||
        !imageInput.files ||
        !imageInput.files[0]
    ) {
        alert(
            "Please select a crop image."
        );

        return;
    }

    const imageFile =
        imageInput.files[0];

    // =================================================
    // IMAGE SIZE VALIDATION
    // =================================================

    if (
        imageFile.size >
        5 * 1024 * 1024
    ) {
        alert(
            "Image size must be less than 5 MB."
        );

        return;
    }

    // =================================================
    // CREATE FORMDATA
    // =================================================

    const formData =
        new FormData();

    formData.append(
        "farmer_id",
        String(user.farmer_id)
    );

    formData.append(
        "crop_id",
        String(cropId)
    );

    // EXACT QUANTITY
    formData.append(
        "quantity",
        String(quantityNumber)
    );

    formData.append(
        "unit",
        String(unit)
    );

    formData.append(
        "expected_price",
        expectedPrice || ""
    );

    formData.append(
        "harvest_date",
        harvestDate || ""
    );

    formData.append(
        "description",
        description || ""
    );

    formData.append(
        "cropImage",
        imageFile
    );

    // =================================================
    // VERIFY FORMDATA
    // =================================================

    console.log(
        "========== FORMDATA =========="
    );

    console.log(
        "Sending farmer_id:",
        formData.get("farmer_id")
    );

    console.log(
        "Sending crop_id:",
        formData.get("crop_id")
    );

    console.log(
        "Sending quantity:",
        formData.get("quantity")
    );

    console.log(
        "Sending unit:",
        formData.get("unit")
    );

    console.log(
        "Sending expected_price:",
        formData.get("expected_price")
    );

    console.log(
        "Sending harvest_date:",
        formData.get("harvest_date")
    );

    console.log(
        "Sending image:",
        formData.get("cropImage")?.name
    );

    // =================================================
    // BUTTON
    // =================================================

    const button =
        document.getElementById(
            "addCropButton"
        );

    if (button) {
        button.disabled = true;
        button.textContent =
            "AI Checking... ⏳";
    }

    try {
        // =================================================
        // SEND TO BACKEND
        // =================================================

        const response =
            await fetch(
                `${API_URL}/api/listings`,
                {
                    method: "POST",
                    body: formData
                }
            );

        const data =
            await response.json();

        console.log(
            "Listing response:",
            data
        );

        if (!response.ok) {
            alert(
                data.error ||
                data.details ||
                "Crop listing failed."
            );

            return;
        }

        // =================================================
        // SUCCESS
        // =================================================

        const qualityScore =
            data.quality_score !== undefined
                ? data.quality_score
                : "N/A";

        const grade =
            data.grade !== undefined
                ? data.grade
                : "N/A";

        alert(
            "Crop listed successfully! 🌱\n\n" +
            "Quantity: " +
            quantityNumber +
            " " +
            unit +
            "\n\n" +
            "AI Quality: " +
            qualityScore +
            "%\n" +
            "Grade: " +
            grade
        );

        console.log(
            "AI Quality:",
            qualityScore
        );

        console.log(
            "AI Grade:",
            grade
        );

        // =================================================
        // RESET FORM
        // =================================================

        const form =
            document.getElementById(
                "cropForm"
            );

        if (form) {
            form.reset();
        }

        // =================================================
        // RELOAD FARMER LISTINGS
        // =================================================

        if (
            typeof window.loadMyCrops ===
            "function"
        ) {
            await window.loadMyCrops();
        }

    } catch (error) {
        console.error(
            "Crop listing error:",
            error
        );

        alert(
            "Backend connection failed. Is Node.js server running?"
        );

    } finally {
        if (button) {
            button.disabled = false;
            button.textContent =
                "🌱 List Crop";
        }
    }
}

// =====================================================
// AI CHATBOT
// =====================================================

function toggleChat() {
    const chatbot =
        document.getElementById("chatbot");

    if (!chatbot) {
        return;
    }

    if (
        chatbot.style.display === "flex"
    ) {
        chatbot.style.display = "none";
    } else {
        chatbot.style.display = "flex";
    }
}

// =====================================================
// AI FEATURE BUTTONS
// =====================================================

function aiFeature(feature) {
    let response = "";

    if (feature === "quality") {
        response =
            "🌾 <b>Crop Quality</b><br><br>" +
            "Upload a crop image to check its quality percentage and grade.<br><br>" +
            "Example: <b>87.44% — Excellent</b>";

    } else if (feature === "price") {
        response =
            "💰 <b>Price Prediction</b><br><br>" +
            "I can predict the future crop price using our AI model.<br><br>" +
            "Example: <b>₹31.38/kg</b>";

    } else if (feature === "demand") {
        response =
            "📈 <b>Demand Forecast</b><br><br>" +
            "Our system analyzes the price trend to estimate demand.<br><br>" +
            "Example: <b>High ↑</b>";

    } else if (feature === "buyer") {
        response =
            "🤝 <b>Find Best Buyer</b><br><br>" +
            "I can compare nearby buyers using price, distance and rating.";

    } else if (feature === "help") {
        response =
            "💬 <b>App Help</b><br><br>" +
            "I can help you understand Khet2Deal, find buyers, check crop quality, predict prices and forecast demand.";
    }

    addBotMessage(response);
}

// =====================================================
// ADD BOT MESSAGE
// =====================================================

function addBotMessage(text) {
    const chatBody =
        document.getElementById("chatBody");

    if (!chatBody) {
        return;
    }

    const message =
        document.createElement("div");

    message.className =
        "bot-message";

    message.innerHTML =
        text;

    chatBody.appendChild(
        message
    );

    chatBody.scrollTop =
        chatBody.scrollHeight;
}

// =====================================================
// ADD USER MESSAGE
// =====================================================

function addUserMessage(text) {
    const chatBody =
        document.getElementById("chatBody");

    if (!chatBody) {
        return;
    }

    const message =
        document.createElement("div");

    message.style.background =
        "#245b4d";

    message.style.padding =
        "12px";

    message.style.borderRadius =
        "12px";

    message.style.marginBottom =
        "10px";

    message.style.textAlign =
        "right";

    message.innerText =
        text;

    chatBody.appendChild(
        message
    );

    chatBody.scrollTop =
        chatBody.scrollHeight;
}

// =====================================================
// CHAT INPUT
// =====================================================

function sendMessage() {
    const input =
        document.getElementById("chatInput");

    if (!input) {
        return;
    }

    const text =
        input.value.trim();

    if (!text) {
        return;
    }

    addUserMessage(text);

    input.value = "";

    const lowerText =
        text.toLowerCase();

    let response =
        "I can help you with Crop Quality, Price Prediction, Demand Forecast, Best Buyer or App Help. 🌱";

    if (
        lowerText.includes("price") ||
        lowerText.includes("দাম")
    ) {
        response =
            "💰 You can use <b>Price Prediction</b> to predict the future crop price.";

    } else if (
        lowerText.includes("quality") ||
        lowerText.includes("গুণমান")
    ) {
        response =
            "🌾 You can use <b>Crop Quality</b> to check the quality percentage of your crop.";

    } else if (
        lowerText.includes("demand") ||
        lowerText.includes("চাহিদা")
    ) {
        response =
            "📈 You can use <b>Demand Forecast</b> to see the expected demand.";

    } else if (
        lowerText.includes("buyer") ||
        lowerText.includes("ক্রেতা")
    ) {
        response =
            "🤝 You can use <b>Find Best Buyer</b> to find a nearby suitable buyer.";

    } else if (
        lowerText.includes("hello") ||
        lowerText.includes("hi") ||
        lowerText.includes("হাই")
    ) {
        response =
            "👋 Hello! How can I help you today?";
    }

    setTimeout(() => {
        addBotMessage(response);
    }, 400);
}

// =====================================================
// PRESS ENTER
// =====================================================

function handleChatKey(event) {
    if (event.key === "Enter") {
        sendMessage();
    }
}

// =====================================================
// CLOSE MODALS OUTSIDE CLICK
// =====================================================

window.addEventListener(
    "click",
    function (event) {
        const loginModal =
            document.getElementById("loginModal");

        const signupModal =
            document.getElementById("signupModal");

        if (
            event.target === loginModal
        ) {
            closeLogin();
        }

        if (
            event.target === signupModal
        ) {
            closeSignup();
        }
    }
);