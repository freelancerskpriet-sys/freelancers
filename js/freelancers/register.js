/* =========================================================
   KPRIET FREELANCER PLATFORM
   Freelancer Registration + Dashboard Logic
   File: js/freelancers/register.js

   This page now handles three states for the signed-in
   campus user, resolved once on load:

     1. No freelancer profile yet  -> registration form
     2. Profile pending / rejected -> status panel
     3. Profile approved           -> full freelancer
                                       dashboard (profile
                                       overview, availability
                                       toggle, stats, recent
                                       requests)
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    cleanText,

    getInitials,

    createNavbarRole,

    setText,

    showElement,

    hideElement

} from "../utils/helpers.js";


import {

    ROUTES,

    navigateTo

} from "../utils/navigation.js";


import {

    initializeAuthenticatedPage

} from "../auth/auth-guard.js";


/* =========================================================
   PAGE CONFIGURATION
========================================================= */

const FREELANCER_PAGE_CONFIG =
    Object.freeze({

        MAX_SKILLS:
            10,

        MAX_SERVICES:
            5,

        MIN_TITLE_LENGTH:
            3,

        MAX_TITLE_LENGTH:
            80,

        MIN_BIO_LENGTH:
            30,

        MAX_BIO_LENGTH:
            500,

        MAX_SKILL_LENGTH:
            40,

        MAX_SERVICE_TITLE_LENGTH:
            80,

        MAX_SERVICE_DESCRIPTION_LENGTH:
            250,

        RECENT_REQUEST_LIMIT:
            5,


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


        FREELANCER_COLUMNS: `

            id,
            user_id,
            professional_title,
            service_category,
            bio,
            skills,
            services,
            availability_status,
            approval_status,
            rejection_reason,
            created_at,
            updated_at

        `,


        REQUEST_COLUMNS: `
            id,
            status,
            created_at,
            service_requests (
    id,
    client_id,
    title,
    service_category,
    description,
    budget,
    deadline,
    status,
    profiles!service_requests_client_id_fkey (
        full_name
    )
)
        `

    });


/* =========================================================
   HEADER CONTENT PER PAGE MODE
========================================================= */

const PAGE_HEADER_CONTENT =
    Object.freeze({

        registration: {

            label:
                "05 · FREELANCER REGISTRATION",

            titleHtml:
                `Turn your skills into<br><span class="highlight">campus services.</span>`,

            description:
                "Build your professional freelancer profile and offer your expertise through the KPRIET campus network."

        },

        status: {

            label:
                "FREELANCER STATUS",

            titleHtml:
                `Your freelancer <span class="highlight">profile status.</span>`,

            description:
                "Track the review status of your freelancer profile below."

        },

        dashboard: {

            label:
                "FREELANCER DASHBOARD",

            titleHtml:
                `Manage your <span class="highlight">freelance work.</span>`,

            description:
                "Review incoming requests, manage active work and keep your freelancer availability updated."

        }

    });


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
   PAGE HEADER
--------------------------------------------------------- */

const pageHeaderLabel =
    document.getElementById(
        "pageHeaderLabel"
    );


const pageHeaderTitle =
    document.getElementById(
        "pageHeaderTitle"
    );


const pageHeaderDescription =
    document.getElementById(
        "pageHeaderDescription"
    );


const mainDashboardButton =
    document.getElementById(
        "mainDashboardButton"
    );


/* ---------------------------------------------------------
   NAVIGATION (registration form)
--------------------------------------------------------- */

const cancelRegistrationButton =
    document.getElementById(
        "cancelRegistrationButton"
    );


const existingStateDashboardButton =
    document.getElementById(
        "existingStateDashboardButton"
    );


/* ---------------------------------------------------------
   PAGE STATES
--------------------------------------------------------- */

const freelancerPageLoadingState =
    document.getElementById(
        "freelancerPageLoadingState"
    );


const existingFreelancerState =
    document.getElementById(
        "existingFreelancerState"
    );


const existingFreelancerTitle =
    document.getElementById(
        "existingFreelancerTitle"
    );


const existingFreelancerMessage =
    document.getElementById(
        "existingFreelancerMessage"
    );


const freelancerDashboardState =
    document.getElementById(
        "freelancerDashboardState"
    );


const freelancerRegistrationContent =
    document.getElementById(
        "freelancerRegistrationContent"
    );


/* ---------------------------------------------------------
   REGISTRATION FORM
--------------------------------------------------------- */

const freelancerRegistrationForm =
    document.getElementById(
        "freelancerRegistrationForm"
    );


const professionalTitle =
    document.getElementById(
        "professionalTitle"
    );


const serviceCategory =
    document.getElementById(
        "serviceCategory"
    );


const professionalBio =
    document.getElementById(
        "professionalBio"
    );


const availabilityStatus =
    document.getElementById(
        "availabilityStatus"
    );


/* ---------------------------------------------------------
   CHARACTER COUNTERS
--------------------------------------------------------- */

const professionalTitleCount =
    document.getElementById(
        "professionalTitleCount"
    );


const professionalBioCount =
    document.getElementById(
        "professionalBioCount"
    );


/* ---------------------------------------------------------
   SKILLS
--------------------------------------------------------- */

const skillInput =
    document.getElementById(
        "skillInput"
    );


const addSkillButton =
    document.getElementById(
        "addSkillButton"
    );


const skillTagList =
    document.getElementById(
        "skillTagList"
    );


/* ---------------------------------------------------------
   SERVICES
--------------------------------------------------------- */

const serviceTitleInput =
    document.getElementById(
        "serviceTitleInput"
    );


const serviceDescriptionInput =
    document.getElementById(
        "serviceDescriptionInput"
    );


const addServiceButton =
    document.getElementById(
        "addServiceButton"
    );


const serviceList =
    document.getElementById(
        "serviceList"
    );


/* ---------------------------------------------------------
   ERRORS
--------------------------------------------------------- */

const professionalTitleError =
    document.getElementById(
        "professionalTitleError"
    );


const serviceCategoryError =
    document.getElementById(
        "serviceCategoryError"
    );


const professionalBioError =
    document.getElementById(
        "professionalBioError"
    );


const skillsError =
    document.getElementById(
        "skillsError"
    );


const servicesError =
    document.getElementById(
        "servicesError"
    );


const availabilityStatusError =
    document.getElementById(
        "availabilityStatusError"
    );


/* ---------------------------------------------------------
   FORM MESSAGE
--------------------------------------------------------- */

const registrationFormMessage =
    document.getElementById(
        "registrationFormMessage"
    );


/* ---------------------------------------------------------
   SUBMIT BUTTON
--------------------------------------------------------- */

const submitFreelancerButton =
    document.getElementById(
        "submitFreelancerButton"
    );


const submitFreelancerButtonText =
    document.getElementById(
        "submitFreelancerButtonText"
    );


/* ---------------------------------------------------------
   FREELANCER DASHBOARD (approved freelancers)
--------------------------------------------------------- */

const freelancerDashboardAvatar =
    document.getElementById(
        "freelancerDashboardAvatar"
    );


const freelancerDashboardName =
    document.getElementById(
        "freelancerDashboardName"
    );


const freelancerDashboardTitle =
    document.getElementById(
        "freelancerDashboardTitle"
    );


const freelancerDashboardCampus =
    document.getElementById(
        "freelancerDashboardCampus"
    );


const availabilityControlTitle =
    document.getElementById(
        "availabilityControlTitle"
    );


const availabilityToggleButton =
    document.getElementById(
        "availabilityToggleButton"
    );


const availabilityUpdateMessage =
    document.getElementById(
        "availabilityUpdateMessage"
    );


const pendingRequestsCount =
    document.getElementById(
        "pendingRequestsCount"
    );


const activeWorksCount =
    document.getElementById(
        "activeWorksCount"
    );


const completedWorksCount =
    document.getElementById(
        "completedWorksCount"
    );


const totalRequestsCount =
    document.getElementById(
        "totalRequestsCount"
    );


const recentRequestsList =
    document.getElementById(
        "recentRequestsList"
    );


const recentRequestsEmptyState =
    document.getElementById(
        "recentRequestsEmptyState"
    );


const viewAllRequestsButton =
    document.getElementById(
        "viewAllRequestsButton"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentFreelancerProfile = null;

let currentRequests = [];

let skills = [];

let services = [];

let submissionInProgress = false;

let availabilityUpdateInProgress = false;


/* =========================================================
   PAGE HEADER
========================================================= */

function setPageHeaderMode(
    mode
) {

    const content =
        PAGE_HEADER_CONTENT[
            mode
        ]

        ||

        PAGE_HEADER_CONTENT
            .registration;


    setText(

        pageHeaderLabel,

        content.label

    );


    if (
        pageHeaderTitle
    ) {

        pageHeaderTitle.innerHTML =
            content.titleHtml;

    }


    setText(

        pageHeaderDescription,

        content.description

    );

}


/* =========================================================
   GET CURRENT USER PROFILE
========================================================= */

async function getCurrentUserProfile(
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
            FREELANCER_PAGE_CONFIG
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
   NORMALIZE FREELANCER PROFILE
========================================================= */

function normalizeFreelancerProfile(
    freelancerProfile
) {

    if (
        !freelancerProfile
    ) {

        return null;

    }


    return {

        id:
            cleanText(
                freelancerProfile.id
            ),

        userId:
            cleanText(
                freelancerProfile.user_id
            ),

        professionalTitle:
            cleanText(
                freelancerProfile
                    .professional_title
            ),

        serviceCategory:
            cleanText(
                freelancerProfile
                    .service_category
            ),

        bio:
            cleanText(
                freelancerProfile.bio
            ),

        skills:
            Array.isArray(
                freelancerProfile.skills
            )
                ? freelancerProfile.skills
                : [],

        services:
            Array.isArray(
                freelancerProfile.services
            )
                ? freelancerProfile.services
                : [],

        availabilityStatus:
            normalizeAvailability(
                freelancerProfile
                    .availability_status
            ),

        approvalStatus:
            cleanText(
                freelancerProfile
                    .approval_status
            ).toLowerCase(),

        rejectionReason:
            cleanText(
                freelancerProfile
                    .rejection_reason
            ),

        createdAt:
            freelancerProfile.created_at ??
            null,

        updatedAt:
            freelancerProfile.updated_at ??
            null

    };

}


/* =========================================================
   CHECK EXISTING FREELANCER PROFILE
========================================================= */

async function getExistingFreelancerProfile(
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
            FREELANCER_PAGE_CONFIG
                .FREELANCER_COLUMNS
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


    return normalizeFreelancerProfile(
        data
    );

}


/* =========================================================
   APPLY BACKGROUND PHOTO (shared by navbar + dashboard avatars)
========================================================= */

function applyBackgroundPhoto(
    element,
    profilePhotoUrl
) {

    if (
        !element
    ) {

        return;

    }


    const photoUrl =
        cleanText(
            profilePhotoUrl
        );


    element.style.backgroundImage =
        "";


    element.style.backgroundSize =
        "";


    element.style.backgroundPosition =
        "";


    element.style.backgroundRepeat =
        "";


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


        element.style.backgroundImage =
            `url("${parsedUrl.href}")`;


        element.style.backgroundSize =
            "cover";


        element.style.backgroundPosition =
            "center";


        element.style.backgroundRepeat =
            "no-repeat";


        element.textContent =
            "";


    } catch (error) {

        console.warn(
            "Invalid profile photo URL:",
            error
        );

    }

}


/* =========================================================
   POPULATE NAVBAR
========================================================= */

function populateNavbar(
    user
) {

    if (
        !user
    ) {

        return;

    }


    const fullName =
        cleanText(
            user.full_name
        ) ||
        "User";


    setText(

        navbarUserName,

        fullName

    );


    setText(

        navbarUserRole,

        createNavbarRole(
            user
        ) ||
        "KPRIET USER"

    );


    setText(

        navbarUserAvatar,

        getInitials(
            fullName
        )

    );


    applyBackgroundPhoto(

        navbarUserAvatar,

        user.profile_photo_url

    );

}


/* =========================================================
   CREATE CAMPUS INFORMATION (for dashboard overview)
========================================================= */

function createCampusInformation(
    user
) {

    if (
        !user
    ) {

        return "KPRIET";

    }


    const information = [

        cleanText(
            user.department
        ),

        user.academic_year
            ? `Year ${cleanText(
                user.academic_year
            )}`
            : "",

        user.section
            ? `Section ${cleanText(
                user.section
            )}`
            : ""

    ].filter(
        Boolean
    );


    return (

        information.join(
            " · "
        )

        ||

        "KPRIET"

    );

}


/* =========================================================
   POPULATE FREELANCER DASHBOARD OVERVIEW
========================================================= */

function populateFreelancerOverview(
    user,
    freelancerProfile
) {

    if (

        !user ||

        !freelancerProfile

    ) {

        return;

    }


    const fullName =
        cleanText(
            user.full_name
        ) ||
        "Freelancer";


    setText(

        freelancerDashboardAvatar,

        getInitials(
            fullName
        )

    );


    applyBackgroundPhoto(

        freelancerDashboardAvatar,

        user.profile_photo_url

    );


    setText(

        freelancerDashboardName,

        fullName

    );


    setText(

        freelancerDashboardTitle,

        freelancerProfile
            .professionalTitle

        ||

        "Campus Freelancer"

    );


    setText(

        freelancerDashboardCampus,

        createCampusInformation(
            user
        )

    );

}


/* =========================================================
   NORMALIZE AVAILABILITY
========================================================= */

function normalizeAvailability(
    availabilityStatusValue
) {

    const availability =
        cleanText(
            availabilityStatusValue
        ).toLowerCase();


    return availability ===
        "available"

        ? "available"

        : "busy";

}


/* =========================================================
   RENDER AVAILABILITY CONTROL
========================================================= */

function renderAvailabilityControl() {

    if (
        !currentFreelancerProfile
    ) {

        return;

    }


    const availability =
        normalizeAvailability(
            currentFreelancerProfile
                .availabilityStatus
        );


    const isAvailable =
        availability ===
        "available";


    availabilityToggleButton
        ?.classList
        .toggle(
            "active",
            isAvailable
        );


    availabilityToggleButton
        ?.setAttribute(
            "aria-checked",
            String(
                isAvailable
            )
        );


    setText(

        availabilityControlTitle,

        isAvailable

            ? "Available for new work"

            : "Currently busy"

    );

}


/* =========================================================
   UPDATE AVAILABILITY STATUS
========================================================= */

async function updateAvailabilityStatus(
    freelancerId,
    availabilityStatusValue
) {

    const safeFreelancerId =
        cleanText(
            freelancerId
        );


    const safeAvailabilityStatus =
        normalizeAvailability(
            availabilityStatusValue
        );


    if (
        !safeFreelancerId
    ) {

        throw new Error(
            "Invalid freelancer identifier."
        );

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

        .update({

            availability_status:
                safeAvailabilityStatus,

            updated_at:
                new Date()
                    .toISOString()

        })

        .eq(
            "id",
            safeFreelancerId
        )

        .eq(
            "user_id",
            currentUser.id
        )

        .eq(
            "approval_status",
            "approved"
        )

        .select(
            `

                availability_status,
                updated_at

            `
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
            "The freelancer availability could not be updated."
        );

    }


    return {

        availabilityStatus:
            normalizeAvailability(
                data.availability_status
            ),

        updatedAt:
            data.updated_at ??
            null

    };

}


/* =========================================================
   HANDLE AVAILABILITY TOGGLE
========================================================= */

async function handleAvailabilityToggle() {

    if (

        !currentFreelancerProfile ||

        availabilityUpdateInProgress

    ) {

        return;

    }


    const currentAvailability =
        normalizeAvailability(
            currentFreelancerProfile
                .availabilityStatus
        );


    const nextAvailability =

        currentAvailability ===
        "available"

            ? "busy"

            : "available";


    availabilityUpdateInProgress =
        true;


    if (
        availabilityToggleButton
    ) {

        availabilityToggleButton.disabled =
            true;

    }


    setText(

        availabilityUpdateMessage,

        "Updating availability..."

    );


    try {

        const updatedProfile =
            await updateAvailabilityStatus(

                currentFreelancerProfile.id,

                nextAvailability

            );


        currentFreelancerProfile = {

            ...currentFreelancerProfile,

            availabilityStatus:
                updatedProfile
                    .availabilityStatus,

            updatedAt:
                updatedProfile
                    .updatedAt

        };


        renderAvailabilityControl();


        setText(

            availabilityUpdateMessage,

            updatedProfile
                .availabilityStatus ===
                "available"

                ? "You are now available for new service requests."

                : "New service requests are currently paused."

        );


    } catch (error) {

        console.error(
            "Availability update error:",
            error
        );


        setText(

            availabilityUpdateMessage,

            "Unable to update availability. Please try again."

        );


    } finally {

        availabilityUpdateInProgress =
            false;


        if (
            availabilityToggleButton
        ) {

            availabilityToggleButton.disabled =
                false;

        }

    }

}


/* =========================================================
   NORMALIZE REQUEST STATUS
========================================================= */

function normalizeRequestStatus(
    requestStatus
) {

    const normalizedStatus =
        cleanText(
            requestStatus
        )

            .toLowerCase()

            .replace(
                /[\s-]+/g,
                "_"
            );


    const statusMap = {

        pending:
            "under_review",

        submitted:
            "under_review",

        under_review:
            "under_review",

        approved:
            "matching",

        waiting:
            "matching",

        waiting_for_match:
            "matching",

        freelancer_matching:
            "matching",

        matching:
            "matching",

        matched:
            "assigned",

        assigned:
            "assigned",

        freelancer_assigned:
            "assigned",

        active:
            "active",

        active_work:
            "active",

        in_progress:
            "active",

        completed:
            "completed",

        rejected:
            "rejected",

        cancelled:
            "cancelled"

    };


    return (

        statusMap[
            normalizedStatus
        ]

        ||

        normalizedStatus

    );

}


/* =========================================================
   NORMALIZE FREELANCER REQUEST
========================================================= */

function normalizeFreelancerRequest(
    assignment
) {

    if (
        !assignment
    ) {

        return null;

    }

    const request = assignment.service_requests ?? {};
    const clientProfile = request.profiles ?? {};


    return {

        id:
            cleanText(
                assignment.id
            ),

        clientId:
            cleanText(
                request.client_id
            ),

        clientName:
            cleanText(
                clientProfile.full_name
            ) ||
            "Campus User",

        title:
            cleanText(
                request.title
            ) ||
            "Service Request",

        status:
            normalizeRequestStatus(
                request.status
            ),

        assignmentStatus:
            cleanText(
                assignment.status
            ).toLowerCase(),

        createdAt:
            assignment.created_at ??
            null

    };

}


/* =========================================================
   GET FREELANCER REQUESTS
========================================================= */

async function getFreelancerRequests(
    freelancerUserId
) {

    const safeFreelancerUserId =
        cleanText(
            freelancerUserId
        );


    if (
        !safeFreelancerUserId
    ) {

        return [];

    }


    const client =
        requireSupabaseClient();


    const {

        data,

        error

    } = await client

        .from(
            "service_assignments"
        )

        .select(
            FREELANCER_PAGE_CONFIG
                .REQUEST_COLUMNS
        )

        .eq(
            "freelancer_id",
            safeFreelancerUserId
        )

        .order(
            "created_at",
            {

                ascending:
                    false

            }
        );


    if (
        error
    ) {

        throw error;

    }


    return (

        data ?? []

    )

        .map(
            normalizeFreelancerRequest
        )

        .filter(
            Boolean
        );

}


/* =========================================================
   CALCULATE DASHBOARD STATISTICS
========================================================= */

function calculateDashboardStatistics(
    requests
) {

    const safeRequests =
        Array.isArray(
            requests
        )

            ? requests

            : [];


    const pendingRequests =
        safeRequests.filter(
            (request) => {

                return (
                    request.assignmentStatus === "pending"
                );

            }
        ).length;


    const activeWorks =
        safeRequests.filter(
            (request) => {

                return (
                    request.assignmentStatus === "accepted" ||
                    request.assignmentStatus === "in_progress"
                );

            }
        ).length;


    const completedWorks =
        safeRequests.filter(
            (request) => {

                return (
                    request.assignmentStatus === "completed"
                );

            }
        ).length;


    return {

        pendingRequests,

        activeWorks,

        completedWorks,

        totalRequests:
            safeRequests.length

    };

}


/* =========================================================
   RENDER STATISTICS
========================================================= */

function renderStatistics() {

    const statistics =
        calculateDashboardStatistics(
            currentRequests
        );


    setText(

        pendingRequestsCount,

        String(
            statistics.pendingRequests
        )

    );


    setText(

        activeWorksCount,

        String(
            statistics.activeWorks
        )

    );


    setText(

        completedWorksCount,

        String(
            statistics.completedWorks
        )

    );


    setText(

        totalRequestsCount,

        String(
            statistics.totalRequests
        )

    );

}


/* =========================================================
   FORMAT REQUEST DATE
========================================================= */

function formatRequestDate(
    dateValue
) {

    if (
        !dateValue
    ) {

        return "Date unavailable";

    }


    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "Date unavailable";

    }


    return new Intl.DateTimeFormat(

        "en-IN",

        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }

    ).format(
        date
    );

}


/* =========================================================
   FORMAT REQUEST STATUS
========================================================= */

function formatRequestStatus(
    requestStatus
) {

    const status =
        normalizeRequestStatus(
            requestStatus
        );


    const statusLabels = {

        under_review:
            "Under Review",

        matching:
            "Matching",

        assigned:
            "Assigned",

        active:
            "In Progress",

        completed:
            "Completed",

        rejected:
            "Rejected",

        cancelled:
            "Cancelled"

    };


    return (

        statusLabels[
            status
        ]

        ||

        "Request"

    );

}


/* =========================================================
   SORT REQUESTS BY DATE
========================================================= */

function sortRequestsByDate(
    requests
) {

    const safeRequests =
        Array.isArray(
            requests
        )

            ? requests

            : [];


    return [

        ...safeRequests

    ].sort(
        (
            firstRequest,
            secondRequest
        ) => {

            const firstDate =
                new Date(
                    firstRequest.createdAt
                ).getTime();


            const secondDate =
                new Date(
                    secondRequest.createdAt
                ).getTime();


            const safeFirstDate =
                Number.isNaN(
                    firstDate
                )

                    ? 0

                    : firstDate;


            const safeSecondDate =
                Number.isNaN(
                    secondDate
                )

                    ? 0

                    : secondDate;


            return (
                safeSecondDate -
                safeFirstDate
            );

        }
    );

}


/* =========================================================
   OPEN REQUEST
========================================================= */

function openRequest(
    requestId
) {

    const safeRequestId =
        cleanText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        console.warn(
            "Service request identifier is unavailable."
        );


        return;

    }


    navigateTo(

        ROUTES.FREELANCER_REQUESTS,

        {

            request:
                safeRequestId

        }

    );

}


/* =========================================================
   CREATE RECENT REQUEST ITEM
========================================================= */

function createRecentRequestItem(
    request
) {

    const requestItem =
        document.createElement(
            "article"
        );


    requestItem.className =
        "freelancer-dashboard-request-item";


    requestItem.tabIndex =
        0;


    requestItem.setAttribute(
        "role",
        "button"
    );


    requestItem.setAttribute(

        "aria-label",

        `Open ${
            request.title ||
            "service request"
        }`

    );


    const content =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "freelancer-dashboard-request-title";


    title.textContent =
        request.title ||
        "Service Request";


    const meta =
        document.createElement(
            "p"
        );


    meta.className =
        "freelancer-dashboard-request-meta";


    meta.textContent =

        `${request.clientName} · ${formatRequestDate(
            request.createdAt
        )}`;


    content.append(

        title,

        meta

    );


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "freelancer-dashboard-request-status";


    status.textContent =
        formatRequestStatus(
            request.status
        );


    const arrow =
        document.createElementNS(

            "http://www.w3.org/2000/svg",

            "svg"

        );


    arrow.setAttribute(
        "viewBox",
        "0 0 24 24"
    );


    arrow.setAttribute(
        "aria-hidden",
        "true"
    );


    const arrowLine =
        document.createElementNS(

            "http://www.w3.org/2000/svg",

            "path"

        );


    arrowLine.setAttribute(
        "d",
        "M5 12h14"
    );


    const arrowHead =
        document.createElementNS(

            "http://www.w3.org/2000/svg",

            "path"

        );


    arrowHead.setAttribute(
        "d",
        "M13 6l6 6-6 6"
    );


    arrow.append(

        arrowLine,

        arrowHead

    );


    requestItem.append(

        content,

        status,

        arrow

    );


    const openCurrentRequest =
        () => {

            openRequest(
                request.id
            );

        };


    requestItem.addEventListener(

        "click",

        openCurrentRequest

    );


    requestItem.addEventListener(

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


            openCurrentRequest();

        }

    );


    return requestItem;

}


/* =========================================================
   RENDER RECENT REQUESTS
========================================================= */

function renderRecentRequests() {

    if (

        !recentRequestsList ||

        !recentRequestsEmptyState

    ) {

        return;

    }


    recentRequestsList
        .replaceChildren();


    const recentRequests =
        sortRequestsByDate(
            currentRequests
        )

            .slice(

                0,

                FREELANCER_PAGE_CONFIG
                    .RECENT_REQUEST_LIMIT

            );


    if (
        recentRequests.length ===
        0
    ) {

        hideElement(
            recentRequestsList
        );


        showElement(
            recentRequestsEmptyState
        );


        return;

    }


    hideElement(
        recentRequestsEmptyState
    );


    showElement(
        recentRequestsList
    );


    const fragment =
        document.createDocumentFragment();


    recentRequests.forEach(
        (request) => {

            fragment.appendChild(

                createRecentRequestItem(
                    request
                )

            );

        }
    );


    recentRequestsList.appendChild(
        fragment
    );

}


/* =========================================================
   UPDATE CHARACTER COUNTERS (registration form)
========================================================= */

function updateProfessionalTitleCount() {

    const length =
        professionalTitle
            ?.value
            .length ??
        0;


    setText(

        professionalTitleCount,

        `${length} / ${FREELANCER_PAGE_CONFIG.MAX_TITLE_LENGTH}`

    );

}


function updateProfessionalBioCount() {

    const length =
        professionalBio
            ?.value
            .length ??
        0;


    setText(

        professionalBioCount,

        `${length} / ${FREELANCER_PAGE_CONFIG.MAX_BIO_LENGTH}`

    );

}


/* =========================================================
   CLEAR / SET FIELD ERROR
========================================================= */

function clearFieldError(
    input,
    errorElement
) {

    input
        ?.classList
        .remove(
            "form-input-error"
        );


    setText(
        errorElement,
        ""
    );

}


function setFieldError(
    input,
    errorElement,
    message
) {

    input
        ?.classList
        .add(
            "form-input-error"
        );


    setText(
        errorElement,
        message
    );

}


/* =========================================================
   CLEAR ALL ERRORS
========================================================= */

function clearAllErrors() {

    clearFieldError(

        professionalTitle,

        professionalTitleError

    );


    clearFieldError(

        serviceCategory,

        serviceCategoryError

    );


    clearFieldError(

        professionalBio,

        professionalBioError

    );


    clearFieldError(

        skillInput,

        skillsError

    );


    clearFieldError(

        serviceTitleInput,

        servicesError

    );


    clearFieldError(

        availabilityStatus,

        availabilityStatusError

    );

}


/* =========================================================
   NORMALIZE COMPARISON TEXT
========================================================= */

function normalizeComparisonText(
    value
) {

    return cleanText(
        value
    ).toLowerCase();

}


/* =========================================================
   ADD SKILL
========================================================= */

function addSkill() {

    clearFieldError(

        skillInput,

        skillsError

    );


    const skill =
        cleanText(
            skillInput?.value
        );


    if (
        !skill
    ) {

        setFieldError(

            skillInput,

            skillsError,

            "Enter a skill before adding it."

        );


        return false;

    }


    if (

        skill.length >

        FREELANCER_PAGE_CONFIG
            .MAX_SKILL_LENGTH

    ) {

        setFieldError(

            skillInput,

            skillsError,

            `A skill can contain a maximum of ${FREELANCER_PAGE_CONFIG.MAX_SKILL_LENGTH} characters.`

        );


        return false;

    }


    if (

        skills.length >=

        FREELANCER_PAGE_CONFIG
            .MAX_SKILLS

    ) {

        setFieldError(

            skillInput,

            skillsError,

            `You can add a maximum of ${FREELANCER_PAGE_CONFIG.MAX_SKILLS} skills.`

        );


        return false;

    }


    const normalizedSkill =
        normalizeComparisonText(
            skill
        );


    const skillAlreadyExists =
        skills.some(
            (existingSkill) => {

                return (

                    normalizeComparisonText(
                        existingSkill
                    )

                    ===

                    normalizedSkill

                );

            }
        );


    if (
        skillAlreadyExists
    ) {

        setFieldError(

            skillInput,

            skillsError,

            "This skill has already been added."

        );


        return false;

    }


    skills.push(
        skill
    );


    if (
        skillInput
    ) {

        skillInput.value =
            "";

    }


    renderSkills();


    skillInput
        ?.focus();


    return true;

}


/* =========================================================
   REMOVE SKILL
========================================================= */

function removeSkill(
    skillIndex
) {

    if (

        skillIndex < 0 ||

        skillIndex >=
        skills.length

    ) {

        return;

    }


    skills.splice(

        skillIndex,

        1

    );


    renderSkills();

}


/* =========================================================
   RENDER SKILLS
========================================================= */

function renderSkills() {

    if (
        !skillTagList
    ) {

        return;

    }


    skillTagList
        .replaceChildren();


    const fragment =
        document.createDocumentFragment();


    skills.forEach(
        (
            skill,
            skillIndex
        ) => {

            const skillTag =
                document.createElement(
                    "span"
                );


            skillTag.className =
                "freelancer-form-tag";


            const skillText =
                document.createElement(
                    "span"
                );


            skillText.textContent =
                skill;


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.setAttribute(

                "aria-label",

                `Remove ${skill}`

            );


            removeButton.textContent =
                "×";


            removeButton.addEventListener(

                "click",

                () => {

                    removeSkill(
                        skillIndex
                    );

                }

            );


            skillTag.append(

                skillText,

                removeButton

            );


            fragment.appendChild(
                skillTag
            );

        }
    );


    skillTagList.appendChild(
        fragment
    );

}


/* =========================================================
   ADD SERVICE
========================================================= */

function addService() {

    clearFieldError(

        serviceTitleInput,

        servicesError

    );


    const title =
        cleanText(
            serviceTitleInput?.value
        );


    const description =
        cleanText(
            serviceDescriptionInput?.value
        );


    if (
        !title
    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            "Enter a service title."

        );


        return false;

    }


    if (
        !description
    ) {

        setFieldError(

            serviceDescriptionInput,

            servicesError,

            "Enter a service description."

        );


        return false;

    }


    if (

        title.length >

        FREELANCER_PAGE_CONFIG
            .MAX_SERVICE_TITLE_LENGTH

    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            `Service title can contain a maximum of ${FREELANCER_PAGE_CONFIG.MAX_SERVICE_TITLE_LENGTH} characters.`

        );


        return false;

    }


    if (

        description.length >

        FREELANCER_PAGE_CONFIG
            .MAX_SERVICE_DESCRIPTION_LENGTH

    ) {

        setFieldError(

            serviceDescriptionInput,

            servicesError,

            `Service description can contain a maximum of ${FREELANCER_PAGE_CONFIG.MAX_SERVICE_DESCRIPTION_LENGTH} characters.`

        );


        return false;

    }


    if (

        services.length >=

        FREELANCER_PAGE_CONFIG
            .MAX_SERVICES

    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            `You can add a maximum of ${FREELANCER_PAGE_CONFIG.MAX_SERVICES} services.`

        );


        return false;

    }


    const normalizedTitle =
        normalizeComparisonText(
            title
        );


    const serviceAlreadyExists =
        services.some(
            (service) => {

                return (

                    normalizeComparisonText(
                        service.title
                    )

                    ===

                    normalizedTitle

                );

            }
        );


    if (
        serviceAlreadyExists
    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            "This service has already been added."

        );


        return false;

    }


    services.push({

        title,

        description

    });


    if (
        serviceTitleInput
    ) {

        serviceTitleInput.value =
            "";

    }


    if (
        serviceDescriptionInput
    ) {

        serviceDescriptionInput.value =
            "";

    }


    renderServices();


    serviceTitleInput
        ?.focus();


    return true;

}


/* =========================================================
   REMOVE SERVICE
========================================================= */

function removeService(
    serviceIndex
) {

    if (

        serviceIndex < 0 ||

        serviceIndex >=
        services.length

    ) {

        return;

    }


    services.splice(

        serviceIndex,

        1

    );


    renderServices();

}


/* =========================================================
   RENDER SERVICES
========================================================= */

function renderServices() {

    if (
        !serviceList
    ) {

        return;

    }


    serviceList
        .replaceChildren();


    const fragment =
        document.createDocumentFragment();


    services.forEach(
        (
            service,
            serviceIndex
        ) => {

            const serviceItem =
                document.createElement(
                    "div"
                );


            serviceItem.className =
                "freelancer-form-service-item";


            const content =
                document.createElement(
                    "div"
                );


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                service.title;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                service.description;


            content.append(

                title,

                description

            );


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.className =
                "freelancer-form-service-remove";


            removeButton.textContent =
                "Remove";


            removeButton.setAttribute(

                "aria-label",

                `Remove ${service.title}`

            );


            removeButton.addEventListener(

                "click",

                () => {

                    removeService(
                        serviceIndex
                    );

                }

            );


            serviceItem.append(

                content,

                removeButton

            );


            fragment.appendChild(
                serviceItem
            );

        }
    );


    serviceList.appendChild(
        fragment
    );

}


/* =========================================================
   VALIDATE PROFESSIONAL TITLE
========================================================= */

function validateProfessionalTitle() {

    const title =
        cleanText(
            professionalTitle?.value
        );


    clearFieldError(

        professionalTitle,

        professionalTitleError

    );


    if (
        !title
    ) {

        setFieldError(

            professionalTitle,

            professionalTitleError,

            "Professional title is required."

        );


        return false;

    }


    if (

        title.length <

        FREELANCER_PAGE_CONFIG
            .MIN_TITLE_LENGTH

    ) {

        setFieldError(

            professionalTitle,

            professionalTitleError,

            `Professional title must contain at least ${FREELANCER_PAGE_CONFIG.MIN_TITLE_LENGTH} characters.`

        );


        return false;

    }


    if (

        title.length >

        FREELANCER_PAGE_CONFIG
            .MAX_TITLE_LENGTH

    ) {

        setFieldError(

            professionalTitle,

            professionalTitleError,

            `Professional title can contain a maximum of ${FREELANCER_PAGE_CONFIG.MAX_TITLE_LENGTH} characters.`

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE SERVICE CATEGORY
========================================================= */

function validateServiceCategory() {

    const category =
        cleanText(
            serviceCategory?.value
        );


    clearFieldError(

        serviceCategory,

        serviceCategoryError

    );


    const validCategories = [

        "Web Development",

        "App Development",

        "UI/UX Design",

        "Graphic Design",

        "AI / Machine Learning",

        "Data Science",

        "Cloud Computing",

        "Cyber Security",

        "Digital Marketing",

        "Video Editing",

        "Content Writing",

        "Other"

    ];


    if (
        !category
    ) {

        setFieldError(

            serviceCategory,

            serviceCategoryError,

            "Service category is required."

        );


        return false;

    }


    if (
        !validCategories.includes(
            category
        )
    ) {

        setFieldError(

            serviceCategory,

            serviceCategoryError,

            "Select a valid service category."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE PROFESSIONAL BIO
========================================================= */

function validateProfessionalBio() {

    const bio =
        cleanText(
            professionalBio?.value
        );


    clearFieldError(

        professionalBio,

        professionalBioError

    );


    if (
        !bio
    ) {

        setFieldError(

            professionalBio,

            professionalBioError,

            "Professional bio is required."

        );


        return false;

    }


    if (

        bio.length <

        FREELANCER_PAGE_CONFIG
            .MIN_BIO_LENGTH

    ) {

        setFieldError(

            professionalBio,

            professionalBioError,

            `Professional bio must contain at least ${FREELANCER_PAGE_CONFIG.MIN_BIO_LENGTH} characters.`

        );


        return false;

    }


    if (

        bio.length >

        FREELANCER_PAGE_CONFIG
            .MAX_BIO_LENGTH

    ) {

        setFieldError(

            professionalBio,

            professionalBioError,

            `Professional bio can contain a maximum of ${FREELANCER_PAGE_CONFIG.MAX_BIO_LENGTH} characters.`

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE SKILLS
========================================================= */

function validateSkills() {

    clearFieldError(

        skillInput,

        skillsError

    );


    if (
        skills.length ===
        0
    ) {

        setFieldError(

            skillInput,

            skillsError,

            "Add at least one relevant skill."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE SERVICES
========================================================= */

function validateServices() {

    clearFieldError(

        serviceTitleInput,

        servicesError

    );


    if (
        services.length ===
        0
    ) {

        setFieldError(

            serviceTitleInput,

            servicesError,

            "Add at least one professional service."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE AVAILABILITY (registration form)
========================================================= */

function validateAvailabilityField() {

    const availability =
        cleanText(
            availabilityStatus?.value
        ).toLowerCase();


    clearFieldError(

        availabilityStatus,

        availabilityStatusError

    );


    const validAvailabilityValues = [

        "available",

        "busy"

    ];


    if (
        !validAvailabilityValues.includes(
            availability
        )
    ) {

        setFieldError(

            availabilityStatus,

            availabilityStatusError,

            "Select a valid availability status."

        );


        return false;

    }


    return true;

}


/* =========================================================
   VALIDATE REGISTRATION FORM
========================================================= */

function validateRegistrationForm() {

    clearAllErrors();


    const titleValid =
        validateProfessionalTitle();


    const categoryValid =
        validateServiceCategory();


    const bioValid =
        validateProfessionalBio();


    const skillsValid =
        validateSkills();


    const servicesValid =
        validateServices();


    const availabilityValid =
        validateAvailabilityField();


    return (

        titleValid &&

        categoryValid &&

        bioValid &&

        skillsValid &&

        servicesValid &&

        availabilityValid

    );

}


/* =========================================================
   CREATE REGISTRATION PAYLOAD
========================================================= */

function createRegistrationPayload() {

    return {

        user_id:
            currentUser.id,

        professional_title:
            cleanText(
                professionalTitle?.value
            ),

        service_category:
            cleanText(
                serviceCategory?.value
            ),

        bio:
            cleanText(
                professionalBio?.value
            ),

        skills:
            [
                ...skills
            ],

        services:
            services.map(
                (service) => {

                    return {

                        title:
                            cleanText(
                                service.title
                            ),

                        description:
                            cleanText(
                                service.description
                            )

                    };

                }
            ),

        availability_status:
            cleanText(
                availabilityStatus?.value
            ).toLowerCase(),

        approval_status:
            "pending"

    };

}


/* =========================================================
   SUBMIT FREELANCER PROFILE
========================================================= */

async function submitFreelancerProfile(
    registrationPayload
) {

    if (
        !registrationPayload?.user_id
    ) {

        throw new Error(
            "Campus user identifier is unavailable."
        );

    }


    const client =
        requireSupabaseClient();


    const {

        data: existingProfile,

        error: existingProfileError

    } = await client

        .from(
            "freelancer_profiles"
        )

        .select(
            "id"
        )

        .eq(
            "user_id",
            registrationPayload.user_id
        )

        .maybeSingle();


    if (
        existingProfileError
    ) {

        throw existingProfileError;

    }


    if (
        existingProfile
    ) {

        throw new Error(
            "A freelancer profile is already linked to this campus account."
        );

    }


    const {

        data,

        error

    } = await client

        .from(
            "freelancer_profiles"
        )

        .insert(
            registrationPayload
        )

        .select(
            FREELANCER_PAGE_CONFIG
                .FREELANCER_COLUMNS
        )

        .single();


    if (
        error
    ) {

        throw error;

    }


    return normalizeFreelancerProfile(
        data
    );

}


/* =========================================================
   FORM MESSAGE
========================================================= */

function showFormMessage(
    message,
    messageType
) {

    if (
        !registrationFormMessage
    ) {

        return;

    }


    registrationFormMessage
        .classList
        .remove(

            "hidden",

            "success",

            "error"

        );


    if (

        messageType ===
        "success"

        ||

        messageType ===
        "error"

    ) {

        registrationFormMessage
            .classList
            .add(
                messageType
            );

    }


    setText(

        registrationFormMessage,

        message

    );

}


function hideFormMessage() {

    if (
        !registrationFormMessage
    ) {

        return;

    }


    registrationFormMessage
        .classList
        .add(
            "hidden"
        );


    registrationFormMessage
        .classList
        .remove(

            "success",

            "error"

        );


    setText(

        registrationFormMessage,

        ""

    );

}


/* =========================================================
   SET SUBMITTING STATE
========================================================= */

function setSubmittingState(
    isSubmitting
) {

    submissionInProgress =
        Boolean(
            isSubmitting
        );


    if (
        submitFreelancerButton
    ) {

        submitFreelancerButton.disabled =
            submissionInProgress;


        submitFreelancerButton.setAttribute(

            "aria-busy",

            String(
                submissionInProgress
            )

        );

    }


    setText(

        submitFreelancerButtonText,

        submissionInProgress

            ? "Submitting..."

            : "Submit for Review"

    );

}


/* =========================================================
   PAGE STATE SWITCHING
========================================================= */

function hideAllStateSections() {

    hideElement(
        freelancerPageLoadingState
    );


    hideElement(
        existingFreelancerState
    );


    hideElement(
        freelancerDashboardState
    );


    hideElement(
        freelancerRegistrationContent
    );

}


function showLoadingState() {

    hideAllStateSections();


    showElement(
        freelancerPageLoadingState
    );

}


function showRegistrationForm() {

    hideAllStateSections();


    setPageHeaderMode(
        "registration"
    );


    showElement(
        freelancerRegistrationContent
    );

}


function showExistingFreelancerState(
    freelancerProfile
) {

    hideAllStateSections();


    setPageHeaderMode(
        "status"
    );


    showElement(
        existingFreelancerState
    );


    const approvalStatus =
        cleanText(
            freelancerProfile
                ?.approvalStatus
        ).toLowerCase();


    if (
        approvalStatus ===
        "pending"
    ) {

        setText(

            existingFreelancerTitle,

            "Profile under review"

        );


        setText(

            existingFreelancerMessage,

            "Your freelancer profile has already been submitted and is currently waiting for admin review."

        );


        return;

    }


    if (
        approvalStatus ===
        "rejected"
    ) {

        setText(

            existingFreelancerTitle,

            "Freelancer profile requires review"

        );


        const rejectionReason =
            cleanText(
                freelancerProfile
                    ?.rejectionReason
            );


        setText(

            existingFreelancerMessage,

            rejectionReason

                ? `Your freelancer profile was not approved. Admin review: ${rejectionReason}`

                : "Your previous freelancer profile was not approved. Please contact the platform administrator for review."

        );


        return;

    }


    setText(

        existingFreelancerTitle,

        "Freelancer profile already created"

    );


    setText(

        existingFreelancerMessage,

        "A freelancer profile is already linked to your campus account."

    );

}


async function showFreelancerDashboardState() {

    hideAllStateSections();


    setPageHeaderMode(
        "dashboard"
    );


    populateFreelancerOverview(

        currentUser,

        currentFreelancerProfile

    );


    renderAvailabilityControl();


    try {

        const requests =
            await getFreelancerRequests(
                currentFreelancerProfile.userId
            );


        currentRequests =
            Array.isArray(
                requests
            )

                ? requests

                : [];


    } catch (error) {

        console.error(
            "Freelancer requests fetch error:",
            error
        );


        currentRequests =
            [];

    }


    renderStatistics();


    renderRecentRequests();


    showElement(
        freelancerDashboardState
    );

}


/* =========================================================
   HANDLE FORM SUBMISSION
========================================================= */

async function handleRegistrationSubmit(
    event
) {

    event.preventDefault();


    if (
        submissionInProgress
    ) {

        return;

    }


    hideFormMessage();


    const formValid =
        validateRegistrationForm();


    if (
        !formValid
    ) {

        showFormMessage(

            "Review the highlighted fields before submitting your freelancer profile.",

            "error"

        );


        return;

    }


    if (
        !currentUser?.id
    ) {

        showFormMessage(

            "Your campus profile could not be identified. Please return to the dashboard and try again.",

            "error"

        );


        return;

    }


    const registrationPayload =
        createRegistrationPayload();


    setSubmittingState(
        true
    );


    try {

        const createdProfile =
            await submitFreelancerProfile(
                registrationPayload
            );


        if (
            !createdProfile
        ) {

            throw new Error(
                "Freelancer profile was not created."
            );

        }


        currentFreelancerProfile =
            createdProfile;


        showFormMessage(

            "Freelancer profile submitted successfully. Your profile is now waiting for admin review.",

            "success"

        );


        showExistingFreelancerState(
            createdProfile
        );


    } catch (error) {

        console.error(
            "Freelancer registration error:",
            error
        );


        if (
            error?.code ===
            "23505"
        ) {

            showFormMessage(

                "A freelancer profile is already linked to your campus account.",

                "error"

            );


            return;

        }


        showFormMessage(

            "Unable to submit your freelancer profile. Please try again.",

            "error"

        );

    } finally {

        setSubmittingState(
            false
        );

    }

}


/* =========================================================
   HANDLE SKILL KEYBOARD INPUT
========================================================= */

function handleSkillKeyDown(
    event
) {

    if (
        event.key !==
        "Enter"
    ) {

        return;

    }


    event.preventDefault();


    addSkill();

}


/* =========================================================
   NAVIGATION
========================================================= */

function returnToMainDashboard() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


function openFreelancerRequests() {

    navigateTo(
        ROUTES.FREELANCER_REQUESTS
    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    professionalTitle
        ?.addEventListener(

            "input",

            () => {

                updateProfessionalTitleCount();


                clearFieldError(

                    professionalTitle,

                    professionalTitleError

                );

            }

        );


    serviceCategory
        ?.addEventListener(

            "change",

            () => {

                clearFieldError(

                    serviceCategory,

                    serviceCategoryError

                );

            }

        );


    professionalBio
        ?.addEventListener(

            "input",

            () => {

                updateProfessionalBioCount();


                clearFieldError(

                    professionalBio,

                    professionalBioError

                );

            }

        );


    skillInput
        ?.addEventListener(

            "keydown",

            handleSkillKeyDown

        );


    skillInput
        ?.addEventListener(

            "input",

            () => {

                clearFieldError(

                    skillInput,

                    skillsError

                );

            }

        );


    serviceTitleInput
        ?.addEventListener(

            "input",

            () => {

                clearFieldError(

                    serviceTitleInput,

                    servicesError

                );

            }

        );


    serviceDescriptionInput
        ?.addEventListener(

            "input",

            () => {

                clearFieldError(

                    serviceDescriptionInput,

                    servicesError

                );

            }

        );


    availabilityStatus
        ?.addEventListener(

            "change",

            () => {

                clearFieldError(

                    availabilityStatus,

                    availabilityStatusError

                );

            }

        );


    addSkillButton
        ?.addEventListener(
            "click",
            addSkill
        );


    addServiceButton
        ?.addEventListener(
            "click",
            addService
        );


    freelancerRegistrationForm
        ?.addEventListener(

            "submit",

            handleRegistrationSubmit

        );


    cancelRegistrationButton
        ?.addEventListener(

            "click",

            returnToMainDashboard

        );


    existingStateDashboardButton
        ?.addEventListener(

            "click",

            returnToMainDashboard

        );


    mainDashboardButton
        ?.addEventListener(

            "click",

            returnToMainDashboard

        );


    availabilityToggleButton
        ?.addEventListener(

            "click",

            handleAvailabilityToggle

        );


    viewAllRequestsButton
        ?.addEventListener(

            "click",

            openFreelancerRequests

        );

}


/* =========================================================
   INITIALIZE FREELANCER PAGE
========================================================= */

async function initializeFreelancerPage(
    authenticatedUser
) {

    initializeEventListeners();


    updateProfessionalTitleCount();


    updateProfessionalBioCount();


    renderSkills();


    renderServices();


    hideFormMessage();


    showLoadingState();


    try {

        currentUser =
            await getCurrentUserProfile(
                authenticatedUser
            );


        if (
            !currentUser
        ) {

            navigateTo(
                ROUTES.PROFILE_SETUP
            );


            return;

        }


        populateNavbar(
            currentUser
        );


        const existingFreelancerProfile =
            await getExistingFreelancerProfile(
                currentUser.id
            );


        if (
            !existingFreelancerProfile
        ) {

            showRegistrationForm();


            return;

        }


        currentFreelancerProfile =
            existingFreelancerProfile;


        const approvalStatus =
            cleanText(
                existingFreelancerProfile
                    .approvalStatus
            ).toLowerCase();


        if (
            approvalStatus ===
            "approved"
        ) {

            await showFreelancerDashboardState();


            return;

        }


        showExistingFreelancerState(
            existingFreelancerProfile
        );


    } catch (error) {

        console.error(
            "Freelancer page initialization error:",
            error
        );


        hideAllStateSections();


        setPageHeaderMode(
            "status"
        );


        showElement(
            existingFreelancerState
        );


        setText(

            existingFreelancerTitle,

            "Unable to load freelancer status"

        );


        setText(

            existingFreelancerMessage,

            "The freelancer workspace could not be loaded. Please return to the dashboard and try again."

        );

    }

}


/* =========================================================
   AUTHENTICATED PAGE INITIALIZATION
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAuthenticatedPage(
            initializeFreelancerPage
        );

    }

);