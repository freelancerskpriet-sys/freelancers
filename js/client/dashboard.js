/* =========================================================
   KPRIET FREELANCER PLATFORM
   Client Dashboard Logic
   File: js/client/dashboard.js
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
   CLIENT DASHBOARD CONFIGURATION
========================================================= */

const CLIENT_DASHBOARD_CONFIG =
    Object.freeze({

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
            category,
            description,
            budget,
            deadline,
            status,
            created_at,
            updated_at

        `,


        RECENT_REQUEST_LIMIT:
            3

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
   NAVIGATION CARDS
--------------------------------------------------------- */

const createRequestCard =
    document.getElementById(
        "createRequestCard"
    );


const myRequestsCard =
    document.getElementById(
        "myRequestsCard"
    );


const exploreFreelancersCard =
    document.getElementById(
        "exploreFreelancersCard"
    );


const mainDashboardCard =
    document.getElementById(
        "mainDashboardCard"
    );


/* ---------------------------------------------------------
   REQUEST SUMMARY
--------------------------------------------------------- */

const totalRequestsCount =
    document.getElementById(
        "totalRequestsCount"
    );


const underReviewRequestsCount =
    document.getElementById(
        "underReviewRequestsCount"
    );


const matchingRequestsCount =
    document.getElementById(
        "matchingRequestsCount"
    );


const activeWorksCount =
    document.getElementById(
        "activeWorksCount"
    );


/* ---------------------------------------------------------
   RECENT REQUESTS
--------------------------------------------------------- */

const recentRequestsLoadingState =
    document.getElementById(
        "recentRequestsLoadingState"
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


const emptyCreateRequestButton =
    document.getElementById(
        "emptyCreateRequestButton"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentRequests = [];


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
            CLIENT_DASHBOARD_CONFIG
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

        under_review:
            "under_review",

        approved:
            "approved",

        matching:
            "matching",

        freelancer_matching:
            "matching",

        assigned:
            "assigned",

        matched:
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
            "rejected"

    };


    return (

        statusMap[
            normalizedStatus
        ]

        ||

        normalizedStatus

        ||

        "under_review"

    );

}


/* =========================================================
   NORMALIZE CLIENT REQUEST
========================================================= */

function normalizeClientRequest(
    request
) {

    if (
        !request
    ) {

        return null;

    }


    return {

        id:
            cleanText(
                request.id
            ),

        clientId:
            cleanText(
                request.client_id
            ),

        title:
            cleanText(
                request.title
            ) ||
            "Service Request",

        category:
            cleanText(
                request.category
            ) ||
            "Campus Service",

        description:
            cleanText(
                request.description
            ),

        budget:
            Number(
                request.budget
            ),

        deadline:
            request.deadline ??
            null,

        status:
            normalizeRequestStatus(
                request.status
            ),

        createdAt:
            request.created_at ??
            null,

        updatedAt:
            request.updated_at ??
            null

    };

}


/* =========================================================
   GET CLIENT REQUESTS
========================================================= */

async function getClientRequests(
    clientId
) {

    const safeClientId =
        cleanText(
            clientId
        );


    if (
        !safeClientId
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
            "service_requests"
        )

        .select(
            CLIENT_DASHBOARD_CONFIG
                .REQUEST_COLUMNS
        )

        .eq(
            "client_id",
            safeClientId
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

        data ??
        []

    )

        .map(
            normalizeClientRequest
        )

        .filter(
            Boolean
        );

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
            "http:" &&

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

        approved:
            "Approved",

        matching:
            "Freelancer Matching",

        assigned:
            "Freelancer Assigned",

        active:
            "Active Work",

        completed:
            "Completed",

        rejected:
            "Rejected"

    };


    return (

        statusLabels[
            status
        ]

        ||

        "Submitted"

    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    dateValue
) {

    if (
        !dateValue
    ) {

        return "Not specified";

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

        return "Not specified";

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
   FORMAT BUDGET
========================================================= */

function formatBudget(
    budgetValue
) {

    const numericBudget =
        Number(
            budgetValue
        );


    if (

        !Number.isFinite(
            numericBudget
        )

        ||

        numericBudget < 0

    ) {

        return "Not specified";

    }


    return new Intl.NumberFormat(

        "en-IN",

        {

            style:
                "currency",

            currency:
                "INR",

            maximumFractionDigits:
                0

        }

    ).format(
        numericBudget
    );

}


/* =========================================================
   GET DATE TIME
========================================================= */

function getDateTime(
    value
) {

    if (
        !value
    ) {

        return 0;

    }


    const date =
        new Date(
            value
        );


    const time =
        date.getTime();


    return Number.isNaN(
        time
    )

        ? 0

        : time;

}


/* =========================================================
   SORT REQUESTS
========================================================= */

function sortRequestsByCreatedDate(
    requests
) {

    return [

        ...requests

    ].sort(
        (
            firstRequest,
            secondRequest
        ) => {

            return (

                getDateTime(
                    secondRequest.createdAt
                )

                -

                getDateTime(
                    firstRequest.createdAt
                )

            );

        }
    );

}


/* =========================================================
   CALCULATE REQUEST SUMMARY
========================================================= */

function calculateRequestSummary() {

    const underReview =
        currentRequests.filter(
            (request) => {

                return (

                    request.status ===
                    "under_review"

                );

            }
        ).length;


    const matching =
        currentRequests.filter(
            (request) => {

                return (

                    request.status ===
                    "matching"

                );

            }
        ).length;


    const active =
        currentRequests.filter(
            (request) => {

                return (

                    request.status ===
                    "active"

                );

            }
        ).length;


    return {

        total:
            currentRequests.length,

        underReview,

        matching,

        active

    };

}


/* =========================================================
   RENDER REQUEST SUMMARY
========================================================= */

function renderRequestSummary() {

    const summary =
        calculateRequestSummary();


    setText(

        totalRequestsCount,

        String(
            summary.total
        )

    );


    setText(

        underReviewRequestsCount,

        String(
            summary.underReview
        )

    );


    setText(

        matchingRequestsCount,

        String(
            summary.matching
        )

    );


    setText(

        activeWorksCount,

        String(
            summary.active
        )

    );

}


/* =========================================================
   CREATE REQUEST META ITEM
========================================================= */

function createRequestMetaItem(
    label,
    value
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "client-request-meta-item";


    const labelElement =
        document.createElement(
            "span"
        );


    setText(
        labelElement,
        label
    );


    const valueElement =
        document.createElement(
            "strong"
        );


    setText(
        valueElement,
        value
    );


    item.append(

        labelElement,

        valueElement

    );


    return item;

}


/* =========================================================
   CREATE DESCRIPTION PREVIEW
========================================================= */

function createDescriptionPreview(
    description,
    maximumLength = 150
) {

    const safeDescription =
        cleanText(
            description
        );


    if (
        !safeDescription
    ) {

        return "Service request description unavailable.";

    }


    if (

        safeDescription.length <=
        maximumLength

    ) {

        return safeDescription;

    }


    return (

        safeDescription

            .slice(
                0,
                maximumLength
            )

            .trimEnd()

        +

        "..."

    );

}


/* =========================================================
   CREATE RECENT REQUEST CARD
========================================================= */

function createRecentRequestCard(
    request
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "client-recent-request-card";


    card.tabIndex =
        0;


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(

        "aria-label",

        `View ${request.title}`

    );


    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "client-recent-request-header";


    const headingContent =
        document.createElement(
            "div"
        );


    const category =
        document.createElement(
            "span"
        );


    category.className =
        "client-request-category";


    setText(

        category,

        request.category

    );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "client-request-title";


    setText(

        title,

        request.title

    );


    headingContent.append(

        category,

        title

    );


    const status =
        document.createElement(
            "span"
        );


    status.className =

        `client-request-status ${
            request.status
        }`;


    setText(

        status,

        formatRequestStatus(
            request.status
        )

    );


    header.append(

        headingContent,

        status

    );


    /* -----------------------------------------------------
       DESCRIPTION
    ----------------------------------------------------- */

    const descriptionElement =
        document.createElement(
            "p"
        );


    descriptionElement.className =
        "client-request-description";


    setText(

        descriptionElement,

        createDescriptionPreview(
            request.description
        )

    );


    /* -----------------------------------------------------
       META
    ----------------------------------------------------- */

    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "client-request-meta";


    meta.append(

        createRequestMetaItem(

            "BUDGET",

            formatBudget(
                request.budget
            )

        ),

        createRequestMetaItem(

            "DEADLINE",

            formatDate(
                request.deadline
            )

        ),

        createRequestMetaItem(

            "SUBMITTED",

            formatDate(
                request.createdAt
            )

        )

    );


    /* -----------------------------------------------------
       ACTION
    ----------------------------------------------------- */

    const action =
        document.createElement(
            "span"
        );


    action.className =
        "client-request-action";


    setText(

        action,

        "View Request →"

    );


    card.append(

        header,

        descriptionElement,

        meta,

        action

    );


    const openRequest =
        () => {

            openRequestDetails(
                request.id
            );

        };


    card.addEventListener(
        "click",
        openRequest
    );


    card.addEventListener(
        "keydown",
        (event) => {

            if (

                event.key !== "Enter" &&

                event.key !== " "

            ) {

                return;

            }


            event.preventDefault();


            openRequest();

        }
    );


    return card;

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
        sortRequestsByCreatedDate(
            currentRequests
        )
            .slice(
                0,
                CLIENT_DASHBOARD_CONFIG
                    .RECENT_REQUEST_LIMIT
            );


    hideElement(
        recentRequestsLoadingState
    );


    if (
        recentRequests.length === 0
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
        document
            .createDocumentFragment();


    recentRequests.forEach(
        (request) => {

            fragment.appendChild(

                createRecentRequestCard(
                    request
                )

            );

        }
    );


    recentRequestsList
        .appendChild(
            fragment
        );

}


/* =========================================================
   OPEN CREATE REQUEST
========================================================= */

function openCreateRequest() {

    navigateTo(
        ROUTES.CREATE_REQUEST
    );

}


/* =========================================================
   OPEN MY REQUESTS
========================================================= */

function openMyRequests() {

    navigateTo(
        ROUTES.MY_REQUESTS
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
   OPEN MAIN DASHBOARD
========================================================= */

function openMainDashboard() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


/* =========================================================
   OPEN REQUEST DETAILS
========================================================= */

function openRequestDetails(
    requestId
) {

    const safeRequestId =
        cleanText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        return;

    }


    navigateTo(

        ROUTES.REQUEST_DETAILS,

        {

            request:
                safeRequestId

        }

    );

}


/* =========================================================
   ADD CARD INTERACTION
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

                event.key !== "Enter" &&

                event.key !== " "

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

    addCardInteraction(

        createRequestCard,

        openCreateRequest

    );


    addCardInteraction(

        myRequestsCard,

        openMyRequests

    );


    addCardInteraction(

        exploreFreelancersCard,

        openExploreFreelancers

    );


    addCardInteraction(

        mainDashboardCard,

        openMainDashboard

    );


    viewAllRequestsButton
        ?.addEventListener(
            "click",
            openMyRequests
        );


    emptyCreateRequestButton
        ?.addEventListener(
            "click",
            openCreateRequest
        );

}


/* =========================================================
   INITIALIZE CLIENT DASHBOARD
========================================================= */

async function initializeClientDashboard(
    authenticatedUser
) {

    initializeEventListeners();


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


        currentRequests =
            await getClientRequests(
                currentUser.id
            );


        renderRequestSummary();


        renderRecentRequests();


    } catch (error) {

        console.error(
            "Client dashboard initialization error:",
            error
        );


        currentRequests =
            [];


        renderRequestSummary();


        hideElement(
            recentRequestsLoadingState
        );


        showElement(
            recentRequestsEmptyState
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
            initializeClientDashboard
        );

    }

);