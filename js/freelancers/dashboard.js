/* =========================================================
   KPRIET FREELANCER PLATFORM
   Freelancer Dashboard Logic
   File: js/freelancers/dashboard.js
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
   DASHBOARD CONFIGURATION
========================================================= */

const DASHBOARD_CONFIG =
    Object.freeze({

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
        `,


        WORK_COLUMNS: `

            id,
            request_id,
            freelancer_id,
            status,
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
   PAGE STATE
--------------------------------------------------------- */

const freelancerDashboardLoadingState =
    document.getElementById(
        "freelancerDashboardLoadingState"
    );


const freelancerDashboardAccessState =
    document.getElementById(
        "freelancerDashboardAccessState"
    );


const freelancerDashboardAccessTitle =
    document.getElementById(
        "freelancerDashboardAccessTitle"
    );


const freelancerDashboardAccessMessage =
    document.getElementById(
        "freelancerDashboardAccessMessage"
    );


const freelancerDashboardContent =
    document.getElementById(
        "freelancerDashboardContent"
    );


/* ---------------------------------------------------------
   ACCESS BUTTONS
--------------------------------------------------------- */

const accessRegisterButton =
    document.getElementById(
        "accessRegisterButton"
    );


const accessMainDashboardButton =
    document.getElementById(
        "accessMainDashboardButton"
    );


/* ---------------------------------------------------------
   DASHBOARD NAVIGATION
--------------------------------------------------------- */

const mainDashboardButton =
    document.getElementById(
        "mainDashboardButton"
    );


const openRequestsButton =
    document.getElementById(
        "openRequestsButton"
    );


const openWorksButton =
    document.getElementById(
        "openWorksButton"
    );


const openPublicProfileButton =
    document.getElementById(
        "openPublicProfileButton"
    );


const openExploreButton =
    document.getElementById(
        "openExploreButton"
    );


const viewAllRequestsButton =
    document.getElementById(
        "viewAllRequestsButton"
    );


/* ---------------------------------------------------------
   FREELANCER PROFILE
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


/* ---------------------------------------------------------
   AVAILABILITY
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   STATISTICS
--------------------------------------------------------- */

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


/* ---------------------------------------------------------
   RECENT REQUESTS
--------------------------------------------------------- */

const recentRequestsList =
    document.getElementById(
        "recentRequestsList"
    );


const recentRequestsEmptyState =
    document.getElementById(
        "recentRequestsEmptyState"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentFreelancerProfile = null;

let currentRequests = [];

let currentWorks = [];

let availabilityUpdateInProgress = false;


/* =========================================================
   NORMALIZE STRING ARRAY
========================================================= */

function normalizeStringArray(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        return value

            .map(
                (item) => {

                    return cleanText(
                        item
                    );

                }
            )

            .filter(
                Boolean
            );

    }


    const safeValue =
        cleanText(
            value
        );


    if (
        !safeValue
    ) {

        return [];

    }


    return safeValue

        .split(
            ","
        )

        .map(
            (item) => {

                return cleanText(
                    item
                );

            }
        )

        .filter(
            Boolean
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
    freelancerId
) {

    const safeFreelancerId =
        cleanText(
            freelancerId
        );


    if (
        !safeFreelancerId
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
            DASHBOARD_CONFIG
                .REQUEST_COLUMNS
        )

        .eq(
            "freelancer_id",
            safeFreelancerId
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
   NORMALIZE WORK STATUS
========================================================= */

function normalizeWorkStatus(
    workStatus
) {

    const normalizedStatus =
        cleanText(
            workStatus
        )

            .toLowerCase()

            .replace(
                /[\s-]+/g,
                "_"
            );


    const statusMap = {

        pending:
            "pending",

        assigned:
            "pending",

        accepted:
            "active",

        active:
            "active",

        active_work:
            "active",

        in_progress:
            "active",

        completed:
            "completed",

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
   NORMALIZE WORK
========================================================= */

function normalizeWork(
    work
) {

    if (
        !work
    ) {

        return null;

    }


    return {

        id:
            cleanText(
                work.id
            ),

       serviceRequestId:
    cleanText(
        work.request_id
    ),

        freelancerId:
            cleanText(
                work.freelancer_id
            ),

        status:
            normalizeWorkStatus(
                work.status
            ),

        createdAt:
            work.created_at ??
            null,

        updatedAt:
            work.updated_at ??
            null

    };

}


/* =========================================================
   GET FREELANCER WORKS
   Queries service_assignments — the current table for
   tracking freelancer work status. The legacy "works"
   table no longer exists in the database.
========================================================= */

async function getFreelancerWorks(
    freelancerId
) {

    const safeFreelancerId =
        cleanText(
            freelancerId
        );


    if (
        !safeFreelancerId
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
            DASHBOARD_CONFIG
                .WORK_COLUMNS
        )

        .eq(
            "freelancer_id",
            safeFreelancerId
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
            normalizeWork
        )

        .filter(
            Boolean
        );

}


/* =========================================================
   APPLY BACKGROUND PHOTO
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
        "Campus User";


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
   CREATE CAMPUS INFORMATION
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
   POPULATE FREELANCER OVERVIEW
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
    availabilityStatus
) {

    const availability =
        cleanText(
            availabilityStatus
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
    availabilityStatus
) {

    const safeFreelancerId =
        cleanText(
            freelancerId
        );


    const safeAvailabilityStatus =
        normalizeAvailability(
            availabilityStatus
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
   CALCULATE DASHBOARD STATISTICS
========================================================= */

function calculateDashboardStatistics(
    requests,
    works
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

            currentRequests,

            currentWorks

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

                DASHBOARD_CONFIG
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
   SHOW LOADING STATE
========================================================= */

function showLoadingState() {

    showElement(
        freelancerDashboardLoadingState
    );


    hideElement(
        freelancerDashboardAccessState
    );


    hideElement(
        freelancerDashboardContent
    );

}


/* =========================================================
   SHOW DASHBOARD CONTENT
========================================================= */

function showDashboardContent() {

    hideElement(
        freelancerDashboardLoadingState
    );


    hideElement(
        freelancerDashboardAccessState
    );


    showElement(
        freelancerDashboardContent
    );

}


/* =========================================================
   SHOW ACCESS STATE
========================================================= */

function showAccessState(
    title,
    message,
    showRegistrationButton = true
) {

    hideElement(
        freelancerDashboardLoadingState
    );


    hideElement(
        freelancerDashboardContent
    );


    showElement(
        freelancerDashboardAccessState
    );


    setText(

        freelancerDashboardAccessTitle,

        title

    );


    setText(

        freelancerDashboardAccessMessage,

        message

    );


    if (
        accessRegisterButton
    ) {

        accessRegisterButton
            .classList
            .toggle(
                "hidden",
                !showRegistrationButton
            );

    }

}


/* =========================================================
   HANDLE FREELANCER ACCESS
========================================================= */

function handleFreelancerAccess(
    freelancerProfile
) {

    if (
        !freelancerProfile
    ) {

        showAccessState(

            "Freelancer registration required",

            "Create a freelancer profile and submit your professional details for admin review.",

            true

        );


        return false;

    }


    const approvalStatus =
        cleanText(
            freelancerProfile
                .approvalStatus
        ).toLowerCase();


    if (
        approvalStatus ===
        "pending"
    ) {

        showAccessState(

            "Freelancer profile under review",

            "Your freelancer profile is currently waiting for admin approval. Dashboard access will be available after approval.",

            false

        );


        return false;

    }


    if (
        approvalStatus ===
        "rejected"
    ) {

        showAccessState(

            "Freelancer profile requires review",

            "Your freelancer profile was not approved. Review and resubmission options are available through the freelancer registration workflow.",

            true

        );


        return false;

    }


    if (
        approvalStatus !==
        "approved"
    ) {

        showAccessState(

            "Freelancer dashboard unavailable",

            "An approved freelancer profile is required to access this dashboard.",

            false

        );


        return false;

    }


    return true;

}


/* =========================================================
   NAVIGATION
========================================================= */

function returnToMainDashboard() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


function openFreelancerRegistration() {

    navigateTo(
        ROUTES.FREELANCER_REGISTER
    );

}


function openFreelancerRequests() {

    navigateTo(
        ROUTES.FREELANCER_REQUESTS
    );

}


function openFreelancerWorks() {

    navigateTo(
        ROUTES.FREELANCER_WORKS
    );

}


function openPublicProfile() {

    const freelancerId =
        cleanText(
            currentFreelancerProfile?.id
        );


    if (
        !freelancerId
    ) {

        return;

    }


    navigateTo(

        ROUTES.FREELANCER_PROFILE,

        {

            freelancer:
                freelancerId

        }

    );

}


function openExploreFreelancers() {

    navigateTo(
        ROUTES.EXPLORE_FREELANCERS
    );

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    mainDashboardButton
        ?.addEventListener(
            "click",
            returnToMainDashboard
        );


    accessMainDashboardButton
        ?.addEventListener(
            "click",
            returnToMainDashboard
        );


    accessRegisterButton
        ?.addEventListener(
            "click",
            openFreelancerRegistration
        );


    availabilityToggleButton
        ?.addEventListener(
            "click",
            handleAvailabilityToggle
        );


    openRequestsButton
        ?.addEventListener(
            "click",
            openFreelancerRequests
        );


    viewAllRequestsButton
        ?.addEventListener(
            "click",
            openFreelancerRequests
        );


    openWorksButton
        ?.addEventListener(
            "click",
            openFreelancerWorks
        );


    openPublicProfileButton
        ?.addEventListener(
            "click",
            openPublicProfile
        );


    openExploreButton
        ?.addEventListener(
            "click",
            openExploreFreelancers
        );

}


/* =========================================================
   INITIALIZE FREELANCER DASHBOARD
========================================================= */

async function initializeFreelancerDashboard(
    authenticatedUser
) {

    initializeEventListeners();


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


        currentFreelancerProfile =
            await getFreelancerProfile(
                currentUser.id
            );


        const accessAllowed =
            handleFreelancerAccess(
                currentFreelancerProfile
            );


        if (
            !accessAllowed
        ) {

            currentRequests =
                [];


            currentWorks =
                [];


            return;

        }


        [

            currentRequests,

            currentWorks

        ] = await Promise.all([

            getFreelancerRequests(
                currentFreelancerProfile.userId
            ),

            getFreelancerWorks(
                currentFreelancerProfile.userId
            )

        ]);


        if (
            !Array.isArray(
                currentRequests
            )
        ) {

            currentRequests =
                [];

        }


        if (
            !Array.isArray(
                currentWorks
            )
        ) {

            currentWorks =
                [];

        }


        populateFreelancerOverview(

            currentUser,

            currentFreelancerProfile

        );


        renderAvailabilityControl();


        renderStatistics();


        renderRecentRequests();


        showDashboardContent();


    } catch (error) {

        console.error(
            "Freelancer dashboard initialization error:",
            error
        );


        currentFreelancerProfile =
            null;


        currentRequests =
            [];


        currentWorks =
            [];


        showAccessState(

            "Unable to load freelancer dashboard",

            "The freelancer workspace could not be loaded. Please return to the main dashboard and try again.",

            false

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
            initializeFreelancerDashboard
        );

    }

);
