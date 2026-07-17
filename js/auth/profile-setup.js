/* =========================================================
   KPRIET FREELANCER PLATFORM
   Campus Profile Setup Logic
   File: js/auth/profile-setup.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    requireAuthentication

} from "./auth-guard.js";


import {

    cleanText,

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


/* =========================================================
   DOM ELEMENTS
========================================================= */

const profileSetupForm =
    document.getElementById(
        "profileSetupForm"
    );


const fullNameInput =
    document.getElementById(
        "fullName"
    );


const departmentInput =
    document.getElementById(
        "department"
    );


const yearOfStudyInput =
    document.getElementById(
        "yearOfStudy"
    );


const sectionInput =
    document.getElementById(
        "section"
    );


const fullNameField =
    document.getElementById(
        "fullNameField"
    );


const departmentField =
    document.getElementById(
        "departmentField"
    );


const yearOfStudyField =
    document.getElementById(
        "yearOfStudyField"
    );


const sectionField =
    document.getElementById(
        "sectionField"
    );


const profileSetupButton =
    document.getElementById(
        "profileSetupButton"
    );


const profileSetupMessage =
    document.getElementById(
        "profileSetupMessage"
    );


/* =========================================================
   PROFILE SETUP CONFIGURATION
========================================================= */

const PROFILE_SETUP_CONFIG = Object.freeze({

    PROFILE_COLUMNS: [

        "id",

        "full_name",

        "email",

        "department",

        "year_of_study",

        "section",

        "role",

        "freelancer_status"

    ].join(","),

    MINIMUM_NAME_LENGTH: 3

});


/* =========================================================
   PAGE STATE
========================================================= */

let authenticatedUser = null;

let currentProfile = null;

let profileUpdateInProgress = false;


/* =========================================================
   GET CURRENT PROFILE
========================================================= */

async function getCurrentProfile(
    userId
) {

    if (!userId) {

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
            PROFILE_SETUP_CONFIG
                .PROFILE_COLUMNS
        )

        .eq(
            "id",
            userId
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    return data;

}


/* =========================================================
   CHECK PROFILE COMPLETION
========================================================= */

function isProfileComplete(
    profile
) {

    if (!profile) {

        return false;

    }


    return Boolean(

        cleanText(
            profile.full_name
        )

        &&

        cleanText(
            profile.department
        )

        &&

        cleanText(
            profile.year_of_study
        )

        &&

        cleanText(
            profile.section
        )

    );

}


/* =========================================================
   VALIDATE FULL NAME
========================================================= */

function validateFullName() {

    const fullName =
        cleanText(
            fullNameInput?.value
        );


    if (!fullName) {

        setFieldError(

            fullNameField,

            "Full name is required."

        );


        return false;

    }


    if (

        fullName.length <
        PROFILE_SETUP_CONFIG
            .MINIMUM_NAME_LENGTH

    ) {

        setFieldError(

            fullNameField,

            "Enter your complete name."

        );


        return false;

    }


    clearFieldError(
        fullNameField
    );


    return true;

}


/* =========================================================
   VALIDATE DEPARTMENT
========================================================= */

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
   VALIDATE YEAR OF STUDY
========================================================= */

function validateYearOfStudy() {

    const yearOfStudy =
        cleanText(
            yearOfStudyInput?.value
        );


    if (!yearOfStudy) {

        setFieldError(

            yearOfStudyField,

            "Select your year of study."

        );


        return false;

    }


    clearFieldError(
        yearOfStudyField
    );


    return true;

}


/* =========================================================
   VALIDATE SECTION
========================================================= */

function validateSection() {

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


/* =========================================================
   VALIDATE PROFILE SETUP FORM
========================================================= */

function validateProfileSetupForm() {

    const fullNameValid =
        validateFullName();


    const departmentValid =
        validateDepartment();


    const yearOfStudyValid =
        validateYearOfStudy();


    const sectionValid =
        validateSection();


    return (

        fullNameValid &&

        departmentValid &&

        yearOfStudyValid &&

        sectionValid

    );

}


/* =========================================================
   POPULATE PROFILE FORM
========================================================= */

function populateProfileForm(
    profile
) {

    if (!profile) {

        return;

    }


    if (fullNameInput) {

        fullNameInput.value =
            cleanText(
                profile.full_name
            );

    }


    if (departmentInput) {

        departmentInput.value =
            cleanText(
                profile.department
            );

    }


    if (yearOfStudyInput) {

        yearOfStudyInput.value =
            cleanText(
                profile.year_of_study
            );

    }


    if (sectionInput) {

        sectionInput.value =
            cleanText(
                profile.section
            );

    }

}


/* =========================================================
   UPDATE PROFILE
========================================================= */

async function updateProfile(
    userId,
    profileData
) {

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
                profileData.fullName,

            department:
                profileData.department,

            year_of_study:
                profileData.yearOfStudy,

            section:
                profileData.section

        })

        .eq(
            "id",
            userId
        )

        .select(
            PROFILE_SETUP_CONFIG
                .PROFILE_COLUMNS
        )

        .single();


    if (error) {

        throw error;

    }


    return data;

}


/* =========================================================
   REDIRECT AFTER PROFILE SETUP
========================================================= */

function redirectAfterProfileSetup(
    profile
) {

    if (
        profile?.role === "admin"
    ) {

        replacePage(
            ROUTES.ADMIN_DASHBOARD
        );


        return;

    }


    replacePage(
        ROUTES.MAIN_DASHBOARD
    );

}


/* =========================================================
   PROFILE SETUP SUBMISSION
========================================================= */

async function handleProfileSetupSubmit(
    event
) {

    event.preventDefault();


    if (
        profileUpdateInProgress
    ) {

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

            "Check the highlighted fields and complete your campus profile.",

            "error"

        );


        return;

    }


    if (
        !authenticatedUser?.id
    ) {

        showFormMessage(

            profileSetupMessage,

            "Your authenticated session is unavailable. Sign in again.",

            "error"

        );


        return;

    }


    const profileData = {

        fullName:
            cleanText(
                fullNameInput.value
            ),

        department:
            cleanText(
                departmentInput.value
            ),

        yearOfStudy:
            cleanText(
                yearOfStudyInput.value
            ),

        section:
            cleanText(
                sectionInput.value
            )

    };


    profileUpdateInProgress = true;


    setButtonLoading(

        profileSetupButton,

        true

    );


    try {

        const updatedProfile =
            await updateProfile(

                authenticatedUser.id,

                profileData

            );


        currentProfile =
            updatedProfile;


        showFormMessage(

            profileSetupMessage,

            "Campus profile completed successfully.",

            "success"

        );


        redirectAfterProfileSetup(
            updatedProfile
        );


    } catch (error) {

        console.error(
            "Profile setup error:",
            error
        );


        showFormMessage(

            profileSetupMessage,

            getProfileSetupErrorMessage(
                error
            ),

            "error"

        );


    } finally {

        profileUpdateInProgress = false;


        setButtonLoading(

            profileSetupButton,

            false

        );

    }

}


/* =========================================================
   PROFILE SETUP ERROR MESSAGE
========================================================= */

function getProfileSetupErrorMessage(
    error
) {

    const message =
        String(
            error?.message ?? ""
        ).toLowerCase();


    if (

        message.includes(
            "row-level security"
        )

        ||

        message.includes(
            "policy"
        )

    ) {

        return "You are not allowed to update this campus profile.";

    }


    if (

        message.includes(
            "jwt"
        )

        ||

        message.includes(
            "session"
        )

    ) {

        return "Your session has expired. Sign in again.";

    }


    if (

        message.includes(
            "failed to fetch"
        )

        ||

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


    return "Unable to complete your campus profile. Please try again.";

}


/* =========================================================
   HANDLE FIELD INPUT
========================================================= */

function handleFieldInput(
    field,
    validator
) {

    if (
        field?.classList.contains(
            "has-error"
        )
    ) {

        validator();

    }


    hideFormMessage(
        profileSetupMessage
    );

}


/* =========================================================
   INITIALIZE LIVE VALIDATION
========================================================= */

function initializeLiveValidation() {

    fullNameInput?.addEventListener(

        "blur",

        validateFullName

    );


    departmentInput?.addEventListener(

        "change",

        validateDepartment

    );


    yearOfStudyInput?.addEventListener(

        "change",

        validateYearOfStudy

    );


    sectionInput?.addEventListener(

        "change",

        validateSection

    );


    fullNameInput?.addEventListener(

        "input",

        () => {

            handleFieldInput(

                fullNameField,

                validateFullName

            );

        }

    );


    departmentInput?.addEventListener(

        "change",

        () => {

            handleFieldInput(

                departmentField,

                validateDepartment

            );

        }

    );


    yearOfStudyInput?.addEventListener(

        "change",

        () => {

            handleFieldInput(

                yearOfStudyField,

                validateYearOfStudy

            );

        }

    );


    sectionInput?.addEventListener(

        "change",

        () => {

            handleFieldInput(

                sectionField,

                validateSection

            );

        }

    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    profileSetupForm?.addEventListener(

        "submit",

        handleProfileSetupSubmit

    );

}


/* =========================================================
   PROFILE SETUP PAGE INITIALIZATION
========================================================= */

async function initializeProfileSetupPage() {

    if (

        !profileSetupForm ||

        !fullNameInput ||

        !departmentInput ||

        !yearOfStudyInput ||

        !sectionInput

    ) {

        console.error(
            "Profile setup page elements are unavailable."
        );


        return;

    }


    try {

        authenticatedUser =
            await requireAuthentication();


        if (!authenticatedUser) {

            return;

        }


        currentProfile =
            await getCurrentProfile(
                authenticatedUser.id
            );


        if (!currentProfile) {

            throw new Error(
                "Campus profile record is unavailable."
            );

        }


        /*
           Administrators do not need campus profile setup.
        */

        if (
            currentProfile.role === "admin"
        ) {

            replacePage(
                ROUTES.ADMIN_DASHBOARD
            );


            return;

        }


        /*
           If profile setup is already complete,
           prevent the user from reopening this page.
        */

        if (
            isProfileComplete(
                currentProfile
            )
        ) {

            replacePage(
                ROUTES.MAIN_DASHBOARD
            );


            return;

        }


        populateProfileForm(
            currentProfile
        );


        initializeEventListeners();

        initializeLiveValidation();


    } catch (error) {

        console.error(
            "Profile setup initialization error:",
            error
        );


        showFormMessage(

            profileSetupMessage,

            getProfileSetupErrorMessage(
                error
            ),

            "error"

        );

    }

}


/* =========================================================
   START PAGE
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    initializeProfileSetupPage

);