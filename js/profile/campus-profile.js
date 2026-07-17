/* =========================================================
   KPRIET FREELANCER PLATFORM
   Campus Profile Logic
   File: js/profile/campus-profile.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    cleanText,

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


import {

    initializeAuthenticatedPage

} from "../auth/auth-guard.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */


/* ---------------------------------------------------------
   NAVBAR
--------------------------------------------------------- */

const navbarUserName =
    document.getElementById(
        "navbarUserName"
    );


const navbarUserRole =
    document.getElementById(
        "navbarUserRole"
    );


const navbarUserAvatar =
    document.getElementById(
        "navbarUserAvatar"
    );


/* ---------------------------------------------------------
   PROFILE SUMMARY
--------------------------------------------------------- */

const profileAvatar =
    document.getElementById(
        "profileAvatar"
    );


const profileFullName =
    document.getElementById(
        "profileFullName"
    );


const profileIdentity =
    document.getElementById(
        "profileIdentity"
    );


const backToDashboardButton =
    document.getElementById(
        "backToDashboardButton"
    );


/* ---------------------------------------------------------
   PROFILE FORM
--------------------------------------------------------- */

const campusProfileForm =
    document.getElementById(
        "campusProfileForm"
    );


const campusProfileMessage =
    document.getElementById(
        "campusProfileMessage"
    );


const updateProfileButton =
    document.getElementById(
        "updateProfileButton"
    );


/* ---------------------------------------------------------
   PROFILE FIELDS
--------------------------------------------------------- */

const fullNameInput =
    document.getElementById(
        "fullName"
    );


const fullNameField =
    document.getElementById(
        "fullNameField"
    );


const emailInput =
    document.getElementById(
        "email"
    );


const mobileNumberInput =
    document.getElementById(
        "mobileNumber"
    );


const mobileField =
    document.getElementById(
        "mobileField"
    );


const campusRoleInput =
    document.getElementById(
        "campusRole"
    );


/* ---------------------------------------------------------
   STUDENT INFORMATION
--------------------------------------------------------- */

const studentInformationSection =
    document.getElementById(
        "studentInformationSection"
    );


const departmentInput =
    document.getElementById(
        "department"
    );


const programmeInput =
    document.getElementById(
        "programme"
    );


const academicYearInput =
    document.getElementById(
        "academicYear"
    );


const sectionInput =
    document.getElementById(
        "section"
    );


const registerNumberInput =
    document.getElementById(
        "registerNumber"
    );


/* ---------------------------------------------------------
   ADMIN INFORMATION
--------------------------------------------------------- */

const adminInformationSection =
    document.getElementById(
        "adminInformationSection"
    );


/* =========================================================
   CAMPUS PROFILE CONFIGURATION
========================================================= */

const CAMPUS_PROFILE_CONFIG =
    Object.freeze({

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

let currentProfile = null;

let originalFullName = "";

let originalMobileNumber = "";

let updateInProgress = false;

let eventListenersInitialized = false;


/* =========================================================
   GET CURRENT PROFILE
========================================================= */

async function getCurrentProfile(
    authenticatedUser
) {

    if (
        !authenticatedUser?.id
    ) {

        return null;

    }


    const client =
        requireSupabaseClient();


    const {

        data,

        error

    } = await client

        .from(
            "profiles"
        )

        .select(
            CAMPUS_PROFILE_CONFIG
                .PROFILE_COLUMNS
        )

        .eq(
            "id",
            authenticatedUser.id
        )

        .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    return data ?? null;

}


/* =========================================================
   CLEAR PROFILE PHOTO
========================================================= */

function clearProfilePhoto() {

    const profilePhotoElements = [

        navbarUserAvatar,

        profileAvatar

    ];


    profilePhotoElements.forEach(
        (element) => {

            if (
                !element
            ) {

                return;

            }


            element.style.backgroundImage =
                "";


            element.style.backgroundSize =
                "";


            element.style.backgroundPosition =
                "";


            element.style.backgroundRepeat =
                "";

        }
    );

}


/* =========================================================
   PROFILE PHOTO
========================================================= */

function applyProfilePhoto(
    profilePhotoUrl
) {

    clearProfilePhoto();


    const photoUrl =
        cleanText(
            profilePhotoUrl
        );


    if (
        !photoUrl
    ) {

        return;

    }


    try {

        const parsedUrl =
            new URL(
                photoUrl
            );


        if (

            parsedUrl.protocol !==
                "http:"

            &&

            parsedUrl.protocol !==
                "https:"

        ) {

            return;

        }


        const profileImage =
            `url("${parsedUrl.href}")`;


        if (
            navbarUserAvatar
        ) {

            navbarUserAvatar
                .style
                .backgroundImage =
                profileImage;


            navbarUserAvatar
                .style
                .backgroundSize =
                "cover";


            navbarUserAvatar
                .style
                .backgroundPosition =
                "center";


            navbarUserAvatar
                .style
                .backgroundRepeat =
                "no-repeat";


            navbarUserAvatar.textContent =
                "";

        }


        if (
            profileAvatar
        ) {

            profileAvatar
                .style
                .backgroundImage =
                profileImage;


            profileAvatar
                .style
                .backgroundSize =
                "cover";


            profileAvatar
                .style
                .backgroundPosition =
                "center";


            profileAvatar
                .style
                .backgroundRepeat =
                "no-repeat";


            profileAvatar.textContent =
                "";

        }


    } catch (error) {

        console.warn(
            "Invalid profile photo URL:",
            error
        );

    }

}


/* =========================================================
   NORMALIZE CAMPUS ROLE
========================================================= */

function normalizeCampusRole(
    campusRole
) {

    return cleanText(
        campusRole
    ).toLowerCase();

}


/* =========================================================
   CREATE PROFILE IDENTITY
========================================================= */

function createProfileIdentity(
    profile
) {

    const normalizedCampusRole =
        normalizeCampusRole(
            profile?.campus_role
        );


    const campusRole =
        formatCampusRole(
            profile?.campus_role
        );


    if (
        normalizedCampusRole ===
        "student"
    ) {

        const identityParts = [

            cleanText(
                profile?.programme
            ),

            cleanText(
                profile?.department
            ),

            profile?.academic_year

                ? `Year ${cleanText(
                    profile.academic_year
                )}`

                : "",

            profile?.section

                ? `Section ${cleanText(
                    profile.section
                )}`

                : ""

        ].filter(
            Boolean
        );


        return (

            identityParts.join(
                " · "
            )

            ||

            campusRole

            ||

            "Student"

        );

    }


    return (

        campusRole

        ||

        "KPRIET User"

    );

}


/* =========================================================
   POPULATE STUDENT INFORMATION
========================================================= */

function populateStudentInformation(
    profile
) {

    if (
        departmentInput
    ) {

        departmentInput.value =
            cleanText(
                profile?.department
            );

    }


    if (
        programmeInput
    ) {

        programmeInput.value =
            cleanText(
                profile?.programme
            );

    }


    if (
        academicYearInput
    ) {

        academicYearInput.value =
            cleanText(
                profile?.academic_year
            );

    }


    if (
        sectionInput
    ) {

        sectionInput.value =
            cleanText(
                profile?.section
            );

    }


    if (
        registerNumberInput
    ) {

        registerNumberInput.value =
            cleanText(
                profile?.register_number
            );

    }

}


/* =========================================================
   STUDENT INFORMATION VISIBILITY
========================================================= */

function updateStudentInformationVisibility(
    profile
) {

    const isStudent =

        normalizeCampusRole(
            profile?.campus_role
        ) ===
        "student";


    if (
        isStudent
    ) {

        showElement(
            studentInformationSection
        );


        return;

    }


    hideElement(
        studentInformationSection
    );

}


/* =========================================================
   ADMIN INFORMATION VISIBILITY
========================================================= */

function updateAdminInformationVisibility(
    profile
) {

    const isAdmin =
        profile?.is_admin ===
        true;


    if (
        isAdmin
    ) {

        showElement(
            adminInformationSection
        );


        return;

    }


    hideElement(
        adminInformationSection
    );

}


/* =========================================================
   POPULATE PROFILE
========================================================= */

function populateProfile(
    profile
) {

    if (
        !profile
    ) {

        return;

    }


    const fullName =
        cleanText(
            profile.full_name
        )

        ||

        "User";


    const email =
        cleanText(
            profile.email
        ).toLowerCase();


    const mobileNumber =
        onlyNumbers(
            profile.mobile_number
        );


    const campusRole =
        formatCampusRole(
            profile.campus_role
        );


    const initials =
        getInitials(
            fullName
        );


    const navbarRole =
        createNavbarRole(
            profile
        );


    const identity =
        createProfileIdentity(
            profile
        );


    /* -----------------------------------------------------
       NAVBAR
    ----------------------------------------------------- */

    setText(
        navbarUserName,
        fullName
    );


    setText(
        navbarUserRole,
        navbarRole ||
        campusRole ||
        "KPRIET USER"
    );


    setText(
        navbarUserAvatar,
        initials
    );


    /* -----------------------------------------------------
       PROFILE SUMMARY
    ----------------------------------------------------- */

    setText(
        profileAvatar,
        initials
    );


    setText(
        profileFullName,
        fullName
    );


    setText(
        profileIdentity,
        identity
    );


    /* -----------------------------------------------------
       MAIN FIELDS
    ----------------------------------------------------- */

    if (
        fullNameInput
    ) {

        fullNameInput.value =
            fullName;

    }


    if (
        emailInput
    ) {

        emailInput.value =
            email;

    }


    if (
        mobileNumberInput
    ) {

        mobileNumberInput.value =
            mobileNumber;

    }


    if (
        campusRoleInput
    ) {

        campusRoleInput.value =
            campusRole;

    }


    originalFullName =
        fullName;


    originalMobileNumber =
        mobileNumber;


    populateStudentInformation(
        profile
    );


    updateStudentInformationVisibility(
        profile
    );


    updateAdminInformationVisibility(
        profile
    );


    applyProfilePhoto(
        profile.profile_photo_url
    );

}


/* =========================================================
   FULL NAME INPUT CONTROL
========================================================= */

function handleFullNameInput() {

    if (
        !fullNameInput
    ) {

        return;

    }


    if (
        fullNameField
            ?.classList
            .contains(
                "has-error"
            )
    ) {

        validateFullName();

    }


    hideFormMessage(
        campusProfileMessage
    );

}


/* =========================================================
   FULL NAME VALIDATION
========================================================= */

function validateFullName() {

    const fullName =
        cleanText(
            fullNameInput?.value
        );


    if (
        !fullName
    ) {

        setFieldError(
            fullNameField,
            "Full name is required."
        );


        return false;

    }


    if (
        fullName.length < 3
    ) {

        setFieldError(
            fullNameField,
            "Full name must be at least 3 characters."
        );


        return false;

    }


    clearFieldError(
        fullNameField
    );


    return true;

}


/* =========================================================
   MOBILE INPUT CONTROL
========================================================= */

function handleMobileNumberInput() {

    if (
        !mobileNumberInput
    ) {

        return;

    }


    mobileNumberInput.value =
        onlyNumbers(
            mobileNumberInput.value
        ).slice(
            0,
            10
        );


    if (
        mobileField
            ?.classList
            .contains(
                "has-error"
            )
    ) {

        validateMobileNumber();

    }


    hideFormMessage(
        campusProfileMessage
    );

}


/* =========================================================
   MOBILE NUMBER VALIDATION
========================================================= */

function validateMobileNumber() {

    const mobileNumber =
        onlyNumbers(
            mobileNumberInput?.value
        );


    if (
        !mobileNumber
    ) {

        setFieldError(
            mobileField,
            "Mobile number is required."
        );


        return false;

    }


    if (
        !isValidMobileNumber(
            mobileNumber
        )
    ) {

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


/* =========================================================
   CHECK PROFILE CHANGES
========================================================= */

function hasProfileChanged() {

    const currentFullName =
        cleanText(
            fullNameInput?.value
        );


    const currentMobileNumber =
        onlyNumbers(
            mobileNumberInput?.value
        );


    return (
        currentFullName !==
        originalFullName

        ||

        currentMobileNumber !==
        originalMobileNumber
    );

}


/* =========================================================
   UPDATE PROFILE INFO
========================================================= */

async function updateProfileInfo(
    userId,
    fullName,
    mobileNumber
) {

    const safeUserId =
        cleanText(
            userId
        );


    const safeFullName =
        cleanText(
            fullName
        );


    const safeMobileNumber =
        onlyNumbers(
            mobileNumber
        );


    if (
        !safeUserId
    ) {

        throw new Error(
            "User profile identifier is unavailable."
        );

    }


    if (
        !safeFullName ||
        safeFullName.length < 3
    ) {

        throw new Error(
            "A valid full name (minimum 3 characters) is required."
        );

    }


    if (
        !isValidMobileNumber(
            safeMobileNumber
        )
    ) {

        throw new Error(
            "A valid mobile number is required."
        );

    }


    const client =
        requireSupabaseClient();


    const {

        data,

        error

    } = await client

        .from(
            "profiles"
        )

        .update({

            full_name:
                safeFullName,

            mobile_number:
                safeMobileNumber,

            updated_at:
                new Date()
                    .toISOString()

        })

        .eq(
            "id",
            safeUserId
        )

        .select(
            CAMPUS_PROFILE_CONFIG
                .PROFILE_COLUMNS
        )

        .maybeSingle();


    if (
        error
    ) {

        throw error;

    }


    if (
        !data
    ) {

        throw new Error(
            "The campus profile could not be updated."
        );

    }


    return {

        success:
            true,

        profile:
            data

    };

}


/* =========================================================
   PROFILE FORM SUBMISSION
========================================================= */

async function handleProfileSubmit(
    event
) {

    event.preventDefault();


    if (
        updateInProgress
    ) {

        return;

    }


    hideFormMessage(
        campusProfileMessage
    );


    clearFormValidation(
        campusProfileForm
    );


    const fullNameValid =
        validateFullName();


    const mobileNumberValid =
        validateMobileNumber();


    if (
        !fullNameValid ||
        !mobileNumberValid
    ) {

        showFormMessage(

            campusProfileMessage,

            "Check the highlighted fields and complete the required information.",

            "error"

        );


        return;

    }


    if (
        !hasProfileChanged()
    ) {

        showFormMessage(

            campusProfileMessage,

            "No profile changes were detected.",

            "warning"

        );


        return;

    }


    if (
        !currentProfile?.id
    ) {

        showFormMessage(

            campusProfileMessage,

            "Your campus profile is unavailable.",

            "error"

        );


        return;

    }


    const fullName =
        cleanText(
            fullNameInput?.value
        );


    const mobileNumber =
        onlyNumbers(
            mobileNumberInput?.value
        );


    updateInProgress =
        true;


    setButtonLoading(
        updateProfileButton,
        true
    );


    try {

        const result =
            await updateProfileInfo(

                currentProfile.id,

                fullName,

                mobileNumber

            );


        if (
            !result?.success ||
            !result?.profile
        ) {

            throw new Error(
                "Unable to update profile."
            );

        }


        currentProfile = {

            ...currentProfile,

            ...result.profile

        };


        originalFullName =
            cleanText(
                currentProfile.full_name
            );


        originalMobileNumber =
            onlyNumbers(
                currentProfile
                    .mobile_number
            );


        populateProfile(
            currentProfile
        );


        showFormMessage(

            campusProfileMessage,

            "Profile updated successfully.",

            "success"

        );


    } catch (error) {

        console.error(
            "Campus profile update error:",
            error
        );


        showFormMessage(

            campusProfileMessage,

            getProfileUpdateErrorMessage(
                error
            ),

            "error"

        );


    } finally {

        updateInProgress =
            false;


        setButtonLoading(
            updateProfileButton,
            false
        );

    }

}


/* =========================================================
   PROFILE UPDATE ERROR MESSAGE
========================================================= */

function getProfileUpdateErrorMessage(
    error
) {

    const message =
        String(
            error?.message ??
            ""
        ).toLowerCase();


    const errorCode =
        cleanText(
            error?.code
        ).toLowerCase();


    if (

        message.includes(
            "network"
        )

        ||

        message.includes(
            "fetch"
        )

    ) {

        return "Unable to connect to the server. Check your internet connection.";

    }


    if (

        message.includes(
            "permission"
        )

        ||

        message.includes(
            "policy"
        )

        ||

        errorCode ===
            "42501"

    ) {

        return "Your account does not have permission to update this profile.";

    }


    if (

        message.includes(
            "duplicate"
        )

        ||

        errorCode ===
            "23505"

    ) {

        return "This mobile number is already associated with another profile.";

    }


    if (
        message.includes(
            "valid mobile number"
        )
    ) {

        return "Enter a valid 10-digit mobile number.";

    }


    return "Unable to update profile. Please try again.";

}


/* =========================================================
   BACK TO DASHBOARD
========================================================= */

function returnToDashboard() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    if (
        eventListenersInitialized
    ) {

        return;

    }


    campusProfileForm
        ?.addEventListener(

            "submit",

            handleProfileSubmit

        );


    fullNameInput
        ?.addEventListener(

            "input",

            handleFullNameInput

        );


    fullNameInput
        ?.addEventListener(

            "blur",

            validateFullName

        );


    mobileNumberInput
        ?.addEventListener(

            "input",

            handleMobileNumberInput

        );


    mobileNumberInput
        ?.addEventListener(

            "blur",

            validateMobileNumber

        );


    backToDashboardButton
        ?.addEventListener(

            "click",

            returnToDashboard

        );


    eventListenersInitialized =
        true;

}


/* =========================================================
   RESET CAMPUS PROFILE STATE
========================================================= */

function resetCampusProfileState() {

    currentProfile =
        null;


    originalFullName =
        "";


    originalMobileNumber =
        "";


    updateInProgress =
        false;

}


/* =========================================================
   CAMPUS PROFILE INITIALIZATION
========================================================= */

async function initializeCampusProfilePage(
    authenticatedUser
) {

    if (
        !campusProfileForm
    ) {

        console.error(
            "Campus profile form is unavailable."
        );


        return false;

    }


    initializeEventListeners();


    resetCampusProfileState();


    hideFormMessage(
        campusProfileMessage
    );


    try {

        currentProfile =
            await getCurrentProfile(
                authenticatedUser
            );


        if (
            !currentProfile
        ) {

            replacePage(
                ROUTES.PROFILE_SETUP
            );


            return false;

        }


        populateProfile(
            currentProfile
        );


        return true;


    } catch (error) {

        console.error(
            "Campus profile initialization error:",
            error
        );


        showFormMessage(

            campusProfileMessage,

            "Unable to load your campus profile. Please refresh the page and try again.",

            "error"

        );


        return false;

    }

}


/* =========================================================
   START PAGE
========================================================= */

initializeAuthenticatedPage(
    initializeCampusProfilePage
);


/* =========================================================
   EXPORTS
========================================================= */

export {

    CAMPUS_PROFILE_CONFIG,

    getCurrentProfile,

    clearProfilePhoto,

    applyProfilePhoto,

    normalizeCampusRole,

    createProfileIdentity,

    populateStudentInformation,

    updateStudentInformationVisibility,

    updateAdminInformationVisibility,

    populateProfile,

    handleFullNameInput,

    validateFullName,

    handleMobileNumberInput,

    validateMobileNumber,

    hasProfileChanged,

    updateProfileInfo,

    handleProfileSubmit,

    getProfileUpdateErrorMessage,

    initializeCampusProfilePage

};
