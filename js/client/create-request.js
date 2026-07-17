/* =========================================================
   KPRIET FREELANCER PLATFORM
   Create Client Request Logic
   File: js/client/create-request.js
========================================================= */

import {
    requireSupabaseClient
} from "../config/supabase.js";

import {
    cleanText,
    getInitials,
    createNavbarRole,
    setText
} from "../utils/helpers.js";

import {
    ROUTES,
    navigateTo
} from "../utils/navigation.js";

import {
    initializeAuthenticatedPage
} from "../auth/auth-guard.js";

/* =========================================================
   CREATE REQUEST CONFIGURATION
========================================================= */

const CREATE_REQUEST_CONFIG = Object.freeze({

    MINIMUM_TITLE_LENGTH: 5,

    MINIMUM_DESCRIPTION_LENGTH: 30,

    MAXIMUM_DESCRIPTION_LENGTH: 1500,

    MAXIMUM_NOTES_LENGTH: 750,

    MINIMUM_BUDGET: 1,

    PROFILE_COLUMNS: `
        id,
        full_name,
        email,
        campus_role,
        department,
        programme,
        academic_year,
        section,
        profile_photo_url
    `,

    REQUEST_COLUMNS: `
        id,
        client_id,
        title,
        service_category,
        description,
        required_skills,
        budget,
        deadline,
        contact_email,
        status,
        admin_review_note,
        reviewed_by,
        reviewed_at,
        created_at,
        updated_at
    `

});

/* =========================================================
   DOM ELEMENTS
========================================================= */

/* ---------------------------------------------------------
   NAVBAR
--------------------------------------------------------- */

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

/* ---------------------------------------------------------
   FORM
--------------------------------------------------------- */

const createRequestForm = document.getElementById("createRequestForm");
const createRequestMessage = document.getElementById("createRequestMessage");
const serviceTitle = document.getElementById("serviceTitle");
const serviceCategory = document.getElementById("serviceCategory");
const description = document.getElementById("description");
const budget = document.getElementById("budget");
const deadline = document.getElementById("deadline");
const contactEmail = document.getElementById("contactEmail");
const additionalNotes = document.getElementById("additionalNotes");

/* ---------------------------------------------------------
   FORM FIELDS
--------------------------------------------------------- */

const serviceTitleField = document.getElementById("serviceTitleField");
const serviceCategoryField = document.getElementById("serviceCategoryField");
const descriptionField = document.getElementById("descriptionField");
const budgetField = document.getElementById("budgetField");
const deadlineField = document.getElementById("deadlineField");
const contactEmailField = document.getElementById("contactEmailField");
const additionalNotesField = document.getElementById("additionalNotesField");

/* ---------------------------------------------------------
   CHARACTER COUNTERS
--------------------------------------------------------- */

const descriptionCharacterCount = document.getElementById("descriptionCharacterCount");
const additionalNotesCharacterCount = document.getElementById("additionalNotesCharacterCount");

/* ---------------------------------------------------------
   BUTTONS
--------------------------------------------------------- */

const cancelRequestButton = document.getElementById("cancelRequestButton");
const submitRequestButton = document.getElementById("submitRequestButton");
const submitRequestButtonLoader = document.getElementById("submitRequestButtonLoader");
const submitRequestButtonText = document.getElementById("submitRequestButtonText");

/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let isSubmitting = false;

/* =========================================================
   GET CURRENT USER PROFILE
========================================================= */

async function getCurrentUserProfile(authenticatedUser) {

    if (!authenticatedUser?.id) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(CREATE_REQUEST_CONFIG.PROFILE_COLUMNS)
        .eq("id", authenticatedUser.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;

}

/* =========================================================
   POPULATE NAVBAR
========================================================= */

function populateNavbar(user) {

    if (!user) {
        return;
    }

    const fullName = cleanText(user.full_name) || "Campus User";

    setText(navbarUserName, fullName);
    setText(navbarUserRole, createNavbarRole(user) || "KPRIET USER");
    setText(navbarUserAvatar, getInitials(fullName));

    applyBackgroundPhoto(navbarUserAvatar, user.profile_photo_url);

}

/* =========================================================
   APPLY BACKGROUND PHOTO
========================================================= */

function applyBackgroundPhoto(element, profilePhotoUrl) {

    if (!element) {
        return;
    }

    const photoUrl = cleanText(profilePhotoUrl);

    element.style.backgroundImage = "";
    element.style.backgroundSize = "";
    element.style.backgroundPosition = "";
    element.style.backgroundRepeat = "";

    if (!photoUrl) {
        return;
    }

    try {

        const parsedUrl = new URL(photoUrl);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return;
        }

        element.style.backgroundImage = `url("${parsedUrl.href}")`;
        element.style.backgroundSize = "cover";
        element.style.backgroundPosition = "center";
        element.style.backgroundRepeat = "no-repeat";
        element.textContent = "";

    } catch (error) {
        console.warn("Invalid profile photo URL:", error);
    }

}

/* =========================================================
   GET FIELD ERROR ELEMENT
========================================================= */

function getFieldErrorElement(fieldElement) {

    if (!fieldElement) {
        return null;
    }

    return fieldElement.querySelector(".field-error");

}

/* =========================================================
   SET FIELD ERROR
========================================================= */

function setFieldError(fieldElement, message) {

    if (!fieldElement) {
        return;
    }

    fieldElement.classList.add("has-error");

    const errorElement = getFieldErrorElement(fieldElement);

    if (errorElement) {
        setText(errorElement, message);
    }

}

/* =========================================================
   CLEAR FIELD ERROR
========================================================= */

function clearFieldError(fieldElement) {

    if (!fieldElement) {
        return;
    }

    fieldElement.classList.remove("has-error");

    const errorElement = getFieldErrorElement(fieldElement);

    if (errorElement) {
        setText(errorElement, "");
    }

}

/* =========================================================
   CLEAR ALL FORM ERRORS
========================================================= */

function clearAllFormErrors() {

    [
        serviceTitleField,
        serviceCategoryField,
        descriptionField,
        budgetField,
        deadlineField,
        contactEmailField,
        additionalNotesField
    ].forEach(clearFieldError);

}

/* =========================================================
   SHOW FORM MESSAGE
========================================================= */

function showFormMessage(message, type = "error") {

    if (!createRequestMessage) {
        return;
    }

    setText(createRequestMessage, message);

    createRequestMessage.classList.remove("hidden", "success", "error");
    createRequestMessage.classList.add(type);

}

/* =========================================================
   HIDE FORM MESSAGE
========================================================= */

function hideFormMessage() {

    if (!createRequestMessage) {
        return;
    }

    setText(createRequestMessage, "");

    createRequestMessage.classList.add("hidden");
    createRequestMessage.classList.remove("success", "error");

}

/* =========================================================
   UPDATE CHARACTER COUNTER
========================================================= */

function updateCharacterCounter(inputElement, counterElement, maximumLength) {

    if (!inputElement || !counterElement) {
        return;
    }

    const currentLength = inputElement.value.length;

    setText(counterElement, `${currentLength} / ${maximumLength}`);

}

/* =========================================================
   GET TODAY DATE
========================================================= */

function getTodayDateString() {

    const currentDate = new Date();

    const year = currentDate.getFullYear();

    const month = String(currentDate.getMonth() + 1).padStart(2, "0");

    const day = String(currentDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;

}

/* =========================================================
   CONFIGURE DEADLINE
========================================================= */

function configureDeadline() {

    if (!deadline) {
        return;
    }

    deadline.min = getTodayDateString();

}

/* =========================================================
   VALIDATE SERVICE TITLE
========================================================= */

function validateServiceTitle() {

    const titleValue = cleanText(serviceTitle?.value);

    clearFieldError(serviceTitleField);

    if (!titleValue) {
        setFieldError(serviceTitleField, "Service title is required.");
        return false;
    }

    if (titleValue.length < CREATE_REQUEST_CONFIG.MINIMUM_TITLE_LENGTH) {
        setFieldError(serviceTitleField, "Enter a clearer service title.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE SERVICE CATEGORY
========================================================= */

function validateServiceCategory() {

    const categoryValue = cleanText(serviceCategory?.value);

    clearFieldError(serviceCategoryField);

    if (!categoryValue) {
        setFieldError(serviceCategoryField, "Select a service category.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE DESCRIPTION
========================================================= */

function validateDescription() {

    const descriptionValue = cleanText(description?.value);

    clearFieldError(descriptionField);

    if (!descriptionValue) {
        setFieldError(descriptionField, "Service description is required.");
        return false;
    }

    if (descriptionValue.length < CREATE_REQUEST_CONFIG.MINIMUM_DESCRIPTION_LENGTH) {
        setFieldError(descriptionField, "Describe your requirement in at least 30 characters.");
        return false;
    }

    if (descriptionValue.length > CREATE_REQUEST_CONFIG.MAXIMUM_DESCRIPTION_LENGTH) {
        setFieldError(descriptionField, "Service description is too long.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE BUDGET
========================================================= */

function validateBudget() {

    const budgetValue = Number(budget?.value);

    clearFieldError(budgetField);

    if (!budget?.value) {
        setFieldError(budgetField, "Project budget is required.");
        return false;
    }

    if (!Number.isFinite(budgetValue) || budgetValue < CREATE_REQUEST_CONFIG.MINIMUM_BUDGET) {
        setFieldError(budgetField, "Enter a valid project budget.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE DEADLINE
========================================================= */

function validateDeadline() {

    const deadlineValue = cleanText(deadline?.value);

    clearFieldError(deadlineField);

    if (!deadlineValue) {
        setFieldError(deadlineField, "Expected deadline is required.");
        return false;
    }

    const selectedDate = new Date(`${deadlineValue}T00:00:00`);

    const today = new Date(`${getTodayDateString()}T00:00:00`);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
        setFieldError(deadlineField, "Select today or a future date.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE CONTACT EMAIL
========================================================= */

function validateContactEmail() {

    const emailValue = cleanText(contactEmail?.value);

    clearFieldError(contactEmailField);

    if (!emailValue) {
        setFieldError(contactEmailField, "Contact email is required.");
        return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailValue)) {
        setFieldError(contactEmailField, "Enter a valid email address.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE ADDITIONAL NOTES
========================================================= */

function validateAdditionalNotes() {

    const notesValue = cleanText(additionalNotes?.value);

    clearFieldError(additionalNotesField);

    if (notesValue.length > CREATE_REQUEST_CONFIG.MAXIMUM_NOTES_LENGTH) {
        setFieldError(additionalNotesField, "Additional notes are too long.");
        return false;
    }

    return true;

}

/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    clearAllFormErrors();

    const validations = [
        validateServiceTitle(),
        validateServiceCategory(),
        validateDescription(),
        validateBudget(),
        validateDeadline(),
        validateContactEmail(),
        validateAdditionalNotes()
    ];

    return validations.every(Boolean);

}

/* =========================================================
   CREATE REQUEST PAYLOAD
   NOTE: service_requests has no "requirement_notes" column,
   so the additional notes field is validated in the UI but
   is not part of the submitted payload.
========================================================= */

function createRequestPayload() {

    if (!currentUser?.id) {
        throw new Error("A valid campus user profile is required.");
    }

    return {

        client_id: currentUser.id,

        title: cleanText(serviceTitle?.value),

        service_category: cleanText(serviceCategory?.value),

        description: cleanText(description?.value),

        budget: Number(budget?.value),

        deadline: cleanText(deadline?.value),

        contact_email: cleanText(contactEmail?.value),

        status: "under_review"

    };

}

/* =========================================================
   SUBMIT SERVICE REQUEST
========================================================= */

async function submitServiceRequest(requestPayload) {

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("service_requests")
        .insert(requestPayload)
        .select(CREATE_REQUEST_CONFIG.REQUEST_COLUMNS)
        .single();

    if (error) {
        throw error;
    }

    return data;

}

/* =========================================================
   SET SUBMITTING STATE
========================================================= */

function setSubmittingState(submitting) {

    isSubmitting = Boolean(submitting);

    if (submitRequestButton) {
        submitRequestButton.disabled = isSubmitting;
    }

    if (submitRequestButtonLoader) {
        submitRequestButtonLoader.classList.toggle("hidden", !isSubmitting);
    }

    if (submitRequestButtonText) {
        setText(
            submitRequestButtonText,
            isSubmitting ? "Submitting Request..." : "Submit Service Request"
        );
    }

}

/* =========================================================
   RESET REQUEST FORM
========================================================= */

function resetRequestForm() {

    createRequestForm?.reset();

    clearAllFormErrors();

    updateCharacterCounter(
        description,
        descriptionCharacterCount,
        CREATE_REQUEST_CONFIG.MAXIMUM_DESCRIPTION_LENGTH
    );

    updateCharacterCounter(
        additionalNotes,
        additionalNotesCharacterCount,
        CREATE_REQUEST_CONFIG.MAXIMUM_NOTES_LENGTH
    );

    configureDeadline();

}

/* =========================================================
   HANDLE FORM SUBMIT
========================================================= */

async function handleFormSubmit(event) {

    event.preventDefault();

    if (isSubmitting) {
        return;
    }

    hideFormMessage();

    const formIsValid = validateForm();

    if (!formIsValid) {
        showFormMessage("Please review the highlighted request information.", "error");
        return;
    }

    if (!currentUser?.id) {
        showFormMessage("Unable to identify the current campus user.", "error");
        return;
    }

    try {

        setSubmittingState(true);

        const requestPayload = createRequestPayload();

        await submitServiceRequest(requestPayload);

        resetRequestForm();

        showFormMessage(
            "Service request submitted successfully. Your request is now waiting for administrator review.",
            "success"
        );

        window.setTimeout(() => {
            navigateTo(ROUTES.MY_REQUESTS);
        }, 700);

    } catch (error) {

        console.error("Service request submission error:", error);

        showFormMessage(
            cleanText(error?.message) || "Unable to submit the service request. Please try again.",
            "error"
        );

    } finally {

        setSubmittingState(false);

    }

}

/* =========================================================
   HANDLE CANCEL
========================================================= */

function handleCancelRequest() {

    if (isSubmitting) {
        return;
    }

    navigateTo(ROUTES.CLIENT_DASHBOARD);

}

/* =========================================================
   INITIALIZE INPUT EVENTS
========================================================= */

function initializeInputEvents() {

    serviceTitle?.addEventListener("input", () => {
        clearFieldError(serviceTitleField);
    });

    serviceCategory?.addEventListener("change", () => {
        clearFieldError(serviceCategoryField);
    });

    description?.addEventListener("input", () => {

        clearFieldError(descriptionField);

        updateCharacterCounter(
            description,
            descriptionCharacterCount,
            CREATE_REQUEST_CONFIG.MAXIMUM_DESCRIPTION_LENGTH
        );

    });

    budget?.addEventListener("input", () => {
        clearFieldError(budgetField);
    });

    deadline?.addEventListener("change", () => {
        clearFieldError(deadlineField);
    });

    contactEmail?.addEventListener("input", () => {
        clearFieldError(contactEmailField);
    });

    additionalNotes?.addEventListener("input", () => {

        clearFieldError(additionalNotesField);

        updateCharacterCounter(
            additionalNotes,
            additionalNotesCharacterCount,
            CREATE_REQUEST_CONFIG.MAXIMUM_NOTES_LENGTH
        );

    });

}

/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    createRequestForm?.addEventListener("submit", handleFormSubmit);

    cancelRequestButton?.addEventListener("click", handleCancelRequest);

    initializeInputEvents();

}

/* =========================================================
   INITIALIZE CREATE REQUEST PAGE
========================================================= */

async function initializeCreateRequestPage(authenticatedUser) {

    try {

        configureDeadline();

        updateCharacterCounter(
            description,
            descriptionCharacterCount,
            CREATE_REQUEST_CONFIG.MAXIMUM_DESCRIPTION_LENGTH
        );

        updateCharacterCounter(
            additionalNotes,
            additionalNotesCharacterCount,
            CREATE_REQUEST_CONFIG.MAXIMUM_NOTES_LENGTH
        );

        initializeEventListeners();

        currentUser = await getCurrentUserProfile(authenticatedUser);

        if (!currentUser) {
            navigateTo(ROUTES.PROFILE_SETUP);
            return;
        }

        populateNavbar(currentUser);

    } catch (error) {

        console.error("Create request initialization error:", error);

        currentUser = null;

        showFormMessage(
            cleanText(error?.message) || "Unable to load the current campus profile.",
            "error"
        );

    }

}

/* =========================================================
   AUTHENTICATED PAGE INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeAuthenticatedPage(initializeCreateRequestPage);
});
