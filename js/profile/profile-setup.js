/* =========================================================
   KPRIET FREELANCER PLATFORM
   First-Time / Incomplete Campus Profile Setup
   File: js/auth/profile-setup.js

   FLOW:
   1. Authenticate user through Google OAuth.
   2. Check whether a profiles row exists.
   3. If no profile exists:
        -> Show empty profile setup form.
        -> INSERT on submission.
   4. If profile exists and is complete:
        -> Redirect to the correct dashboard.
   5. If profile exists but is incomplete:
        -> Load existing profile data.
        -> Allow the user to complete/update it.
        -> UPDATE on submission.
   6. Never show a misleading "duplicate profile" message
      simply because an incomplete profile already exists.
   7. Mobile number, email address, and register number
      must each be unique across profiles. Duplicate values
      are surfaced as a field-level warning under the
      relevant field, both live (on blur) and again at
      submission time.
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

const emailField =
    document.getElementById("emailField");

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


/* Department */

const departmentInput =
    document.getElementById("department");

const departmentField =
    document.getElementById("departmentField");


/* Student */

const studentInformationSection =
    document.getElementById("studentInformationSection");

const programmeInput =
    document.getElementById("programme");

const yearInput =
    document.getElementById("year");

const sectionInput =
    document.getElementById("section");

const registerNumberInput =
    document.getElementById("registerNumber");

const programmeField =
    document.getElementById("programmeField");

const yearField =
    document.getElementById("yearField");

const sectionField =
    document.getElementById("sectionField");

const registerNumberField =
    document.getElementById("registerNumberField");


/* Faculty */

const facultyInformationSection =
    document.getElementById("facultyInformationSection");

const clubSocietyInchargeField =
    document.getElementById("clubSocietyInchargeField");

const clubSocietyInchargeInputs =
    Array.from(
        document.querySelectorAll(
            'input[name="clubSocietyIncharge"]'
        )
    );

const clubSocietyNameField =
    document.getElementById("clubSocietyNameField");

const clubSocietyNameInput =
    document.getElementById("clubSocietyName");


/* Acknowledgement */

const acknowledgementField =
    document.getElementById("acknowledgementField");

const acknowledgementCheckbox =
    document.getElementById("acknowledgementCheckbox");


/* =========================================================
   CONFIGURATION
   ========================================================= */

const PROFILE_SETUP_CONFIG = Object.freeze({

    ALLOWED_CAMPUS_ROLES: Object.freeze([
        "student",
        "faculty"
    ]),

    /*
       2 digits (admission year) + 2 letters (department
       code) + 3 digits (roll sequence). Examples:
       24CS001, 25EC001, 22CS202.
    */

REGISTER_NUMBER_PATTERN:
/^[A-Z0-9]{7}$/,

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
        club_society_incharge,
        club_society_name,
        is_admin,
        profile_photo_url,
        created_at,
        updated_at
    `

});


/* =========================================================
   PAGE STATE
   ========================================================= */

let currentAuthenticatedUser = null;
let currentExistingProfile = null;

let profileSetupInProgress = false;
let eventListenersInitialized = false;
let liveValidationInitialized = false;

/*
   Request tokens for the async duplicate checks below,
   so a slow, stale check can never overwrite the result
   of a newer one (e.g. the user edits the field again
   before the first check resolves).
*/

let mobileDuplicateCheckToken = 0;
let emailDuplicateCheckToken = 0;
let registerNumberDuplicateCheckToken = 0;


/* =========================================================
   CREATE AUTHENTICATED USER INFORMATION
   ========================================================= */

function createAuthenticatedUserInformation(
    authenticatedUser
) {

    if (!authenticatedUser?.id) {
        return null;
    }

    const userMetadata =
        authenticatedUser.user_metadata ?? {};

    return {

        id: cleanText(authenticatedUser.id),

        fullName: toTitleCase(
            userMetadata.full_name ??
            userMetadata.name ??
            ""
        ),

        email:
            cleanText(authenticatedUser.email)
                .toLowerCase(),

        profilePhotoUrl:
            cleanText(
                userMetadata.avatar_url ??
                userMetadata.picture ??
                ""
            )

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

    const client =
        requireSupabaseClient();

    const {
        data,
        error
    } = await client
        .from("profiles")
        .select(
            PROFILE_SETUP_CONFIG.PROFILE_COLUMNS
        )
        .eq("id", safeUserId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data ?? null;

}


/* =========================================================
   DUPLICATE VALUE CHECKS

   Each of mobile_number, email, and register_number must
   be unique across the profiles table. These checks
   exclude the current user's own row (by id) so that
   re-saving your own existing value is never flagged.
   ========================================================= */

async function isColumnValueTaken(
    column,
    value,
    excludeId
) {

    const safeValue =
        cleanText(value);

    if (!safeValue) {
        return false;
    }

    const client =
        requireSupabaseClient();

    let query =
        client
            .from("profiles")
            .select("id")
            .eq(column, safeValue);

    if (excludeId) {

        query = query.neq(
            "id",
            excludeId
        );

    }

    const {
        data,
        error
    } = await query.maybeSingle();

    if (error) {
        throw error;
    }

    return Boolean(data);

}


async function checkMobileNumberDuplicate() {

    if (!mobileNumberInput) {
        return true;
    }

    const mobileNumber =
        onlyNumbers(
            mobileNumberInput.value
        );

    if (
        !mobileNumber ||
        !isValidMobileNumber(mobileNumber)
    ) {

        /*
           Format validation already covers
           this case separately.
        */

        return true;

    }

    const requestToken =
        ++mobileDuplicateCheckToken;

    try {

        const taken =
            await isColumnValueTaken(
                "mobile_number",
                mobileNumber,
                currentAuthenticatedUser?.id
            );


        if (requestToken !== mobileDuplicateCheckToken) {

            /*
               A newer check has started since this
               one was fired. Ignore this stale result.
            */

            return true;

        }


        if (taken) {

            setFieldError(
                mobileField,
                "This mobile number is already registered to another account."
            );

            return false;

        }


        clearFieldError(
            mobileField
        );

        return true;

    } catch (error) {

        console.error(
            "Mobile number duplicate check error:",
            error
        );

        /*
           Do not block the user because the
           duplicate check itself failed.
        */

        return true;

    }

}


async function checkEmailDuplicate() {

    if (!emailInput) {
        return true;
    }

    const email =
        cleanText(
            emailInput.value
        ).toLowerCase();

    if (!email) {
        return true;
    }

    const requestToken =
        ++emailDuplicateCheckToken;

    try {

        const taken =
            await isColumnValueTaken(
                "email",
                email,
                currentAuthenticatedUser?.id
            );


        if (requestToken !== emailDuplicateCheckToken) {
            return true;
        }


        if (taken) {

            setFieldError(
                emailField,
                "This email address is already registered to another account."
            );

            return false;

        }


        clearFieldError(
            emailField
        );

        return true;

    } catch (error) {

        console.error(
            "Email duplicate check error:",
            error
        );

        return true;

    }

}


async function checkRegisterNumberDuplicate() {

    if (
        !isStudentRole() ||
        !registerNumberInput
    ) {
        return true;
    }

    const registerNumber =
        toUpperCase(
            registerNumberInput.value
        );

    if (
        !registerNumber ||
        !PROFILE_SETUP_CONFIG
            .REGISTER_NUMBER_PATTERN
            .test(registerNumber)
    ) {

        /*
           Format validation already covers
           this case separately.
        */

        return true;

    }

    const requestToken =
        ++registerNumberDuplicateCheckToken;

    try {

        const taken =
            await isColumnValueTaken(
                "register_number",
                registerNumber,
                currentAuthenticatedUser?.id
            );


        if (
            requestToken !==
            registerNumberDuplicateCheckToken
        ) {
            return true;
        }


        if (taken) {

            setFieldError(
                registerNumberField,
                "This register number is already registered to another account."
            );

            return false;

        }


        clearFieldError(
            registerNumberField
        );

        return true;

    } catch (error) {

        console.error(
            "Register number duplicate check error:",
            error
        );

        return true;

    }

}


async function validateNoDuplicateValues() {

    const mobileOk =
        await checkMobileNumberDuplicate();

    const emailOk =
        await checkEmailDuplicate();

    const registerNumberOk =
        await checkRegisterNumberDuplicate();

    return (
        mobileOk &&
        emailOk &&
        registerNumberOk
    );

}


/* =========================================================
   CHECK PROFILE COMPLETION
   ========================================================= */

function isProfileComplete(profile) {

    if (!profile) {
        return false;
    }


    /*
       Admin profiles do not need normal
       campus profile completion.
    */

    if (profile.is_admin === true) {
        return true;
    }


    /*
       Common fields required for every profile.
    */

    const hasCommonFields = Boolean(

        cleanText(profile.full_name) &&
        cleanText(profile.email) &&
        cleanText(profile.mobile_number) &&
        cleanText(profile.campus_role)

    );

    if (!hasCommonFields) {
        return false;
    }


    /*
       Student profile completion.
    */

    if (profile.campus_role === "student") {

        return Boolean(

            cleanText(profile.department) &&
            cleanText(profile.programme) &&
            cleanText(profile.academic_year) &&
            cleanText(profile.section) &&
            cleanText(profile.register_number)

        );

    }


    /*
       Faculty profile completion.
    */

    if (profile.campus_role === "faculty") {

        if (!cleanText(profile.department)) {
            return false;
        }


        /*
           If faculty member is in charge of a club/society,
           the club/society name is mandatory.
        */

        if (profile.club_society_incharge === true) {

            return Boolean(
                cleanText(profile.club_society_name)
            );

        }


        /*
           Otherwise the faculty member must explicitly
           answer "No".
        */

        return profile.club_society_incharge === false;

    }


    return false;

}


/* =========================================================
   ROUTE COMPLETE PROFILE
   ========================================================= */

function routeExistingProfileIfResolved(profile) {

    if (!profile) {
        return false;
    }


    /*
       Admin -> Admin Dashboard
    */

    if (profile.is_admin === true) {

        replacePage(
            ROUTES.ADMIN_DASHBOARD
        );

        return true;

    }


    /*
       Fully completed profile -> Main Dashboard
    */

    if (isProfileComplete(profile)) {

        replacePage(
            ROUTES.MAIN_DASHBOARD
        );

        return true;

    }


    /*
       Existing but incomplete profile.
       Stay on this page.
    */

    return false;

}


/* =========================================================
   PROFILE PHOTO
   ========================================================= */

function clearProfilePhoto() {

    [
        navbarUserAvatar,
        profilePhotoPreview
    ].forEach((element) => {

        if (!element) {
            return;
        }

        element.style.backgroundImage = "";
        element.style.backgroundSize = "";
        element.style.backgroundPosition = "";
        element.style.backgroundRepeat = "";

    });

    profilePhotoPreview?.classList.remove(
        "has-image"
    );

}


function applyProfilePhoto(profilePhotoUrl) {

    clearProfilePhoto();

    const photoUrl =
        cleanText(profilePhotoUrl);

    if (!photoUrl) {
        return;
    }

    try {

        const parsedUrl =
            new URL(photoUrl);

        if (
            parsedUrl.protocol !== "http:" &&
            parsedUrl.protocol !== "https:"
        ) {
            return;
        }

        const profileImage =
            `url("${parsedUrl.href}")`;


        if (profilePhotoPreview) {

            profilePhotoPreview.style.backgroundImage =
                profileImage;

            profilePhotoPreview.style.backgroundSize =
                "cover";

            profilePhotoPreview.style.backgroundPosition =
                "center";

            profilePhotoPreview.style.backgroundRepeat =
                "no-repeat";

            profilePhotoPreview.classList.add(
                "has-image"
            );

            profilePhotoPreview.textContent = "";

        }


        if (navbarUserAvatar) {

            navbarUserAvatar.style.backgroundImage =
                profileImage;

            navbarUserAvatar.style.backgroundSize =
                "cover";

            navbarUserAvatar.style.backgroundPosition =
                "center";

            navbarUserAvatar.style.backgroundRepeat =
                "no-repeat";

            navbarUserAvatar.textContent = "";

        }

    } catch (error) {

        console.warn(
            "Invalid profile photo URL:",
            error
        );

    }

}


/* =========================================================
   POPULATE ACCOUNT INFORMATION
   ========================================================= */

function populateAccountInformation(user) {

    if (!user) {
        return;
    }

    const fullName =
        toTitleCase(user.fullName);

    const email =
        cleanText(user.email).toLowerCase();

    const initials =
        getInitials(fullName);


    if (fullNameInput) {
        fullNameInput.value = fullName;
    }

    if (emailInput) {

        emailInput.value = email;

        emailInput.setAttribute(
            "readonly",
            "true"
        );

    }


    setText(
        navbarUserName,
        fullName || "New User"
    );

    setText(
        navbarUserAvatar,
        initials
    );

    setText(
        profilePhotoPreview,
        initials
    );


    applyProfilePhoto(
        user.profilePhotoUrl
    );

}


/* =========================================================
   POPULATE EXISTING PROFILE
   ========================================================= */

function populateExistingProfile(profile) {

    if (!profile) {
        return;
    }


    /*
       Common fields
    */

    if (fullNameInput) {
        fullNameInput.value =
            toTitleCase(
                cleanText(profile.full_name)
            );
    }

    if (emailInput) {
        emailInput.value =
            cleanText(profile.email)
                .toLowerCase();

        emailInput.setAttribute(
            "readonly",
            "true"
        );
    }

    if (mobileNumberInput) {
        mobileNumberInput.value =
            onlyNumbers(
                profile.mobile_number
            );
    }


    /*
       Campus role
    */

    const campusRole =
        cleanText(
            profile.campus_role
        ).toLowerCase();

    campusRoleInputs.forEach((input) => {

        input.checked =
            input.value === campusRole;

    });


    /*
       Department
    */

    if (departmentInput) {

        departmentInput.value =
            cleanText(
                profile.department
            );

    }


    /*
       Student fields
    */

    if (programmeInput) {

        programmeInput.value =
            cleanText(
                profile.programme
            );

    }

    if (yearInput) {

        yearInput.value =
            cleanText(
                profile.academic_year
            );

    }

    if (sectionInput) {

        sectionInput.value =
            cleanText(
                profile.section
            );

    }

    if (registerNumberInput) {

        registerNumberInput.value =
            toUpperCase(
                cleanText(
                    profile.register_number
                )
            );

    }


    /*
       Faculty fields
    */

    clubSocietyInchargeInputs.forEach(
        (input) => {

            if (
                profile.club_society_incharge === true
            ) {

                input.checked =
                    input.value === "yes";

            } else if (
                profile.club_society_incharge === false
            ) {

                input.checked =
                    input.value === "no";

            } else {

                input.checked = false;

            }

        }
    );


    if (clubSocietyNameInput) {

        clubSocietyNameInput.value =
            cleanText(
                profile.club_society_name
            );

    }


    /*
       Update the visible section based
       on the existing campus role.
    */

    updateCampusRoleSectionsVisibility();

    updateClubSocietyNameVisibility();


    /*
       Use the stored profile photo when available.
       Otherwise retain the Google photo.
    */

    applyProfilePhoto(
        cleanText(
            profile.profile_photo_url
        ) ||
        currentAuthenticatedUser?.profilePhotoUrl
    );

}


/* =========================================================
   ROLE HELPERS
   ========================================================= */

function getSelectedCampusRole() {

    const selectedRole =
        campusRoleInputs.find(
            (input) => input.checked
        );

    return cleanText(
        selectedRole?.value
    ).toLowerCase();

}


function isStudentRole() {

    return getSelectedCampusRole() ===
        "student";

}


function isFacultyRole() {

    return getSelectedCampusRole() ===
        "faculty";

}


function getClubSocietyInchargeSelection() {

    const selectedOption =
        clubSocietyInchargeInputs.find(
            (input) => input.checked
        );

    return cleanText(
        selectedOption?.value
    ).toLowerCase();

}


function isClubSocietyInchargeYes() {

    return getClubSocietyInchargeSelection() ===
        "yes";

}


function isClubSocietyInchargeSelected() {

    return clubSocietyInchargeInputs.some(
        (input) => input.checked
    );

}


/* =========================================================
   CLEAR SECTION VALUES
   ========================================================= */

function clearStudentFields() {

    if (programmeInput) {
        programmeInput.value = "";
    }

    if (yearInput) {
        yearInput.value = "";
    }

    if (sectionInput) {
        sectionInput.value = "";
    }

    if (registerNumberInput) {
        registerNumberInput.value = "";
    }


    clearFieldError(programmeField);
    clearFieldError(yearField);
    clearFieldError(sectionField);
    clearFieldError(registerNumberField);

}


function clearFacultyFields() {

    clubSocietyInchargeInputs.forEach(
        (input) => {
            input.checked = false;
        }
    );

    if (clubSocietyNameInput) {
        clubSocietyNameInput.value = "";
    }


    clearFieldError(
        clubSocietyInchargeField
    );

    clearFieldError(
        clubSocietyNameField
    );

    updateClubSocietyNameVisibility();

}


/* =========================================================
   SECTION VISIBILITY
   ========================================================= */

function updateClubSocietyNameVisibility() {

    if (!clubSocietyNameField) {
        return;
    }


    if (
        isFacultyRole() &&
        isClubSocietyInchargeYes()
    ) {

        clubSocietyNameField.classList.remove(
            "hidden"
        );

        return;

    }


    clubSocietyNameField.classList.add(
        "hidden"
    );


    if (clubSocietyNameInput) {
        clubSocietyNameInput.value = "";
    }


    clearFieldError(
        clubSocietyNameField
    );

}


function updateCampusRoleSectionsVisibility() {

    if (isStudentRole()) {

        studentInformationSection?.classList.remove(
            "hidden"
        );

        facultyInformationSection?.classList.add(
            "hidden"
        );


        /*
           Do NOT clear existing faculty data here
           when loading an existing profile.
           Only visibility changes.
        */

        updateClubSocietyNameVisibility();

        return;

    }


    if (isFacultyRole()) {

        facultyInformationSection?.classList.remove(
            "hidden"
        );

        studentInformationSection?.classList.add(
            "hidden"
        );

        updateClubSocietyNameVisibility();

        return;

    }


    studentInformationSection?.classList.add(
        "hidden"
    );

    facultyInformationSection?.classList.add(
        "hidden"
    );

}


/* =========================================================
   INPUT FORMATTING
   ========================================================= */

function handleMobileNumberInput() {

    if (!mobileNumberInput) {
        return;
    }

    mobileNumberInput.value =
        onlyNumbers(
            mobileNumberInput.value
        ).slice(0, 10);


    if (
        mobileField?.classList.contains(
            "has-error"
        )
    ) {

        validateMobileNumber();

    }

    hideFormMessage(
        profileSetupMessage
    );

}


function handleRegisterNumberInput() {

    if (!registerNumberInput) {
        return;
    }

    registerNumberInput.value =
        toUpperCase(
            registerNumberInput.value
        );


    if (
        registerNumberField?.classList.contains(
            "has-error"
        )
    ) {

        validateRegisterNumber();

    }

    hideFormMessage(
        profileSetupMessage
    );

}


/* =========================================================
   COMMON VALIDATION
   ========================================================= */

function validateFullName() {

    const fullName =
        cleanText(
            fullNameInput?.value
        );

    return Boolean(fullName);

}


function validateEmail() {

    return Boolean(
        cleanText(
            emailInput?.value
        )
    );

}


function validateMobileNumber() {

    const mobileNumber =
        onlyNumbers(
            mobileNumberInput?.value
        );


    if (!mobileNumber) {

        setFieldError(
            mobileField,
            "Mobile number is required."
        );

        return false;

    }


    if (!isValidMobileNumber(mobileNumber)) {

        setFieldError(
            mobileField,
            "Enter a valid 10-digit mobile number."
        );

        return false;

    }


    clearFieldError(
        mobileField
    );

    return true;

}


function validateCampusRole() {

    const campusRole =
        getSelectedCampusRole();


    if (!campusRole) {

        setFieldError(
            campusRoleField,
            "Select your campus role."
        );

        return false;

    }


    if (
        !PROFILE_SETUP_CONFIG.ALLOWED_CAMPUS_ROLES
            .includes(campusRole)
    ) {

        setFieldError(
            campusRoleField,
            "Select a valid campus role."
        );

        return false;

    }


    clearFieldError(
        campusRoleField
    );

    return true;

}


function validateDepartment() {

    const department =
        cleanText(
            departmentInput?.value
        );


    if (!department) {

        setFieldError(
            departmentField,
            "Select your department."
        );

        return false;

    }


    clearFieldError(
        departmentField
    );

    return true;

}


/* =========================================================
   STUDENT VALIDATION
   ========================================================= */

function validateProgramme() {

    if (!isStudentRole()) {
        return true;
    }

    const programme =
        cleanText(
            programmeInput?.value
        );


    if (!programme) {

        setFieldError(
            programmeField,
            "Select your programme."
        );

        return false;

    }


    clearFieldError(
        programmeField
    );

    return true;

}


function validateYear() {

    if (!isStudentRole()) {
        return true;
    }

    const academicYear =
        cleanText(
            yearInput?.value
        );


    if (!academicYear) {

        setFieldError(
            yearField,
            "Select your current year."
        );

        return false;

    }


    clearFieldError(
        yearField
    );

    return true;

}


function validateSection() {

    if (!isStudentRole()) {
        return true;
    }

    const section =
        cleanText(
            sectionInput?.value
        );


    if (!section) {

        setFieldError(
            sectionField,
            "Select your section."
        );

        return false;

    }


    clearFieldError(
        sectionField
    );

    return true;

}


function validateRegisterNumber() {

    if (!isStudentRole()) {
        return true;
    }

    const registerNumber =
        toUpperCase(
            registerNumberInput?.value
        );


    if (!registerNumber) {

        setFieldError(
            registerNumberField,
            "Register number is required."
        );

        return false;

    }


    if (
        !PROFILE_SETUP_CONFIG
            .REGISTER_NUMBER_PATTERN
            .test(registerNumber)
    ) {

        setFieldError(
            registerNumberField,
            "Register number must contain exactly 7 letters or numbers."
        );

        return false;

    }


    clearFieldError(
        registerNumberField
    );

    return true;

}


function validateStudentInformation() {

    if (!isStudentRole()) {
        return true;
    }

    const programmeValid =
        validateProgramme();

    const yearValid =
        validateYear();

    const sectionValid =
        validateSection();

    const registerNumberValid =
        validateRegisterNumber();


    return (
        programmeValid &&
        yearValid &&
        sectionValid &&
        registerNumberValid
    );

}


/* =========================================================
   FACULTY VALIDATION
   ========================================================= */

function validateClubSocietyIncharge() {

    if (!isFacultyRole()) {
        return true;
    }


    if (!isClubSocietyInchargeSelected()) {

        setFieldError(
            clubSocietyInchargeField,
            "Let us know if you are in charge of a club or IEEE society."
        );

        return false;

    }


    clearFieldError(
        clubSocietyInchargeField
    );

    return true;

}


function validateClubSocietyName() {

    if (
        !isFacultyRole() ||
        !isClubSocietyInchargeYes()
    ) {

        return true;

    }


    const clubSocietyName =
        cleanText(
            clubSocietyNameInput?.value
        );


    if (!clubSocietyName) {

        setFieldError(
            clubSocietyNameField,
            "Club/Society name is required."
        );

        return false;

    }


    clearFieldError(
        clubSocietyNameField
    );

    return true;

}


function validateFacultyInformation() {

    if (!isFacultyRole()) {
        return true;
    }

    const inchargeValid =
        validateClubSocietyIncharge();

    const clubNameValid =
        validateClubSocietyName();


    return (
        inchargeValid &&
        clubNameValid
    );

}


/* =========================================================
   ACKNOWLEDGEMENT
   ========================================================= */

function validateAcknowledgement() {

    if (
        !acknowledgementCheckbox?.checked
    ) {

        setFieldError(
            acknowledgementField,
            "Please confirm the acknowledgement before continuing."
        );

        return false;

    }


    clearFieldError(
        acknowledgementField
    );

    return true;

}


/* =========================================================
   FULL FORM VALIDATION
   ========================================================= */

function validateProfileSetupForm() {

    const fullNameValid =
        validateFullName();

    const emailValid =
        validateEmail();

    const mobileNumberValid =
        validateMobileNumber();

    const campusRoleValid =
        validateCampusRole();

    const departmentValid =
        validateDepartment();

    const studentInformationValid =
        validateStudentInformation();

    const facultyInformationValid =
        validateFacultyInformation();

    const acknowledgementValid =
        validateAcknowledgement();


    return (
        fullNameValid &&
        emailValid &&
        mobileNumberValid &&
        campusRoleValid &&
        departmentValid &&
        studentInformationValid &&
        facultyInformationValid &&
        acknowledgementValid
    );

}


/* =========================================================
   BUILD PROFILE DATA
   ========================================================= */

function createProfileData(
    authenticatedUser
) {

    if (!authenticatedUser?.id) {
        throw new Error(
            "Authenticated user information is unavailable."
        );
    }


    const campusRole =
        getSelectedCampusRole();


    const profileData = {

        id: authenticatedUser.id,

        full_name:
            toTitleCase(
                cleanText(
                    fullNameInput?.value
                ) ||
                authenticatedUser.fullName
            ),

        email:
            cleanText(
                authenticatedUser.email
            ).toLowerCase(),

        mobile_number:
            onlyNumbers(
                mobileNumberInput?.value
            ),

        campus_role:
            campusRole,

        department:
            cleanText(
                departmentInput?.value
            ),

        programme: null,

        academic_year: null,

        section: null,

        register_number: null,

        club_society_incharge: null,

        club_society_name: null,

        is_admin: false,

        profile_photo_url:
            cleanText(
                currentExistingProfile
                    ?.profile_photo_url
            ) ||
            cleanText(
                authenticatedUser.profilePhotoUrl
            ) ||
            null,

        updated_at:
            new Date().toISOString()

    };


    /*
       Student-specific data.
    */

    if (campusRole === "student") {

        profileData.programme =
            cleanText(
                programmeInput?.value
            );

        profileData.academic_year =
            cleanText(
                yearInput?.value
            );

        profileData.section =
            cleanText(
                sectionInput?.value
            );

        profileData.register_number =
            toUpperCase(
                registerNumberInput?.value
            );

    }


    /*
       Faculty-specific data.
    */

    else if (campusRole === "faculty") {

        const isIncharge =
            isClubSocietyInchargeYes();


        profileData.club_society_incharge =
            isIncharge;


        profileData.club_society_name =
            isIncharge
                ? cleanText(
                    clubSocietyNameInput?.value
                )
                : null;

    }


    return profileData;

}


/* =========================================================
   INSERT NEW PROFILE
   ========================================================= */

async function insertProfile(
    profileData
) {

    if (!profileData?.id) {

        throw new Error(
            "Profile information is unavailable."
        );

    }


    const client =
        requireSupabaseClient();


    const {
        data,
        error
    } = await client
        .from("profiles")
        .insert(profileData)
        .select(
            PROFILE_SETUP_CONFIG.PROFILE_COLUMNS
        )
        .single();


    if (error) {
        throw error;
    }


    return {

        success: true,

        operation: "insert",

        profile: data

    };

}


/* =========================================================
   UPDATE EXISTING PROFILE
   ========================================================= */

async function updateProfile(
    profileData
) {

    if (!profileData?.id) {

        throw new Error(
            "Profile information is unavailable."
        );

    }


    const client =
        requireSupabaseClient();


    /*
       Update only the authenticated user's own row.

       RLS should enforce:
           auth.uid() = id
    */

    const {
        data,
        error
    } = await client
        .from("profiles")
        .update({

            full_name:
                profileData.full_name,

            email:
                profileData.email,

            mobile_number:
                profileData.mobile_number,

            campus_role:
                profileData.campus_role,

            department:
                profileData.department,

            programme:
                profileData.programme,

            academic_year:
                profileData.academic_year,

            section:
                profileData.section,

            register_number:
                profileData.register_number,

            club_society_incharge:
                profileData.club_society_incharge,

            club_society_name:
                profileData.club_society_name,

            profile_photo_url:
                profileData.profile_photo_url,

            updated_at:
                profileData.updated_at

        })
        .eq(
            "id",
            profileData.id
        )
        .select(
            PROFILE_SETUP_CONFIG.PROFILE_COLUMNS
        )
        .single();


    if (error) {
        throw error;
    }


    return {

        success: true,

        operation: "update",

        profile: data

    };

}


/* =========================================================
   SAVE PROFILE
   ========================================================= */

async function saveProfile(
    profileData
) {

    /*
       Existing profile -> UPDATE
    */

    if (currentExistingProfile) {

        return await updateProfile(
            profileData
        );

    }


    /*
       No profile -> INSERT
    */

    return await insertProfile(
        profileData
    );

}


/* =========================================================
   DUPLICATE INSERT RECOVERY
   ========================================================= */

async function handleDuplicateProfileInsert(
    userId
) {

    try {

        const existingProfile =
            await getExistingProfile(
                userId
            );


        if (!existingProfile) {
            return false;
        }


        /*
           Store it as the current profile so the next
           submission performs UPDATE rather than INSERT.
        */

        currentExistingProfile =
            existingProfile;


        /*
           If another tab completed the profile,
           route immediately.
        */

        if (
            routeExistingProfileIfResolved(
                existingProfile
            )
        ) {

            return true;

        }


        /*
           Existing profile is incomplete.
           Load it and allow the user to continue.
        */

        populateExistingProfile(
            existingProfile
        );


        showFormMessage(
            profileSetupMessage,
            "Your profile was already started. The existing information has been loaded. Please complete the remaining details.",
            "error"
        );


        return true;

    } catch (error) {

        console.error(
            "Duplicate profile recovery error:",
            error
        );

        return false;

    }

}


/* =========================================================
   UNIQUE CONSTRAINT VIOLATION -> FIELD MAPPING

   When a genuine unique-constraint violation reaches the
   database (23505) for a column other than the profile's
   own id, map it back to the specific field so the warning
   lands under that field instead of only at the top.
   ========================================================= */

function mapUniqueViolationToField(
    error
) {

    const detail =
        String(
            error?.details ??
            error?.message ??
            ""
        ).toLowerCase();


    if (detail.includes("mobile_number")) {

        return {
            field: mobileField,
            message:
                "This mobile number is already registered to another account."
        };

    }


    if (detail.includes("register_number")) {

        return {
            field: registerNumberField,
            message:
                "This register number is already registered to another account."
        };

    }


    if (detail.includes("email")) {

        return {
            field: emailField,
            message:
                "This email address is already registered to another account."
        };

    }


    return null;

}


/* =========================================================
   ERROR MESSAGES
   ========================================================= */

function getProfileSetupErrorMessage(
    error
) {

    const message =
        String(
            error?.message ?? ""
        ).toLowerCase();

    const errorCode =
        cleanText(
            error?.code
        ).toLowerCase();


    /*
       Duplicate profile is no longer treated as
       a final error. The submit handler separately
       handles 23505.
    */

    if (
        errorCode === "42501" ||
        message.includes("permission") ||
        message.includes("policy") ||
        message.includes("row-level security")
    ) {

        return (
            "Your account does not have permission to complete this action."
        );

    }


    if (
        message.includes("network") ||
        message.includes("fetch")
    ) {

        return (
            "Unable to connect to the server. Check your internet connection."
        );

    }


    if (
        message.includes("authenticated user")
    ) {

        return (
            "Your authenticated account information is unavailable."
        );

    }


    return (
        "Unable to save your profile. Please try again."
    );

}


/* =========================================================
   PROFILE SUBMISSION
   ========================================================= */

async function handleProfileSetupSubmit(
    event
) {

    event.preventDefault();


    if (profileSetupInProgress) {
        return;
    }


    hideFormMessage(
        profileSetupMessage
    );

    clearFormValidation(
        profileSetupForm
    );


    const formIsValid =
        validateProfileSetupForm();


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

    setButtonLoading(
        completeProfileButton,
        true
    );


    try {

        /*
           Re-check mobile number, email, and register
           number for uniqueness right before saving,
           in case another account claimed one of these
           values since the user last blurred the field.
        */

        const noDuplicateValues =
            await validateNoDuplicateValues();


        if (!noDuplicateValues) {

            showFormMessage(
                profileSetupMessage,
                "Some of the details you entered are already registered to another account. Please review the highlighted fields.",
                "error"
            );

            return;

        }


        const profileData =
            createProfileData(
                currentAuthenticatedUser
            );


        const result =
            await saveProfile(
                profileData
            );


        if (
            !result?.success ||
            !result?.profile
        ) {

            throw new Error(
                "Unable to save profile."
            );

        }


        /*
           Keep the newly saved profile in state.
        */

        currentExistingProfile =
            result.profile;


        /*
           Verify completion after saving.
        */

        const profileComplete =
            isProfileComplete(
                result.profile
            );


        if (
            result.profile.is_admin === true
        ) {

            replacePage(
                ROUTES.ADMIN_DASHBOARD
            );

            return;

        }


        if (profileComplete) {

            replacePage(
                ROUTES.MAIN_DASHBOARD
            );

            return;

        }


        /*
           This should normally not happen because
           validation already checks required fields,
           but keep a safe fallback.
        */

        showFormMessage(
            profileSetupMessage,
            "Your profile was saved, but some required information is still incomplete.",
            "error"
        );


    } catch (error) {

        console.error(
            "Profile setup error:",
            error
        );


        const errorCode =
            cleanText(
                error?.code
            ).toLowerCase();


        /*
           Race condition:
           Another tab/request created the profile
           between our initial check and INSERT.
        */

        if (
            !currentExistingProfile &&
            errorCode === "23505"
        ) {

            const recovered =
                await handleDuplicateProfileInsert(
                    currentAuthenticatedUser.id
                );


            if (recovered) {
                return;
            }

        }


        /*
           Genuine unique-constraint violation on
           mobile_number, email, or register_number
           (as opposed to the profile-id race handled
           above). Surface it under the specific field.
        */

        if (errorCode === "23505") {

            const violation =
                mapUniqueViolationToField(
                    error
                );


            if (violation) {

                setFieldError(
                    violation.field,
                    violation.message
                );

                showFormMessage(
                    profileSetupMessage,
                    "Some of the details you entered are already registered to another account. Please review the highlighted fields.",
                    "error"
                );

                return;

            }

        }


        showFormMessage(
            profileSetupMessage,
            getProfileSetupErrorMessage(
                error
            ),
            "error"
        );


    } finally {

        profileSetupInProgress = false;

        setButtonLoading(
            completeProfileButton,
            false
        );

    }

}


/* =========================================================
   CHANGE HANDLERS
   ========================================================= */

function handleCampusRoleChange() {

    clearFieldError(
        campusRoleField
    );

    updateCampusRoleSectionsVisibility();

    hideFormMessage(
        profileSetupMessage
    );

}


function handleClubSocietyInchargeChange() {

    clearFieldError(
        clubSocietyInchargeField
    );

    updateClubSocietyNameVisibility();

    hideFormMessage(
        profileSetupMessage
    );

}


function handleAcknowledgementChange() {

    if (
        acknowledgementCheckbox?.checked
    ) {

        clearFieldError(
            acknowledgementField
        );

    }

    hideFormMessage(
        profileSetupMessage
    );

}


/* =========================================================
   LIVE VALIDATION
   ========================================================= */

function initializeLiveValidation() {

    if (liveValidationInitialized) {
        return;
    }


    mobileNumberInput?.addEventListener(
        "input",
        handleMobileNumberInput
    );

    mobileNumberInput?.addEventListener(
        "blur",
        async () => {

            /*
               Only run the (network) duplicate check
               once the format itself is valid.
            */

            if (validateMobileNumber()) {

                await checkMobileNumberDuplicate();

            }

        }
    );


    departmentInput?.addEventListener(
        "change",
        validateDepartment
    );


    programmeInput?.addEventListener(
        "change",
        validateProgramme
    );

    yearInput?.addEventListener(
        "change",
        validateYear
    );

    sectionInput?.addEventListener(
        "change",
        validateSection
    );


    registerNumberInput?.addEventListener(
        "input",
        handleRegisterNumberInput
    );

    registerNumberInput?.addEventListener(
        "blur",
        async () => {

            if (validateRegisterNumber()) {

                await checkRegisterNumberDuplicate();

            }

        }
    );


    clubSocietyNameInput?.addEventListener(
        "input",
        () => {

            if (
                clubSocietyNameField?.classList.contains(
                    "has-error"
                )
            ) {

                validateClubSocietyName();

            }

            hideFormMessage(
                profileSetupMessage
            );

        }
    );


    acknowledgementCheckbox?.addEventListener(
        "change",
        handleAcknowledgementChange
    );


    liveValidationInitialized = true;

}


/* =========================================================
   EVENT LISTENERS
   ========================================================= */

function initializeEventListeners() {

    if (eventListenersInitialized) {
        return;
    }


    profileSetupForm?.addEventListener(
        "submit",
        handleProfileSetupSubmit
    );


    campusRoleInputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                handleCampusRoleChange
            );

        }
    );


    clubSocietyInchargeInputs.forEach(
        (input) => {

            input.addEventListener(
                "change",
                handleClubSocietyInchargeChange
            );

        }
    );


    eventListenersInitialized = true;

}


/* =========================================================
   RESET STATE
   ========================================================= */

function resetProfileSetupState() {

    currentAuthenticatedUser = null;

    currentExistingProfile = null;

    profileSetupInProgress = false;

    mobileDuplicateCheckToken = 0;

    emailDuplicateCheckToken = 0;

    registerNumberDuplicateCheckToken = 0;

}


/* =========================================================
   PAGE INITIALIZATION
   ========================================================= */

async function initializeProfileSetupPage(
    authenticatedUser
) {

    if (!profileSetupForm) {

        console.error(
            "Profile setup form is unavailable."
        );

        return false;

    }


    initializeEventListeners();

    initializeLiveValidation();

    resetProfileSetupState();

    hideFormMessage(
        profileSetupMessage
    );


    try {

        /*
           Create normalized Google-authenticated
           user information.
        */

        currentAuthenticatedUser =
            createAuthenticatedUserInformation(
                authenticatedUser
            );


        if (!currentAuthenticatedUser) {

            replacePage(
                ROUTES.LOGIN
            );

            return false;

        }


        /*
           First check:
           Does a profile row already exist?
        */

        const existingProfile =
            await getExistingProfile(
                currentAuthenticatedUser.id
            );


        /*
           CASE 1:
           No profile exists.

           This is a genuine first-time profile.
        */

        if (!existingProfile) {

            currentExistingProfile = null;

            populateAccountInformation(
                currentAuthenticatedUser
            );

            updateCampusRoleSectionsVisibility();

            return true;

        }


        /*
           Store existing profile.
        */

        currentExistingProfile =
            existingProfile;


        /*
           CASE 2:
           Profile exists and is already complete.

           Redirect immediately.
        */

        if (
            routeExistingProfileIfResolved(
                existingProfile
            )
        ) {

            return false;

        }


        /*
           CASE 3:
           Profile exists but is incomplete.

           DO NOT show duplicate-profile error.
           Load existing values and allow completion.
        */

        populateAccountInformation(
            currentAuthenticatedUser
        );

        populateExistingProfile(
            existingProfile
        );


        showFormMessage(
            profileSetupMessage,
            "Your profile setup is incomplete. Please review the existing information and complete the remaining details.",
            "info"
        );


        return true;


    } catch (error) {

        console.error(
            "Profile setup initialization error:",
            error
        );


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

initializeAuthenticatedPage(
    initializeProfileSetupPage
);


/* =========================================================
   EXPORTS
   ========================================================= */

export {

    PROFILE_SETUP_CONFIG,

    createAuthenticatedUserInformation,

    getExistingProfile,

    isColumnValueTaken,

    checkMobileNumberDuplicate,

    checkEmailDuplicate,

    checkRegisterNumberDuplicate,

    validateNoDuplicateValues,

    isProfileComplete,

    routeExistingProfileIfResolved,

    clearProfilePhoto,

    applyProfilePhoto,

    populateAccountInformation,

    populateExistingProfile,

    getSelectedCampusRole,

    isStudentRole,

    isFacultyRole,

    getClubSocietyInchargeSelection,

    updateCampusRoleSectionsVisibility,

    updateClubSocietyNameVisibility,

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

    validateClubSocietyIncharge,

    validateClubSocietyName,

    validateFacultyInformation,

    validateAcknowledgement,

    validateProfileSetupForm,

    createProfileData,

    insertProfile,

    updateProfile,

    saveProfile,

    mapUniqueViolationToField,

    getProfileSetupErrorMessage,

    handleProfileSetupSubmit,

    initializeProfileSetupPage

};