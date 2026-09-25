import { requireSupabaseClient } from "../config/supabase.js";

import {
    cleanText,
    toUpperCase,
    getInitials,
    onlyNumbers,
    isValidMobileNumber,
    formatCampusRole,
    createNavbarRole,
    setText,
    showElement,
    hideElement,
    setFieldError,
    clearFieldError,
    clearFormValidation,
    showFormMessage,
    hideFormMessage,
    setButtonLoading
} from "../utils/helpers.js";

import {
    ROUTES,
    navigateTo,
    replacePage
} from "../utils/navigation.js";

import { initializeAuthenticatedPage } from "../auth/auth-guard.js";

import {
    initializeDefaultLogoutButton,
    initializeLogoutButton
} from "../auth/logout.js";

const navbarUserName = document.getElementById("navbarUserName");
const navbarUserRole = document.getElementById("navbarUserRole");
const navbarUserAvatar = document.getElementById("navbarUserAvatar");

const profileAvatar = document.getElementById("profileAvatar");
const profileFullName = document.getElementById("profileFullName");
const profileIdentity = document.getElementById("profileIdentity");
const backToDashboardButton = document.getElementById("backToDashboardButton");
const logoutButton = document.getElementById("logoutButton");

const campusProfileForm = document.getElementById("campusProfileForm");
const campusProfileMessage = document.getElementById("campusProfileMessage");
const updateProfileButton = document.getElementById("updateProfileButton");

const updateProfileButtonLabel = updateProfileButton?.querySelector("span:not(.button-loader)");

const fullNameInput = document.getElementById("fullName");
const fullNameField = document.getElementById("fullNameField");
const emailInput = document.getElementById("email");
const mobileNumberInput = document.getElementById("mobileNumber");
const mobileField = document.getElementById("mobileField");
const campusRoleInput = document.getElementById("campusRole");

const departmentInput = document.getElementById("department");
const departmentField = document.getElementById("departmentField");

const studentInformationSection = document.getElementById("studentInformationSection");
const programmeInput = document.getElementById("programme");
const programmeField = document.getElementById("programmeField");
const academicYearInput = document.getElementById("academicYear");
const academicYearField = document.getElementById("academicYearField");
const sectionInput = document.getElementById("section");
const sectionField = document.getElementById("sectionField");
const registerNumberInput = document.getElementById("registerNumber");
const registerNumberField = document.getElementById("registerNumberField");

const adminInformationSection = document.getElementById("adminInformationSection");

const CAMPUS_PROFILE_CONFIG = Object.freeze({
    REGISTER_NUMBER_PATTERN: /^[A-Z0-9]{7}$/,
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
    `,
    EDIT_PROFILE_LABEL: "Edit Profile",
    SAVE_CHANGES_LABEL: "Save Changes"
});

let currentProfile = null;
let originalFullName = "";
let originalMobileNumber = "";
let originalDepartment = "";
let originalProgramme = "";
let originalAcademicYear = "";
let originalSection = "";
let originalRegisterNumber = "";
let updateInProgress = false;
let eventListenersInitialized = false;
let isEditMode = false;
let registerNumberDuplicateCheckToken = 0;

async function getCurrentProfile(authenticatedUser) {
    if (!authenticatedUser?.id) {
        return null;
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .select(CAMPUS_PROFILE_CONFIG.PROFILE_COLUMNS)
        .eq("id", authenticatedUser.id)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;
}

async function isRegisterNumberTaken(registerNumber, excludeId) {
    const safeValue = cleanText(registerNumber);

    if (!safeValue) {
        return false;
    }

    const client = requireSupabaseClient();

    let query = client
        .from("profiles")
        .select("id")
        .eq("register_number", safeValue);

    if (excludeId) {
        query = query.neq("id", excludeId);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);
}

async function checkRegisterNumberDuplicate() {
    if (!isStudentRole() || !registerNumberInput) {
        return true;
    }

    const registerNumber = toUpperCase(registerNumberInput.value);

    if (!registerNumber || !CAMPUS_PROFILE_CONFIG.REGISTER_NUMBER_PATTERN.test(registerNumber)) {
        return true;
    }

    const requestToken = ++registerNumberDuplicateCheckToken;

    try {
        const taken = await isRegisterNumberTaken(registerNumber, currentProfile?.id);

        if (requestToken !== registerNumberDuplicateCheckToken) {
            return true;
        }

        if (taken) {
            setFieldError(
                registerNumberField,
                "This register number is already registered to another account."
            );
            return false;
        }

        clearFieldError(registerNumberField);
        return true;
    } catch (error) {
        console.error("Register number duplicate check error:", error);
        return true;
    }
}

function clearProfilePhoto() {
    const profilePhotoElements = [navbarUserAvatar, profileAvatar];

    profilePhotoElements.forEach((element) => {
        if (!element) {
            return;
        }

        element.style.backgroundImage = "";
        element.style.backgroundSize = "";
        element.style.backgroundPosition = "";
        element.style.backgroundRepeat = "";
    });
}

function applyProfilePhoto(profilePhotoUrl) {
    clearProfilePhoto();

    const photoUrl = cleanText(profilePhotoUrl);

    if (!photoUrl) {
        return;
    }

    try {
        const parsedUrl = new URL(photoUrl);

        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
            return;
        }

        const profileImage = `url("${parsedUrl.href}")`;

        if (navbarUserAvatar) {
            navbarUserAvatar.style.backgroundImage = profileImage;
            navbarUserAvatar.style.backgroundSize = "cover";
            navbarUserAvatar.style.backgroundPosition = "center";
            navbarUserAvatar.style.backgroundRepeat = "no-repeat";
            navbarUserAvatar.textContent = "";
        }

        if (profileAvatar) {
            profileAvatar.style.backgroundImage = profileImage;
            profileAvatar.style.backgroundSize = "cover";
            profileAvatar.style.backgroundPosition = "center";
            profileAvatar.style.backgroundRepeat = "no-repeat";
            profileAvatar.textContent = "";
        }
    } catch (error) {
        console.warn("Invalid profile photo URL:", error);
    }
}

function normalizeCampusRole(campusRole) {
    return cleanText(campusRole).toLowerCase();
}

function isStudentRole() {
    return normalizeCampusRole(currentProfile?.campus_role) === "student";
}

function createProfileIdentity(profile) {
    const normalizedCampusRole = normalizeCampusRole(profile?.campus_role);
    const campusRole = formatCampusRole(profile?.campus_role);

    if (normalizedCampusRole === "student") {
        const identityParts = [
            cleanText(profile?.programme),
            cleanText(profile?.department),
            profile?.academic_year ? `Year ${cleanText(profile.academic_year)}` : "",
            profile?.section ? `Section ${cleanText(profile.section)}` : ""
        ].filter(Boolean);

        return identityParts.join(" · ") || campusRole || "Student";
    }

    return campusRole || "KPRIET User";
}

function populateStudentInformation(profile) {
    if (programmeInput) {
        programmeInput.value = cleanText(profile?.programme);
    }

    if (academicYearInput) {
        academicYearInput.value = cleanText(profile?.academic_year);
    }

    if (sectionInput) {
        sectionInput.value = cleanText(profile?.section);
    }

    if (registerNumberInput) {
        registerNumberInput.value = toUpperCase(cleanText(profile?.register_number));
    }
}

function updateStudentInformationVisibility(profile) {
    const isStudent = normalizeCampusRole(profile?.campus_role) === "student";

    if (isStudent) {
        showElement(studentInformationSection);
        return;
    }

    hideElement(studentInformationSection);

    clearFieldError(programmeField);
    clearFieldError(academicYearField);
    clearFieldError(sectionField);
    clearFieldError(registerNumberField);
}

function updateAdminInformationVisibility(profile) {
    const isAdmin = profile?.is_admin === true;

    if (isAdmin) {
        showElement(adminInformationSection);
        return;
    }

    hideElement(adminInformationSection);
}

function setEditableFieldsState(editable) {
    const isStudent = isStudentRole();

    if (fullNameInput) {
        fullNameInput.readOnly = !editable;
    }

    if (mobileNumberInput) {
        mobileNumberInput.readOnly = !editable;
    }

    if (departmentInput) {
        departmentInput.disabled = !editable;
    }

    if (programmeInput) {
        programmeInput.disabled = !(editable && isStudent);
    }

    if (academicYearInput) {
        academicYearInput.disabled = !(editable && isStudent);
    }

    if (sectionInput) {
        sectionInput.disabled = !(editable && isStudent);
    }

    if (registerNumberInput) {
        registerNumberInput.readOnly = !(editable && isStudent);
    }
}

function setUpdateProfileButtonLabel(label) {
    if (updateProfileButtonLabel) {
        updateProfileButtonLabel.textContent = label;
        return;
    }

    if (updateProfileButton) {
        updateProfileButton.textContent = label;
    }
}

function enterEditMode() {
    isEditMode = true;
    setEditableFieldsState(true);
    setUpdateProfileButtonLabel(CAMPUS_PROFILE_CONFIG.SAVE_CHANGES_LABEL);
    hideFormMessage(campusProfileMessage);
}

function exitEditMode() {
    isEditMode = false;
    setEditableFieldsState(false);
    setUpdateProfileButtonLabel(CAMPUS_PROFILE_CONFIG.EDIT_PROFILE_LABEL);
}

function handleUpdateProfileButtonClick(event) {
    if (!isEditMode) {
        event.preventDefault();
        enterEditMode();
    }
}

function populateProfile(profile) {
    if (!profile) {
        return;
    }

    const fullName = cleanText(profile.full_name) || "User";
    const email = cleanText(profile.email).toLowerCase();
    const mobileNumber = onlyNumbers(profile.mobile_number);
    const department = cleanText(profile.department);
    const campusRole = formatCampusRole(profile.campus_role);
    const initials = getInitials(fullName);
    const navbarRole = createNavbarRole(profile);
    const identity = createProfileIdentity(profile);

    setText(navbarUserName, fullName);
    setText(navbarUserRole, navbarRole || campusRole || "KPRIET USER");
    setText(navbarUserAvatar, initials);

    setText(profileAvatar, initials);
    setText(profileFullName, fullName);
    setText(profileIdentity, identity);

    if (fullNameInput) {
        fullNameInput.value = fullName;
    }

    if (emailInput) {
        emailInput.value = email;
    }

    if (mobileNumberInput) {
        mobileNumberInput.value = mobileNumber;
    }

    if (campusRoleInput) {
        campusRoleInput.value = campusRole;
    }

    if (departmentInput) {
        departmentInput.value = department;
    }

    originalFullName = fullName;
    originalMobileNumber = mobileNumber;
    originalDepartment = department;

    populateStudentInformation(profile);

    originalProgramme = cleanText(profile.programme);
    originalAcademicYear = cleanText(profile.academic_year);
    originalSection = cleanText(profile.section);
    originalRegisterNumber = toUpperCase(cleanText(profile.register_number));

    updateStudentInformationVisibility(profile);
    updateAdminInformationVisibility(profile);
    applyProfilePhoto(profile.profile_photo_url);
}

function handleFullNameInput() {
    if (!fullNameInput) {
        return;
    }

    if (fullNameField?.classList.contains("has-error")) {
        validateFullName();
    }

    hideFormMessage(campusProfileMessage);
}

function validateFullName() {
    const fullName = cleanText(fullNameInput?.value);

    if (!fullName) {
        setFieldError(fullNameField, "Full name is required.");
        return false;
    }

    if (fullName.length < 3) {
        setFieldError(fullNameField, "Full name must be at least 3 characters.");
        return false;
    }

    clearFieldError(fullNameField);
    return true;
}

function handleMobileNumberInput() {
    if (!mobileNumberInput) {
        return;
    }

    mobileNumberInput.value = onlyNumbers(mobileNumberInput.value).slice(0, 10);

    if (mobileField?.classList.contains("has-error")) {
        validateMobileNumber();
    }

    hideFormMessage(campusProfileMessage);
}

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

function validateDepartment() {
    const department = cleanText(departmentInput?.value);

    if (!department) {
        setFieldError(departmentField, "Select your department.");
        return false;
    }

    clearFieldError(departmentField);
    return true;
}

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

function validateAcademicYear() {
    if (!isStudentRole()) {
        return true;
    }

    const academicYear = cleanText(academicYearInput?.value);

    if (!academicYear) {
        setFieldError(academicYearField, "Select your current year.");
        return false;
    }

    clearFieldError(academicYearField);
    return true;
}

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

function validateRegisterNumber() {
    if (!isStudentRole()) {
        return true;
    }

    const registerNumber = toUpperCase(registerNumberInput?.value);

    if (!registerNumber) {
        setFieldError(registerNumberField, "Register number is required.");
        return false;
    }

    if (!CAMPUS_PROFILE_CONFIG.REGISTER_NUMBER_PATTERN.test(registerNumber)) {
        setFieldError(
            registerNumberField,
            "Register number must contain exactly 7 letters or numbers."
        );
        return false;
    }

    clearFieldError(registerNumberField);
    return true;
}

function handleRegisterNumberInput() {
    if (!registerNumberInput) {
        return;
    }

    registerNumberInput.value = toUpperCase(registerNumberInput.value);

    if (registerNumberField?.classList.contains("has-error")) {
        validateRegisterNumber();
    }

    hideFormMessage(campusProfileMessage);
}

function validateCampusProfileForm() {
    const fullNameValid = validateFullName();
    const mobileNumberValid = validateMobileNumber();
    const departmentValid = validateDepartment();
    const programmeValid = validateProgramme();
    const academicYearValid = validateAcademicYear();
    const sectionValid = validateSection();
    const registerNumberValid = validateRegisterNumber();

    return (
        fullNameValid &&
        mobileNumberValid &&
        departmentValid &&
        programmeValid &&
        academicYearValid &&
        sectionValid &&
        registerNumberValid
    );
}

function hasProfileChanged() {
    const currentFullName = cleanText(fullNameInput?.value);
    const currentMobileNumber = onlyNumbers(mobileNumberInput?.value);
    const currentDepartment = cleanText(departmentInput?.value);

    const commonChanged =
        currentFullName !== originalFullName ||
        currentMobileNumber !== originalMobileNumber ||
        currentDepartment !== originalDepartment;

    if (commonChanged) {
        return true;
    }

    if (!isStudentRole()) {
        return false;
    }

    const currentProgramme = cleanText(programmeInput?.value);
    const currentAcademicYear = cleanText(academicYearInput?.value);
    const currentSection = cleanText(sectionInput?.value);
    const currentRegisterNumber = toUpperCase(registerNumberInput?.value);

    return (
        currentProgramme !== originalProgramme ||
        currentAcademicYear !== originalAcademicYear ||
        currentSection !== originalSection ||
        currentRegisterNumber !== originalRegisterNumber
    );
}

async function updateProfileInfo(userId, profileUpdates) {
    const safeUserId = cleanText(userId);
    const safeFullName = cleanText(profileUpdates.fullName);
    const safeMobileNumber = onlyNumbers(profileUpdates.mobileNumber);
    const safeDepartment = cleanText(profileUpdates.department);

    if (!safeUserId) {
        throw new Error("User profile identifier is unavailable.");
    }

    if (!safeFullName || safeFullName.length < 3) {
        throw new Error("A valid full name (minimum 3 characters) is required.");
    }

    if (!isValidMobileNumber(safeMobileNumber)) {
        throw new Error("A valid mobile number is required.");
    }

    if (!safeDepartment) {
        throw new Error("A department is required.");
    }

    const updatePayload = {
        full_name: safeFullName,
        mobile_number: safeMobileNumber,
        department: safeDepartment,
        updated_at: new Date().toISOString()
    };

    if (profileUpdates.isStudent) {
        updatePayload.programme = cleanText(profileUpdates.programme);
        updatePayload.academic_year = cleanText(profileUpdates.academicYear);
        updatePayload.section = cleanText(profileUpdates.section);
        updatePayload.register_number = toUpperCase(cleanText(profileUpdates.registerNumber));
    }

    const client = requireSupabaseClient();

    const { data, error } = await client
        .from("profiles")
        .update(updatePayload)
        .eq("id", safeUserId)
        .select(CAMPUS_PROFILE_CONFIG.PROFILE_COLUMNS)
        .maybeSingle();

    if (error) {
        throw error;
    }

    if (!data) {
        throw new Error("The campus profile could not be updated.");
    }

    return {
        success: true,
        profile: data
    };
}

function mapUniqueViolationToField(error) {
    const detail = String(error?.details ?? error?.message ?? "").toLowerCase();

    if (detail.includes("mobile_number")) {
        return {
            field: mobileField,
            message: "This mobile number is already registered to another account."
        };
    }

    if (detail.includes("register_number")) {
        return {
            field: registerNumberField,
            message: "This register number is already registered to another account."
        };
    }

    return null;
}

async function handleProfileSubmit(event) {
    event.preventDefault();

    if (updateInProgress) {
        return;
    }

    hideFormMessage(campusProfileMessage);
    clearFormValidation(campusProfileForm);

    const formIsValid = validateCampusProfileForm();

    if (!formIsValid) {
        showFormMessage(
            campusProfileMessage,
            "Check the highlighted fields and complete the required information.",
            "error"
        );
        return;
    }

    if (!hasProfileChanged()) {
        showFormMessage(
            campusProfileMessage,
            "No profile changes were detected.",
            "warning"
        );
        return;
    }

    if (!currentProfile?.id) {
        showFormMessage(
            campusProfileMessage,
            "Your campus profile is unavailable.",
            "error"
        );
        return;
    }

    const isStudent = isStudentRole();
    updateInProgress = true;
    setButtonLoading(updateProfileButton, true);

    try {
        const noDuplicateRegisterNumber = await checkRegisterNumberDuplicate();

        if (!noDuplicateRegisterNumber) {
            showFormMessage(
                campusProfileMessage,
                "Your register number is already registered to another account. Please review the highlighted field.",
                "error"
            );
            return;
        }

        const result = await updateProfileInfo(currentProfile.id, {
            fullName: fullNameInput?.value,
            mobileNumber: mobileNumberInput?.value,
            department: departmentInput?.value,
            isStudent,
            programme: programmeInput?.value,
            academicYear: academicYearInput?.value,
            section: sectionInput?.value,
            registerNumber: registerNumberInput?.value
        });

        if (!result?.success || !result?.profile) {
            throw new Error("Unable to update profile.");
        }

        currentProfile = {
            ...currentProfile,
            ...result.profile
        };

        populateProfile(currentProfile);

        showFormMessage(
            campusProfileMessage,
            "Profile updated successfully.",
            "success"
        );

        exitEditMode();
    } catch (error) {
        console.error("Campus profile update error:", error);

        const errorCode = cleanText(error?.code).toLowerCase();

        if (errorCode === "23505") {
            const violation = mapUniqueViolationToField(error);

            if (violation) {
                setFieldError(violation.field, violation.message);

                showFormMessage(
                    campusProfileMessage,
                    "Some of the details you entered are already registered to another account. Please review the highlighted fields.",
                    "error"
                );
                return;
            }
        }

        showFormMessage(
            campusProfileMessage,
            getProfileUpdateErrorMessage(error),
            "error"
        );
    } finally {
        updateInProgress = false;
        setButtonLoading(updateProfileButton, false);
    }
}

function getProfileUpdateErrorMessage(error) {
    const message = String(error?.message ?? "").toLowerCase();
    const errorCode = cleanText(error?.code).toLowerCase();

    if (message.includes("network") || message.includes("fetch")) {
        return "Unable to connect to the server. Check your internet connection.";
    }

    if (
        message.includes("permission") ||
        message.includes("policy") ||
        errorCode === "42501"
    ) {
        return "Your account does not have permission to update this profile.";
    }

    if (message.includes("duplicate") || errorCode === "23505") {
        return "Some of the details you entered are already associated with another profile.";
    }

    if (message.includes("valid mobile number")) {
        return "Enter a valid 10-digit mobile number.";
    }

    return "Unable to update profile. Please try again.";
}

function returnToDashboard() {
    if (typeof ROUTES !== "undefined" && ROUTES.ADMIN_DASHBOARD) {
        navigateTo(ROUTES.ADMIN_DASHBOARD);
    } else {
        window.location.href = "http://127.0.0.1:5500/pages/admin/dashboard.html";
    }
}

function initializeEventListeners() {
    if (eventListenersInitialized) {
        return;
    }

    initializeDefaultLogoutButton();

    campusProfileForm?.addEventListener("submit", handleProfileSubmit);

    updateProfileButton?.addEventListener("click", handleUpdateProfileButtonClick);

    fullNameInput?.addEventListener("input", handleFullNameInput);
    fullNameInput?.addEventListener("blur", validateFullName);

    mobileNumberInput?.addEventListener("input", handleMobileNumberInput);
    mobileNumberInput?.addEventListener("blur", validateMobileNumber);

    departmentInput?.addEventListener("change", validateDepartment);
    programmeInput?.addEventListener("change", validateProgramme);
    academicYearInput?.addEventListener("change", validateAcademicYear);
    sectionInput?.addEventListener("change", validateSection);

    registerNumberInput?.addEventListener("input", handleRegisterNumberInput);
    registerNumberInput?.addEventListener("blur", async () => {
        if (validateRegisterNumber()) {
            await checkRegisterNumberDuplicate();
        }
    });

    backToDashboardButton?.addEventListener("click", returnToDashboard);

    eventListenersInitialized = true;
}

function resetCampusProfileState() {
    currentProfile = null;
    originalFullName = "";
    originalMobileNumber = "";
    originalDepartment = "";
    originalProgramme = "";
    originalAcademicYear = "";
    originalSection = "";
    originalRegisterNumber = "";
    updateInProgress = false;
    isEditMode = false;
    registerNumberDuplicateCheckToken = 0;
}

async function initializeCampusProfilePage(authenticatedUser) {
    if (!campusProfileForm) {
        console.error("Campus profile form is unavailable.");
        return false;
    }

    initializeEventListeners();
    resetCampusProfileState();
    hideFormMessage(campusProfileMessage);

    try {
        currentProfile = await getCurrentProfile(authenticatedUser);

        if (!currentProfile) {
            replacePage(ROUTES.PROFILE_SETUP);
            return false;
        }

        populateProfile(currentProfile);
        exitEditMode();

        return true;
    } catch (error) {
        console.error("Campus profile initialization error:", error);

        showFormMessage(
            campusProfileMessage,
            "Unable to load your campus profile. Please refresh the page and try again.",
            "error"
        );

        return false;
    }
}

initializeAuthenticatedPage(initializeCampusProfilePage);

export {
    CAMPUS_PROFILE_CONFIG,
    getCurrentProfile,
    isRegisterNumberTaken,
    checkRegisterNumberDuplicate,
    clearProfilePhoto,
    applyProfilePhoto,
    normalizeCampusRole,
    isStudentRole,
    createProfileIdentity,
    populateStudentInformation,
    updateStudentInformationVisibility,
    updateAdminInformationVisibility,
    populateProfile,
    setEditableFieldsState,
    setUpdateProfileButtonLabel,
    enterEditMode,
    exitEditMode,
    handleUpdateProfileButtonClick,
    handleFullNameInput,
    validateFullName,
    handleMobileNumberInput,
    validateMobileNumber,
    validateDepartment,
    validateProgramme,
    validateAcademicYear,
    validateSection,
    validateRegisterNumber,
    handleRegisterNumberInput,
    validateCampusProfileForm,
    hasProfileChanged,
    updateProfileInfo,
    mapUniqueViolationToField,
    handleProfileSubmit,
    getProfileUpdateErrorMessage,
    initializeCampusProfilePage
};
