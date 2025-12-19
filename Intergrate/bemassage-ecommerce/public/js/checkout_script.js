// Populate order summary and form inputs from URL parameters
document.addEventListener("DOMContentLoaded", function () {
    const urlParams = new URLSearchParams(window.location.search);
    const treatment = urlParams.get("treatment") || "Selected Treatment";
    const price = urlParams.get("price") || "XX.XX";

    document.getElementById("treatment-name").textContent = treatment;
    document.getElementById("treatment-price").textContent = `$${price}`;
    document.getElementById("total").textContent = `$${price}`;
    document.getElementById("treatment-input").value = treatment;
    document.getElementById("price-input").value = price;
});

// jQuery Form Validation
$(document).ready(function () {
    // Toggle card fields based on payment method
    $('input[name="paymentMethod"]').change(function () {
        if ($(this).val() === "card") {
            $("#cardFields").slideDown(300);
            // Make card fields required
            $("#cardNumber, #expiry, #cvv").prop("required", true);
        } else {
            $("#cardFields").slideUp(300);
            // Remove required from card fields
            $("#cardNumber, #expiry, #cvv")
                .prop("required", false)
                .removeClass("is-invalid is-valid");
            $(".invalid-feedback", "#cardFields").hide();
        }
    });

    // Validation functions
    function validateName() {
        const name = $("#name").val().trim();
        const isValid = name.length >= 3;
        updateValidation("name", isValid);
        return isValid;
    }

    function validateEmail() {
        const email = $("#email").val().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isValid = emailRegex.test(email);
        updateValidation("email", isValid);
        return isValid;
    }

    function validatePhone() {
        const phone = $("#phone").val().trim();
        const phoneRegex = /^\d{10,}$/;
        const isValid = phoneRegex.test(phone.replace(/\D/g, ""));
        updateValidation("phone", isValid);
        return isValid;
    }

    function validateAddress() {
        const address = $("#address").val().trim();
        const isValid = address.length > 0;
        updateValidation("address", isValid);
        return isValid;
    }

    function validateCity() {
        const city = $("#city").val().trim();
        const isValid = city.length > 0;
        updateValidation("city", isValid);
        return isValid;
    }

    function validatePostal() {
        const postal = $("#postal").val().trim();
        const postalRegex = /^\d{4,6}$/;
        const isValid = postalRegex.test(postal);
        updateValidation("postal", isValid);
        return isValid;
    }

    function validateCountry() {
        const country = $("#country").val();
        const isValid = country !== "";
        updateValidation("country", isValid);
        return isValid;
    }

    function validatePaymentMethod() {
        const paymentSelected =
            $('input[name="paymentMethod"]:checked').length > 0;
        const container = $('input[name="paymentMethod"]')
            .first()
            .closest(".mb-3");
        if (paymentSelected) {
            container.removeClass("is-invalid").addClass("is-valid");
            $(".invalid-feedback", container).hide();
        } else {
            container.removeClass("is-valid").addClass("is-invalid");
            $(".invalid-feedback", container).show();
        }
        return paymentSelected;
    }

    function validateCardFields() {
        if ($('input[name="paymentMethod"]:checked').val() !== "card") {
            return true;
        }

        let allValid = true;
        const cardNumber = $("#cardNumber").val().trim();
        const expiry = $("#expiry").val();
        const cvv = $("#cvv").val().trim();

        // Validate card number (simple version)
        if (cardNumber.replace(/\s/g, "").length < 13) {
            updateValidation("cardNumber", false);
            allValid = false;
        } else {
            updateValidation("cardNumber", true);
        }

        // Validate expiry date
        if (!expiry || new Date(expiry) < new Date()) {
            updateValidation("expiry", false);
            allValid = false;
        } else {
            updateValidation("expiry", true);
        }

        // Validate CVV
        if (!cvv || cvv.length < 3 || cvv.length > 4 || !/^\d+$/.test(cvv)) {
            updateValidation("cvv", false);
            allValid = false;
        } else {
            updateValidation("cvv", true);
        }

        return allValid;
    }

    function validateTerms() {
        const termsAccepted = $("#terms").is(":checked");
        const container = $("#terms").closest(".form-check");
        if (termsAccepted) {
            container.removeClass("is-invalid").addClass("is-valid");
            $(".invalid-feedback", container).hide();
        } else {
            container.removeClass("is-valid").addClass("is-invalid");
            $(".invalid-feedback", container).show();
        }
        return termsAccepted;
    }

    function updateValidation(fieldId, isValid) {
        const field = $("#" + fieldId);
        const feedback = field.next(".invalid-feedback");

        if (isValid) {
            field.removeClass("is-invalid").addClass("is-valid");
            feedback.hide();
        } else {
            field.removeClass("is-valid").addClass("is-invalid");
            feedback.show();
        }
    }

    function validateForm() {
        const validations = [
            validateName(),
            validateEmail(),
            validatePhone(),
            validateAddress(),
            validateCity(),
            validatePostal(),
            validateCountry(),
            validatePaymentMethod(),
            validateCardFields(),
            validateTerms(),
        ];

        return validations.every((valid) => valid);
    }

    // Real-time validation
    $("#name").on("input", validateName);
    $("#email").on("input", validateEmail);
    $("#phone").on("input", validatePhone);
    $("#address").on("input", validateAddress);
    $("#city").on("input", validateCity);
    $("#postal").on("input", validatePostal);
    $("#country").on("change", validateCountry);
    $('input[name="paymentMethod"]').on("change", function () {
        validatePaymentMethod();
        validateCardFields();
    });
    $("#cardNumber, #expiry, #cvv").on("input", validateCardFields);
    $("#terms").on("change", validateTerms);

    // Form submission
    $("#checkout-form").on("submit", function (e) {
        e.preventDefault();

        if (validateForm()) {
            // Smooth scroll to top before submission
            $("html, body").animate({ scrollTop: 0 }, 500, function () {
                // Form is valid, proceed with submission
                $("#submit-btn").prop("disabled", true).text("Processing...");
                setTimeout(() => {
                    window.location.href = "booking.html";
                }, 1000);
            });
        } else {
            // Find first error and scroll to it
            const firstError = $(".is-invalid").first();
            if (firstError.length) {
                $("html, body").animate(
                    {
                        scrollTop: firstError.offset().top - 100,
                    },
                    500
                );
                firstError.focus();
            }
        }
    });
});