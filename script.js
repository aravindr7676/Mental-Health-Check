
const API_URL = "https://mental-health-check-1-hq0k.onrender.com/predict";

const form = document.getElementById("predictionForm");
const predictBtn = document.getElementById("predictBtn");
const buttonText = document.getElementById("buttonText");
const errorMessage = document.getElementById("errorMessage");

const scoreElement = document.getElementById("score");
const progressBar = document.getElementById("progressBar");
const resultMessage = document.getElementById("resultMessage");
const resetBtn = document.getElementById("resetBtn");

// Display messages to the user
function showMessage(message, type = "error") {
    errorMessage.textContent = message;
    errorMessage.className = type === "success" ? "success" : "";
}

// Convert form values into the correct JSON types
function getFormData() {
    const formData = new FormData(form);

    return {
        Age: Number(formData.get("Age")),
        Gender: formData.get("Gender"),
        Country: String(formData.get("Country")).trim(),
        Academic_Level: formData.get("Academic_Level"),
        Most_Used_Platform: formData.get("Most_Used_Platform"),
        Purpose_Of_Use: formData.get("Purpose_Of_Use"),
        Avg_Daily_Usage_Hours: Number(
            formData.get("Avg_Daily_Usage_Hours")
        ),
        Daily_Unlocks: Number(formData.get("Daily_Unlocks")),
        Study_Hours: Number(formData.get("Study_Hours")),
        Physical_Activity_Hours: Number(
            formData.get("Physical_Activity_Hours")
        ),
        Sleep_Hours_Per_Night: Number(
            formData.get("Sleep_Hours_Per_Night")
        ),
        Stress_Level: formData.get("Stress_Level")
    };
}

// Display the model prediction
function displayResult(score) {
    scoreElement.textContent = score.toFixed(2);

    // Decorative meter assumes a 0–100 scale.
    // Change this if your model uses another score range.
    const percentage = Math.max(0, Math.min(100, score));

    progressBar.style.width = "0%";

    requestAnimationFrame(() => {
        progressBar.style.width = percentage + "%";
    });

    resultMessage.textContent =
        "Prediction received successfully from your ML model.";
}

// Submit the form to FastAPI
form.addEventListener("submit", async function (event) {
    event.preventDefault();
    showMessage("");

    if (!form.reportValidity()) {
        return;
    }

    const data = getFormData();

    if (!data.Country) {
        showMessage("Please enter your country.");
        return;
    }

    predictBtn.disabled = true;
    buttonText.textContent = "Generating prediction...";

    resultMessage.textContent = "Please wait while the model predicts.";

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        // Handle FastAPI validation or server errors
        if (!response.ok) {
            let message = "Prediction failed.";

            if (Array.isArray(result.detail)) {
                message = result.detail
                    .map(item =>
                        `${item.loc?.at(-1) || "Field"}: ${item.msg}`
                    )
                    .join(" | ");
            } else if (result.detail) {
                message = result.detail;
            }

            throw new Error(message);
        }

        const score = Number(
            result.predicted_mental_health_score
        );

        if (!Number.isFinite(score)) {
            throw new Error("The API returned an invalid score.");
        }

        displayResult(score);
        showMessage(
            "Your prediction was generated successfully!",
            "success"
        );

    } catch (error) {
        console.error("Prediction error:", error);

        resultMessage.textContent = "Prediction could not be generated.";

        if (error instanceof TypeError) {
            showMessage(
                "Cannot connect to FastAPI. Start your backend and check the API URL."
            );
        } else {
            showMessage(error.message);
        }

    } finally {
        predictBtn.disabled = false;
        buttonText.textContent = "Generate Prediction";
    }
});


// Reset the displayed result
resetBtn.addEventListener("click", function () {
    scoreElement.textContent = "--";
    progressBar.style.width = "0%";
    resultMessage.textContent = "Waiting for your prediction...";
    showMessage("");
});

