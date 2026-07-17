/* =========================================================
   KPRIET FREELANCER PLATFORM
   Main Dashboard Logic
   File: js/dashboard.js
========================================================= */


import {

    requireSupabaseClient

} from "./config/supabase.js";


import {

    cleanText,

    getInitials,

    getFirstName,

    createNavbarRole,

    setText

} from "./utils/helpers.js";


import {

    ROUTES,

    navigateTo,

    replacePage

} from "./utils/navigation.js";


import {

    initializeAuthenticatedPage

} from "./auth/auth-guard.js";


import {

    logout

} from "./auth/logout.js";


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
   DASHBOARD WELCOME
--------------------------------------------------------- */

const dashboardUserFirstName =
    document.getElementById(
        "dashboardUserFirstName"
    );


/* ---------------------------------------------------------
   DASHBOARD CARDS
--------------------------------------------------------- */

const exploreFreelancersCard =
    document.getElementById(
        "exploreFreelancersCard"
    );


const freelancerSpaceCard =
    document.getElementById(
        "freelancerSpaceCard"
    );


const clientServicesCard =
    document.getElementById(
        "clientServicesCard"
    );


const campusProfileCard =
    document.getElementById(
        "campusProfileCard"
    );


const adminDashboardCard =
    document.getElementById(
        "adminDashboardCard"
    );


const logoutCard =
    document.getElementById(
        "logoutCard"
    );


/* ---------------------------------------------------------
   FREELANCER SPACE
--------------------------------------------------------- */

const freelancerSpaceDescription =
    document.getElementById(
        "freelancerSpaceDescription"
    );


const freelancerSpaceAction =
    document.getElementById(
        "freelancerSpaceAction"
    );


/* =========================================================
   DASHBOARD CONFIGURATION
========================================================= */

const DASHBOARD_CONFIG =
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

        `,


        FREELANCER_PROFILE_COLUMNS: `

            id,
            user_id,
            professional_title,
            bio,
            skills,
            services,
            availability_status,
            approval_status,
            rejection_reason,
            created_at,
            updated_at

        `

    });


/* =========================================================
   PAGE STATE
========================================================= */

let currentProfile = null;

let currentFreelancerProfile = null;

let logoutInProgress = false;

let eventListenersInitialized = false;


/* =========================================================
   GET CAMPUS PROFILE
========================================================= */

async function getCampusProfile(
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
            DASHBOARD_CONFIG
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
   GET FREELANCER PROFILE
========================================================= */

async function getFreelancerProfile(
    userId
) {

    const safeUserId =
        cleanText(
            userId
        );


    if (
        !safeUserId
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
            "freelancer_profiles"
        )

        .select(
            DASHBOARD_CONFIG
                .FREELANCER_PROFILE_COLUMNS
        )

        .eq(
            "user_id",
            safeUserId
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
   NORMALIZE APPROVAL STATUS
========================================================= */

function normalizeApprovalStatus(
    approvalStatus
) {

    return cleanText(
        approvalStatus
    ).toLowerCase();

}


/* =========================================================
   CHECK PROFILE COMPLETION
========================================================= */

function isCampusProfileComplete(
    profile
) {

    if (
        !profile
    ) {

        return false;

    }


    const fullName =
        cleanText(
            profile.full_name
        );


    const email =
        cleanText(
            profile.email
        );


    const mobileNumber =
        cleanText(
            profile.mobile_number
        );


    const campusRole =
        normalizeCampusRole(
            profile.campus_role
        );


    if (

        !fullName ||

        !email ||

        !mobileNumber ||

        !campusRole

    ) {

        return false;

    }


    const allowedCampusRoles =
        new Set([

            "student",

            "faculty",

            "staff"

        ]);


    if (
        !allowedCampusRoles.has(
            campusRole
        )
    ) {

        return false;

    }


    if (
        campusRole !==
        "student"
    ) {

        return true;

    }


    return Boolean(

        cleanText(
            profile.department
        )

        &&

        cleanText(
            profile.programme
        )

        &&

        cleanText(
            profile.academic_year
        )

        &&

        cleanText(
            profile.section
        )

        &&

        cleanText(
            profile.register_number
        )

    );

}


/* =========================================================
   CLEAR AVATAR PHOTO
========================================================= */

function clearAvatarPhoto() {

    if (
        !navbarUserAvatar
    ) {

        return;

    }


    navbarUserAvatar
        .style
        .backgroundImage =
        "";


    navbarUserAvatar
        .style
        .backgroundSize =
        "";


    navbarUserAvatar
        .style
        .backgroundPosition =
        "";


    navbarUserAvatar
        .style
        .backgroundRepeat =
        "";

}


/* =========================================================
   APPLY AVATAR PHOTO
========================================================= */

function applyAvatarPhoto(
    profilePhotoUrl
) {

    clearAvatarPhoto();


    const photoUrl =
        cleanText(
            profilePhotoUrl
        );


    if (
        !photoUrl ||
        !navbarUserAvatar
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


        navbarUserAvatar
            .style
            .backgroundImage =
            `url("${parsedUrl.href}")`;


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


    } catch (error) {

        console.warn(
            "Invalid dashboard profile photo URL:",
            error
        );

    }

}


/* =========================================================
   POPULATE DASHBOARD PROFILE
========================================================= */

function populateDashboardProfile(
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


    const initials =
        getInitials(
            fullName
        );


    const firstName =
        getFirstName(
            fullName
        );


    const navbarRole =
        createNavbarRole(
            profile
        );


    setText(
        navbarUserName,
        fullName
    );


    setText(

        navbarUserRole,

        navbarRole ||
        "KPRIET USER"

    );


    setText(
        navbarUserAvatar,
        initials
    );


    setText(

        dashboardUserFirstName,

        `${firstName}.`

    );


    applyAvatarPhoto(
        profile.profile_photo_url
    );

}


/* =========================================================
   UPDATE FREELANCER SPACE
========================================================= */

/* =========================================================
   UPDATE FREELANCER SPACE
========================================================= */

function updateFreelancerSpace() {

    const ACTION_LABEL = "Open Freelancer Space";

    if (
        !currentFreelancerProfile
    ) {

        setText(

            freelancerSpaceDescription,

            "Set up your freelancer profile to get started."

        );


        setText(

            freelancerSpaceAction,

            ACTION_LABEL

        );


        return;

    }


    const approvalStatus =
        normalizeApprovalStatus(

            currentFreelancerProfile
                .approval_status

        );


    if (
        approvalStatus ===
        "approved"
    ) {

        setText(

            freelancerSpaceDescription,

            "Manage your active freelance work."

        );

    } else if (
        approvalStatus ===
        "pending"
    ) {

        setText(

            freelancerSpaceDescription,

            "Your application is awaiting approval."

        );

    } else if (
        approvalStatus ===
        "rejected"
    ) {

        setText(

            freelancerSpaceDescription,

            "Your application needs review."

        );

    } else {

        setText(

            freelancerSpaceDescription,

            "Review your freelancer profile status."

        );

    }


    setText(

        freelancerSpaceAction,

        ACTION_LABEL

    );

}


/* =========================================================
   CHECK ADMINISTRATOR
========================================================= */

function isCurrentUserAdministrator() {

    return (
        currentProfile?.is_admin ===
        true
    );

}


/* =========================================================
   UPDATE ADMIN CARD
========================================================= */

function updateAdminCard() {

    if (
        !adminDashboardCard
    ) {

        return;

    }


    adminDashboardCard
        .classList
        .toggle(

            "hidden",

            !isCurrentUserAdministrator()

        );


    adminDashboardCard
        .setAttribute(

            "aria-hidden",

            String(
                !isCurrentUserAdministrator()
            )

        );

}


/* =========================================================
   OPEN EXPLORE FREELANCERS
========================================================= */

function openExploreFreelancers() {

    navigateTo(
        ROUTES.EXPLORE_FREELANCERS
    );

}


/* =========================================================
   OPEN FREELANCER SPACE
========================================================= */

function openFreelancerSpace() {

    if (
        !currentFreelancerProfile
    ) {

        navigateTo(
            ROUTES.FREELANCER_REGISTER
        );


        return;

    }


    const approvalStatus =
        normalizeApprovalStatus(

            currentFreelancerProfile
                .approval_status

        );


    if (
        approvalStatus ===
        "approved"
    ) {

        navigateTo(
            ROUTES.FREELANCER_DASHBOARD
        );


        return;

    }


    navigateTo(
        ROUTES.FREELANCER_REGISTER
    );

}


/* =========================================================
   OPEN CLIENT SERVICES
========================================================= */

function openClientServices() {

    navigateTo(
        ROUTES.CLIENT_DASHBOARD
    );

}


/* =========================================================
   OPEN CAMPUS PROFILE
========================================================= */

function openCampusProfile() {

    navigateTo(
        ROUTES.CAMPUS_PROFILE
    );

}


/* =========================================================
   OPEN ADMIN DASHBOARD
========================================================= */

function openAdminDashboard() {

    if (
        !isCurrentUserAdministrator()
    ) {

        console.warn(
            "Administrator access is required."
        );


        return;

    }


    navigateTo(
        ROUTES.ADMIN_DASHBOARD
    );

}


/* =========================================================
   SET LOGOUT CARD STATE
========================================================= */

function setLogoutCardState(
    isLoading
) {

    if (
        !logoutCard
    ) {

        return;

    }


    logoutCard.setAttribute(

        "aria-busy",

        String(
            Boolean(
                isLoading
            )
        )

    );


    logoutCard.classList.toggle(

        "is-loading",

        Boolean(
            isLoading
        )

    );


    if (
        isLoading
    ) {

        logoutCard.setAttribute(
            "aria-disabled",
            "true"
        );


        return;

    }


    logoutCard.removeAttribute(
        "aria-disabled"
    );

}


/* =========================================================
   LOGOUT USER
========================================================= */

async function logoutUser() {

    if (
        logoutInProgress
    ) {

        return false;

    }


    logoutInProgress =
        true;


    setLogoutCardState(
        true
    );


    try {

        const logoutSuccessful =
            await logout();


        if (
            !logoutSuccessful
        ) {

            throw new Error(
                "Dashboard logout failed."
            );

        }


        return true;


    } catch (error) {

        console.error(
            "Dashboard logout error:",
            error
        );


        return false;


    } finally {

        logoutInProgress =
            false;


        setLogoutCardState(
            false
        );

    }

}


/* =========================================================
   HANDLE CARD KEYBOARD
========================================================= */

function addCardInteraction(
    element,
    action
) {

    if (

        !element ||

        typeof action !==
            "function"

    ) {

        return;

    }


    element.addEventListener(

        "click",

        action

    );


    element.addEventListener(

        "keydown",

        (event) => {

            if (

                event.key !==
                    "Enter"

                &&

                event.key !==
                    " "

            ) {

                return;

            }


            event.preventDefault();


            action();

        }

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


    addCardInteraction(

        exploreFreelancersCard,

        openExploreFreelancers

    );


    addCardInteraction(

        freelancerSpaceCard,

        openFreelancerSpace

    );


    addCardInteraction(

        clientServicesCard,

        openClientServices

    );


    addCardInteraction(

        campusProfileCard,

        openCampusProfile

    );


    addCardInteraction(

        adminDashboardCard,

        openAdminDashboard

    );


    addCardInteraction(

        logoutCard,

        logoutUser

    );


    eventListenersInitialized =
        true;

}


/* =========================================================
   RESET DASHBOARD STATE
========================================================= */

function resetDashboardState() {

    currentProfile =
        null;


    currentFreelancerProfile =
        null;


    logoutInProgress =
        false;

}


/* =========================================================
   INITIALIZE DASHBOARD
========================================================= */

async function initializeDashboard(
    authenticatedUser
) {

    resetDashboardState();


    initializeEventListeners();


    try {

        currentProfile =
            await getCampusProfile(
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


        if (
            !isCampusProfileComplete(
                currentProfile
            )
        ) {

            replacePage(
                ROUTES.PROFILE_SETUP
            );


            return false;

        }


        currentFreelancerProfile =
            await getFreelancerProfile(
                currentProfile.id
            );


        populateDashboardProfile(
            currentProfile
        );


        updateFreelancerSpace();


        updateAdminCard();


        return true;


    } catch (error) {

        console.error(
            "Dashboard initialization error:",
            error
        );


        return false;

    }

}


/* =========================================================
   START DASHBOARD
========================================================= */

initializeAuthenticatedPage(
    initializeDashboard
);


/* =========================================================
   EXPORTS
========================================================= */

export {

    DASHBOARD_CONFIG,

    getCampusProfile,

    getFreelancerProfile,

    normalizeCampusRole,

    normalizeApprovalStatus,

    isCampusProfileComplete,

    clearAvatarPhoto,

    applyAvatarPhoto,

    populateDashboardProfile,

    updateFreelancerSpace,

    isCurrentUserAdministrator,

    updateAdminCard,

    openExploreFreelancers,

    openFreelancerSpace,

    openClientServices,

    openCampusProfile,

    openAdminDashboard,

    setLogoutCardState,

    logoutUser,

    addCardInteraction,

    initializeDashboard

};