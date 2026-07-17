/* =========================================================
   KPRIET FREELANCER PLATFORM
   First-Time Campus Profile Setup
   File: js/auth/profile-setup.js
========================================================= */


import {
    requireSupabaseClient
} from "../config/supabase.js";

import {
    cleanText,
    toTitleCase,
    toUpperCase,
    getInitials,
    onlyNumbers,
    isValidMobileNumber,
    setText,
    setFieldError,
    clearFieldError,
    clearFormValidation,
    showFormMessage,
    hideFormMessage,
    setButtonLoading
} from "../utils/helpers.js";

import {
    ROUTES,
    replacePage
} from "../utils/navigation.js";

import {
    initializeAuthenticatedPage
} from "../auth/auth-guard.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const profileSetupForm =
    document.getElementById("profileSetupForm");

const profileSetupMessage =
    document.getElementById("profileSetupMessage");

const completeProfileButton =
    document.getElementById("completeProfileButton");

const fullNameInput =
    document.getElementById("fullName");

const emailInput =
    document.getElementById("email");

const mobileNumberInput =
    document.getElementById("mobileNumber");

const mobileField =
    document.getElementById("mobileField");

const profilePhotoPreview =
    document.getElementById("profilePhotoPreview");

const navbarUserName =
    document.getElementById("navbarUserName");

const navbarUserAvatar =
    document.getElementById("navbarUserAvatar");

const campusRoleField =
    document.getElementById("campusRoleField");

const campusRoleInputs =
    Array.from(
        document.querySelectorAll('input[name="campusRole"]')
    );

const studentInformationSection =
    document.getElementById("studentInformationSection");

const departmentInput =
    document.getElementById("department");

const programmeInput =
    document.getElementById("programme");

const yearInput =
    document.getElementById("year");

const sectionInput =
    document.getElementById("section");

const registerNumberInput =
    document.getElementById("registerNumber");

const departmentField =
    document.getElementById("departmentField");

const programmeField =
    document.getElementById("programmeField");

const yearField =
    document.getElementById("yearField");

const sectionField =
    document.getElementById("sectionField");

const registerNumberField =
    document.getElementById("registerNumberField");


/* =========================================================
   CONFIGURATION
========================================================= */

const PROFILE_SETUP_CONFIG = Object.freeze({

    PROFILE_COLUMNS: `
        id,
        full_name,
        email,
        mobile_number,
        campus_role,
        department,
        programme,
        academic_year,
        section,
        register_number,
        profile_photo_url,
        is_admin,
        created_at,
        updated_at
    `

});


/* =========================================================
   PAGE STATE
========================================================= */

let currentAuthenticatedUser = null;
let profileSetupInProgress = false;
let eventListenersInitialized = false;
let liveValidationInitialized = false;
let existingProfileFullName = null;


/* =========================================================
   CREATE AUTHENTICATED USER INFORMATION
========================================================= */

function createAuthenticatedUserInformation(authenticatedUser) {

    if (!authenticatedUser?.id) {
        return null;
    }

    const userMetadata = authenticatedUser.user_metadata ?? {};

    return {
        id: cleanText(authenticatedUser.id),
        fullName: toTitleCase(
            userMetadata.full_name ??
            userMetadata.name ??
            ""
        ),
        email: cleanText(authenticatedUser.email).toLowerCase(),
        profilePhotoUrl: cleanText(
            userMetadata.avatar_url ??
            userMetadata.picture ??
            ""
        ),
        rawUserMetadata: userMetadata
    };

}


/* =========================================================
   GET EXISTING PROFILE
========================================================= */

async function getExistingProfile(userId) {

    const safeUserId = cleanText(userId);

    if (!safeUserId) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(PROFILE_SETUP_CONFIG.PROFILE_COLUMNS)
        .eq("id", safeUserId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;

}


/* =========================================================
   CHECK PROFILE COMPLETION
   A profile is complete when campus_role and mobile_number
   are both filled. These are the minimum fields the form
   collects. The trigger creates the row but leaves them NULL.
========================================================= */

function isProfileAlreadyComplete(profile) {

    if (!profile) {
        return false;
    }

    // Admins always bypass profile setup
    if (profile.is_admin === true) {
        return true;
    }

    return Boolean(
        cleanText(profile.campus_role) &&
        cleanText(profile.mobile_number)
    );

}


/* =========================================================
   CLEAR PROFILE PHOTO
========================================================= */

function clearProfilePhoto() {

    [navbarUserAvatar, profilePhotoPreview].forEach((element) => {

        if (!element) {
            return;
        }

        element.style.backgroundImage = "";
        element.style.backgroundSize = "";
        element.style.backgroundPosition = "";
        element.style.backgroundRepeat = "";

    });

    profilePhotoPreview?.classList.remove("has-image");

}


/* =========================================================
   APPLY PROFILE PHOTO
========================================================= */

function applyProfilePhoto(profilePhotoUrl) {

    clearProfilePhoto();

    const photoUrl = cleanText(profilePhotoUrl);

    if (!photoUrl) {
        return;
    }

    try {

        const parsedUrl = new URL(photoUrl);

        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {
            return;
        }

        const profileImage = `url("${parsedUrl.href}")`;

        if (profilePhotoPreview) {
            profilePhotoPreview.style.backgroundImage = profileImage;
            profilePhotoPreview.style.backgroundSize = "cover";
            profilePhotoPreview.style.backgroundPosition = "center";
            profilePhotoPreview.style.backgroundRepeat = "no-repeat";
            profilePhotoPreview.classList.add("has-image");
            profilePhotoPreview.textContent = "";
        }

        if (navbarUserAvatar) {
            navbarUserAvatar.style.backgroundImage = profileImage;
            navbarUserAvatar.style.backgroundSize = "cover";
            navbarUserAvatar.style.backgroundPosition = "center";
            navbarUserAvatar.style.backgroundRepeat = "no-repeat";
            navbarUserAvatar.textContent = "";
        }

    } catch (error) {
        console.warn("Invalid profile photo URL:", error);
    }

}


/* =========================================================
   POPULATE ACCOUNT INFORMATION
========================================================= */

function populateAccountInformation(user) {

    if (!user) {
        return;
    }

    let fullName = "";
    if (existingProfileFullName) {
        fullName = toTitleCase(existingProfileFullName);
    } else {
        const userMetadata = user.rawUserMetadata ?? {};
        fullName = toTitleCase(
            userMetadata.full_name ??
            ""
        );
        if (!fullName) {
            fullName = toTitleCase(user.fullName);
        }
    }

    const email = cleanText(user.email).toLowerCase();
    const initials = getInitials(fullName);

    if (fullNameInput) {
        fullNameInput.removeAttribute("readonly");
        fullNameInput.value = fullName;
    }

    if (emailInput) {
        emailInput.value = email;
        emailInput.setAttribute("readonly", "true");
    }

    setText(navbarUserName, fullName || "New User");
    setText(navbarUserAvatar, initials);
    setText(profilePhotoPreview, initials);

    applyProfilePhoto(user.profilePhotoUrl);

}


/* =========================================================
   GET SELECTED CAMPUS ROLE
========================================================= */

function getSelectedCampusRole() {

    const selectedRole = campusRoleInputs.find((input) => input.checked);

    return cleanText(selectedRole?.value).toLowerCase();

}


/* =========================================================
   STUDENT ROLE CHECK
========================================================= */

function isStudentRole() {
    return getSelectedCampusRole() === "student";
}


/* =========================================================
   CLEAR STUDENT INFORMATION
========================================================= */

function clearStudentInformation() {

    if (departmentInput) departmentInput.value = "";
    if (programmeInput) programmeInput.value = "";
    if (yearInput) yearInput.value = "";
    if (sectionInput) sectionInput.value = "";
    if (registerNumberInput) registerNumberInput.value = "";

    clearFieldError(departmentField);
    clearFieldError(programmeField);
    clearFieldError(yearField);
    clearFieldError(sectionField);
    clearFieldError(registerNumberField);

}


/* =========================================================
   STUDENT INFORMATION VISIBILITY
========================================================= */

function updateStudentInformationVisibility() {

    if (!studentInformationSection) {
        return;
    }

    if (isStudentRole()) {
        studentInformationSection.classList.remove("hidden");
        return;
    }

    studentInformationSection.classList.add("hidden");
    clearStudentInformation();

}


/* =========================================================
   MOBILE NUMBER INPUT CONTROL
========================================================= */

function handleMobileNumberInput() {

    if (!mobileNumberInput) {
        return;
    }

    mobileNumberInput.value = onlyNumbers(mobileNumberInput.value).slice(0, 10);

    if (mobileField?.classList.contains("has-error")) {
        validateMobileNumber();
    }

    hideFormMessage(profileSetupMessage);

}


/* =========================================================
   REGISTER NUMBER INPUT CONTROL
========================================================= */

function handleRegisterNumberInput() {

    if (!registerNumberInput) {
        return;
    }

    registerNumberInput.value = toUpperCase(registerNumberInput.value);

    if (registerNumberField?.classList.contains("has-error")) {
        validateRegisterNumber();
    }

    hideFormMessage(profileSetupMessage);

}


/* =========================================================
   MOBILE NUMBER VALIDATION
========================================================= */

function validateMobileNumber() {

    const mobileNumber = onlyNumbers(mobileNumberInput?.value);

    if (!mobileNumber) {
        setFieldError(mobileField, "Mobile number is required.");
        return false;
    }

    if (!isValidMobileNumber(mobileNumber)) {
        setFieldError(mobileField, "Enter a valid 10-digit mobile number.");
        return false;
    }

    clearFieldError(mobileField);
    return true;

}


/* =========================================================
   CAMPUS ROLE VALIDATION
========================================================= */

function validateCampusRole() {

    const campusRole = getSelectedCampusRole();

    const allowedCampusRoles = new Set(["student", "faculty", "staff"]);

    if (!campusRole) {
        setFieldError(campusRoleField, "Select your campus role.");
        return false;
    }

    if (!allowedCampusRoles.has(campusRole)) {
        setFieldError(campusRoleField, "Select a valid campus role.");
        return false;
    }

    clearFieldError(campusRoleField);
    return true;

}


/* =========================================================
   DEPARTMENT VALIDATION
========================================================= */

function validateDepartment() {

    if (!isStudentRole()) {
        return true;
    }

    const department = cleanText(departmentInput?.value);

    if (!department) {
        setFieldError(departmentField, "Select your department.");
        return false;
    }

    clearFieldError(departmentField);
    return true;

}


/* =========================================================
   PROGRAMME VALIDATION
========================================================= */

function validateProgramme() {

    if (!isStudentRole()) {
        return true;
    }

    const programme = cleanText(programmeInput?.value);

    if (!programme) {
        setFieldError(programmeField, "Select your programme.");
        return false;
    }

    clearFieldError(programmeField);
    return true;

}


/* =========================================================
   YEAR VALIDATION
========================================================= */

function validateYear() {

    if (!isStudentRole()) {
        return true;
    }

    const academicYear = cleanText(yearInput?.value);

    if (!academicYear) {
        setFieldError(yearField, "Select your current year.");
        return false;
    }

    clearFieldError(yearField);
    return true;

}


/* =========================================================
   SECTION VALIDATION
========================================================= */

function validateSection() {

    if (!isStudentRole()) {
        return true;
    }

    const section = cleanText(sectionInput?.value);

    if (!section) {
        setFieldError(sectionField, "Select your section.");
        return false;
    }

    clearFieldError(sectionField);
    return true;

}


/* =========================================================
   REGISTER NUMBER VALIDATION
========================================================= */

function validateRegisterNumber() {

    if (!isStudentRole()) {
        return true;
    }

    const registerNumber = toUpperCase(registerNumberInput?.value);

    if (!registerNumber) {
        setFieldError(registerNumberField, "Register number is required.");
        return false;
    }

    if (registerNumber.length < 4) {
        setFieldError(registerNumberField, "Enter a valid register number.");
        return false;
    }

    clearFieldError(registerNumberField);
    return true;

}


/* =========================================================
   STUDENT INFORMATION VALIDATION
========================================================= */

function validateStudentInformation() {

    if (!isStudentRole()) {
        return true;
    }

    const departmentValid = validateDepartment();
    const programmeValid = validateProgramme();
    const yearValid = validateYear();
    const sectionValid = validateSection();
    const registerNumberValid = validateRegisterNumber();

    return (
        departmentValid &&
        programmeValid &&
        yearValid &&
        sectionValid &&
        registerNumberValid
    );

}


/* =========================================================
   FORM VALIDATION
========================================================= */

function validateProfileSetupForm() {

    const mobileNumberValid = validateMobileNumber();
    const campusRoleValid = validateCampusRole();
    const studentInformationValid = validateStudentInformation();

    return mobileNumberValid && campusRoleValid && studentInformationValid;

}


/* =========================================================
   CREATE PROFILE DATA
========================================================= */

function createProfileData(authenticatedUser) {

    if (!authenticatedUser?.id) {
        throw new Error("Authenticated user information is unavailable.");
    }

    const campusRole = getSelectedCampusRole();
    const currentFullNameVal = cleanText(fullNameInput?.value);

    const profileData = {
        id: authenticatedUser.id,
        email: cleanText(emailInput?.value || authenticatedUser.email).toLowerCase(),
        profile_photo_url: cleanText(authenticatedUser.profilePhotoUrl) || null,
        mobile_number: onlyNumbers(mobileNumberInput?.value),
        campus_role: campusRole,
        department: null,
        programme: null,
        academic_year: null,
        section: null,
        register_number: null,
        updated_at: new Date().toISOString()
    };

    if (!existingProfileFullName || currentFullNameVal !== existingProfileFullName) {
        profileData.full_name = toTitleCase(currentFullNameVal || authenticatedUser.fullName);
    }

    if (campusRole === "student") {
        profileData.department = cleanText(departmentInput?.value);
        profileData.programme = cleanText(programmeInput?.value);
        profileData.academic_year = cleanText(yearInput?.value);
        profileData.section = cleanText(sectionInput?.value);
        profileData.register_number = toUpperCase(registerNumberInput?.value);
    }

    return profileData;

}


/* =========================================================
   SAVE PROFILE
   Uses upsert because the trigger already created the row.
   onConflict: "id" updates the existing row.
========================================================= */

async function saveProfile(profileData) {

    if (!profileData?.id) {
        throw new Error("Profile information is unavailable.");
    }

    const client = requireSupabaseClient();

    // Separate id from update payload
    // id is used in the WHERE clause only, not updated
    const { id, ...updateData } = profileData;

    const { data, error } = await client
        .from("profiles")
        .update(updateData)
        .eq("id", id)
        .select(PROFILE_SETUP_CONFIG.PROFILE_COLUMNS)
        .single();

    if (error) {
        throw error;
    }

    return {
        success: true,
        profile: data
    };

}


/* =========================================================
   ERROR MESSAGES
========================================================= */

function getProfileSetupErrorMessage(error) {

    const message = String(error?.message ?? "").toLowerCase();
    const errorCode = cleanText(error?.code).toLowerCase();

    if (
        errorCode === "23505" ||
        message.includes("duplicate") ||
        message.includes("unique")
    ) {
        return "A profile with the same campus information already exists.";
    }

    if (message.includes("network") || message.includes("fetch")) {
        return "Unable to connect to the server. Check your internet connection.";
    }

    if (
        errorCode === "42501" ||
        message.includes("permission") ||
        message.includes("policy") ||
        message.includes("row-level security")
    ) {
        return "Your account does not have permission to complete this action.";
    }

    if (message.includes("authenticated user")) {
        return "Your authenticated account information is unavailable.";
    }

    return "Unable to complete your profile. Please try again.";

}


/* =========================================================
   PROFILE SUBMISSION
========================================================= */

async function handleProfileSetupSubmit(event) {

    event.preventDefault();

    if (profileSetupInProgress) {
        return;
    }

    hideFormMessage(profileSetupMessage);
    clearFormValidation(profileSetupForm);

    const formIsValid = validateProfileSetupForm();

    if (!formIsValid) {
        showFormMessage(
            profileSetupMessage,
            "Check the highlighted fields and complete the required information.",
            "error"
        );
        return;
    }

    if (!currentAuthenticatedUser?.id) {
        showFormMessage(
            profileSetupMessage,
            "Your authenticated account information is unavailable.",
            "error"
        );
        return;
    }

    profileSetupInProgress = true;
    setButtonLoading(completeProfileButton, true);

    try {

        /*
           Do NOT check for existing profile here.
           The trigger always creates a row, so existence
           check would always redirect without saving.
           Just upsert the completed form data directly.
        */

        const profileData = createProfileData(currentAuthenticatedUser);

        const result = await saveProfile(profileData);

        if (!result?.success || !result?.profile) {
            throw new Error("Unable to save profile.");
        }

        replacePage(ROUTES.MAIN_DASHBOARD);

    } catch (error) {

        console.error("Profile setup error:", error);

        showFormMessage(
            profileSetupMessage,
            getProfileSetupErrorMessage(error),
            "error"
        );

    } finally {

        profileSetupInProgress = false;
        setButtonLoading(completeProfileButton, false);

    }

}


/* =========================================================
   ROLE CHANGE HANDLER
========================================================= */

function handleCampusRoleChange() {
    clearFieldError(campusRoleField);
    updateStudentInformationVisibility();
    hideFormMessage(profileSetupMessage);
}


/* =========================================================
   INITIALIZE LIVE VALIDATION
========================================================= */

function initializeLiveValidation() {

    if (liveValidationInitialized) {
        return;
    }

    mobileNumberInput?.addEventListener("input", handleMobileNumberInput);
    mobileNumberInput?.addEventListener("blur", validateMobileNumber);
    departmentInput?.addEventListener("change", validateDepartment);
    programmeInput?.addEventListener("change", validateProgramme);
    yearInput?.addEventListener("change", validateYear);
    sectionInput?.addEventListener("change", validateSection);
    registerNumberInput?.addEventListener("input", handleRegisterNumberInput);
    registerNumberInput?.addEventListener("blur", validateRegisterNumber);

    liveValidationInitialized = true;

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    if (eventListenersInitialized) {
        return;
    }

    profileSetupForm?.addEventListener("submit", handleProfileSetupSubmit);

    campusRoleInputs.forEach((input) => {
        input.addEventListener("change", handleCampusRoleChange);
    });

    eventListenersInitialized = true;

}


/* =========================================================
   RESET STATE
========================================================= */

function resetProfileSetupState() {
    currentAuthenticatedUser = null;
    profileSetupInProgress = false;
    existingProfileFullName = null;
}


/* =========================================================
   PAGE INITIALIZATION
========================================================= */

async function initializeProfileSetupPage(authenticatedUser) {

    if (!profileSetupForm) {
        console.error("Profile setup form is unavailable.");
        return false;
    }

    initializeEventListeners();
    initializeLiveValidation();
    resetProfileSetupState();
    hideFormMessage(profileSetupMessage);

    try {

        currentAuthenticatedUser =
            createAuthenticatedUserInformation(authenticatedUser);

        if (!currentAuthenticatedUser) {
            replacePage(ROUTES.LOGIN);
            return false;
        }

        const existingProfile =
            await getExistingProfile(currentAuthenticatedUser.id);

        /*
           Only redirect to dashboard if the profile is
           genuinely complete (campus_role + mobile_number
           are filled). The trigger creates an incomplete row,
           so existence alone is not enough to redirect.
        */

        if (isProfileAlreadyComplete(existingProfile)) {
            replacePage(ROUTES.MAIN_DASHBOARD);
            return false;
        }

        if (existingProfile) {
            existingProfileFullName = cleanText(existingProfile.full_name);
        }

        populateAccountInformation(currentAuthenticatedUser);
        updateStudentInformationVisibility();

        return true;

    } catch (error) {

        console.error("Profile setup initialization error:", error);

        showFormMessage(
            profileSetupMessage,
            "Unable to load your account information. Please refresh the page and try again.",
            "error"
        );

        return false;

    }

}


/* =========================================================
   START PAGE
========================================================= */

initializeAuthenticatedPage(initializeProfileSetupPage);


/* =========================================================
   EXPORTS
========================================================= */

export {
    PROFILE_SETUP_CONFIG,
    createAuthenticatedUserInformation,
    getExistingProfile,
    isProfileAlreadyComplete,
    clearProfilePhoto,
    applyProfilePhoto,
    populateAccountInformation,
    getSelectedCampusRole,
    isStudentRole,
    clearStudentInformation,
    updateStudentInformationVisibility,
    handleMobileNumberInput,
    handleRegisterNumberInput,
    validateMobileNumber,
    validateCampusRole,
    validateDepartment,
    validateProgramme,
    validateYear,
    validateSection,
    validateRegisterNumber,
    validateStudentInformation,
    validateProfileSetupForm,
    createProfileData,
    saveProfile,
    getProfileSetupErrorMessage,
    handleProfileSetupSubmit,
    initializeProfileSetupPage
};