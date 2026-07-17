/* =========================================================
   KPRIET FREELANCER PLATFORM
   Freelancer Service Requests Logic
   File: js/freelancers/requests.js
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
   PAGE STATES
--------------------------------------------------------- */

const freelancerRequestsLoadingState =
    document.getElementById(
        "freelancerRequestsLoadingState"
    );


const freelancerRequestsAccessState =
    document.getElementById(
        "freelancerRequestsAccessState"
    );


const freelancerRequestsAccessTitle =
    document.getElementById(
        "freelancerRequestsAccessTitle"
    );


const freelancerRequestsAccessMessage =
    document.getElementById(
        "freelancerRequestsAccessMessage"
    );


const freelancerRequestsContent =
    document.getElementById(
        "freelancerRequestsContent"
    );


/* ---------------------------------------------------------
   NAVIGATION BUTTONS
--------------------------------------------------------- */

const freelancerDashboardButton =
    document.getElementById(
        "freelancerDashboardButton"
    );


const accessFreelancerDashboardButton =
    document.getElementById(
        "accessFreelancerDashboardButton"
    );


const accessMainDashboardButton =
    document.getElementById(
        "accessMainDashboardButton"
    );


/* ---------------------------------------------------------
   SUMMARY COUNTS
--------------------------------------------------------- */

const allRequestsCount =
    document.getElementById(
        "allRequestsCount"
    );


const pendingRequestsCount =
    document.getElementById(
        "pendingRequestsCount"
    );


const acceptedRequestsCount =
    document.getElementById(
        "acceptedRequestsCount"
    );


const rejectedRequestsCount =
    document.getElementById(
        "rejectedRequestsCount"
    );


/* ---------------------------------------------------------
   SEARCH AND FILTER
--------------------------------------------------------- */

const requestSearchInput =
    document.getElementById(
        "requestSearchInput"
    );


const requestStatusFilter =
    document.getElementById(
        "requestStatusFilter"
    );


const requestResultCount =
    document.getElementById(
        "requestResultCount"
    );


const activeRequestFilterText =
    document.getElementById(
        "activeRequestFilterText"
    );


const clearRequestFiltersButton =
    document.getElementById(
        "clearRequestFiltersButton"
    );


/* ---------------------------------------------------------
   REQUEST LIST
--------------------------------------------------------- */

const requestList =
    document.getElementById(
        "requestList"
    );


const requestEmptyState =
    document.getElementById(
        "requestEmptyState"
    );


const requestEmptyStateTitle =
    document.getElementById(
        "requestEmptyStateTitle"
    );


const requestEmptyStateDescription =
    document.getElementById(
        "requestEmptyStateDescription"
    );


/* ---------------------------------------------------------
   PAGINATION
--------------------------------------------------------- */

const requestPagination =
    document.getElementById(
        "requestPagination"
    );


const previousRequestPageButton =
    document.getElementById(
        "previousRequestPageButton"
    );


const requestPaginationNumbers =
    document.getElementById(
        "requestPaginationNumbers"
    );


const nextRequestPageButton =
    document.getElementById(
        "nextRequestPageButton"
    );


/* ---------------------------------------------------------
   REQUEST MODAL
--------------------------------------------------------- */

const requestDetailsModal =
    document.getElementById(
        "requestDetailsModal"
    );


const requestModalBackdrop =
    document.getElementById(
        "requestModalBackdrop"
    );


const closeRequestModalButton =
    document.getElementById(
        "closeRequestModalButton"
    );


const requestModalTitle =
    document.getElementById(
        "requestModalTitle"
    );


const requestModalClient =
    document.getElementById(
        "requestModalClient"
    );


const requestModalDepartment =
    document.getElementById(
        "requestModalDepartment"
    );


const requestModalClientEmail =
    document.getElementById(
        "requestModalClientEmail"
    );


const requestModalService =
    document.getElementById(
        "requestModalService"
    );


const requestModalBudget =
    document.getElementById(
        "requestModalBudget"
    );


const requestModalDeadline =
    document.getElementById(
        "requestModalDeadline"
    );


const requestModalCreatedDate =
    document.getElementById(
        "requestModalCreatedDate"
    );


const requestModalDescription =
    document.getElementById(
        "requestModalDescription"
    );


const requestModalMessage =
    document.getElementById(
        "requestModalMessage"
    );


const requestModalActions =
    document.getElementById(
        "requestModalActions"
    );


const modalRejectRequestButton =
    document.getElementById(
        "modalRejectRequestButton"
    );


const modalAcceptRequestButton =
    document.getElementById(
        "modalAcceptRequestButton"
    );


/* =========================================================
   REQUEST CONFIGURATION
========================================================= */

const REQUEST_CONFIG =
    Object.freeze({

        REQUESTS_PER_PAGE:
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
            approval_status,
            availability_status,
            rejection_reason,
            created_at,
            updated_at

        `,


        REQUEST_COLUMNS: `
            id,
            request_id,
            freelancer_id,
            status,
            admin_note,
            freelancer_response_note,
            assigned_at,
            responded_at,
            created_at,
            updated_at,
            service_requests (
                id,
                client_id,
                contact_email,
                title,
                service_category,
                description,
                required_skills,
                budget,
                deadline,
                status,
                profiles!service_requests_client_id_fkey (
                    full_name,
                    department
                )
            )
        `

    });


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentFreelancerProfile = null;

let currentRequests = [];

let filteredRequests = [];

let selectedRequest = null;

let currentPage = 1;

let requestActionInProgress = false;


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
            REQUEST_CONFIG
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

        approval_status:
            cleanText(
                freelancerProfile
                    .approval_status
            ).toLowerCase()

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
            REQUEST_CONFIG
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


    return normalizeFreelancerProfile(data);

}


/* =========================================================
   NORMALIZE ASSIGNED REQUEST
========================================================= */

function normalizeAssignedRequest(
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

        freelancer_id:
            cleanText(
                assignment.freelancer_id
            ),

        client_id:
            cleanText(
                request.client_id
            ),

        client_name:
            cleanText(
                clientProfile.full_name
            ) ||
            "Campus User",

        client_department:
            cleanText(
                clientProfile.department
            ) ||
            "KPRIET",

        client_contact_email:
            cleanText(
                request.contact_email
            ),

        title:
            cleanText(
                request.title
            ),

        service_category:
            cleanText(
                request.service_category
            ),

        description:
            cleanText(
                request.description
            ),

        budget:
            request.budget,

        deadline:
            request.deadline,

        status:
            cleanText(
                assignment.status
            ).toLowerCase(),

        responded_at:
            assignment.responded_at ??
            null,

        created_at:
            assignment.created_at ??
            null,

        updated_at:
            assignment.updated_at ??
            null

    };

}


/* =========================================================
   GET ASSIGNED REQUESTS
========================================================= */

async function getAssignedRequests(
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
            REQUEST_CONFIG
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
        data ??
        []
    )
        .map(
            normalizeAssignedRequest
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
   NORMALIZE REQUEST STATUS
========================================================= */

function normalizeRequestStatus(
    requestStatus
) {

    const status = cleanText(
        requestStatus
    ).toLowerCase();

    if (status === "declined") {
        return "rejected";
    }

    return status;

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatRequestStatus(
    requestStatus
) {

    const status =
        normalizeRequestStatus(
            requestStatus
        );


    const statusLabels = {

        pending:
            "Pending",

        assigned:
            "Pending",

        accepted:
            "Accepted",

        rejected:
            "Rejected",

        in_progress:
            "In Progress",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };


    return (
        statusLabels[status] ||
        "Request"
    );

}


/* =========================================================
   GET FILTER STATUS
========================================================= */

function getFilterStatus(
    requestStatus
) {

    const status =
        normalizeRequestStatus(
            requestStatus
        );


    if (

        status === "pending" ||

        status === "assigned"

    ) {

        return "pending";

    }


    return status;

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

    const budget =
        Number(
            budgetValue
        );


    if (

        !Number.isFinite(
            budget
        )

        ||

        budget < 0

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
        budget
    );

}


/* =========================================================
   CREATE DESCRIPTION PREVIEW
========================================================= */

function createDescriptionPreview(
    description,
    maximumLength = 180
) {

    const safeDescription =
        cleanText(
            description
        );


    if (
        !safeDescription
    ) {

        return "Request description unavailable.";

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
   SORT REQUESTS
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
                    firstRequest.created_at
                ).getTime();


            const secondDate =
                new Date(
                    secondRequest.created_at
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
   CALCULATE REQUEST SUMMARY
========================================================= */

function calculateRequestSummary() {

    const safeRequests =
        Array.isArray(
            currentRequests
        )
            ? currentRequests
            : [];


    const pending =
        safeRequests.filter(
            (request) =>

                getFilterStatus(
                    request.status
                ) ===
                "pending"

        ).length;


    const accepted =
        safeRequests.filter(
            (request) =>

                getFilterStatus(
                    request.status
                ) ===
                "accepted"

        ).length;


    const rejected =
        safeRequests.filter(
            (request) =>

                getFilterStatus(
                    request.status
                ) ===
                "rejected"

        ).length;


    return {

        all:
            safeRequests.length,

        pending,

        accepted,

        rejected

    };

}


/* =========================================================
   RENDER REQUEST SUMMARY
========================================================= */

function renderRequestSummary() {

    const summary =
        calculateRequestSummary();


    setText(

        allRequestsCount,

        String(
            summary.all
        )

    );


    setText(

        pendingRequestsCount,

        String(
            summary.pending
        )

    );


    setText(

        acceptedRequestsCount,

        String(
            summary.accepted
        )

    );


    setText(

        rejectedRequestsCount,

        String(
            summary.rejected
        )

    );

}


/* =========================================================
   GET SEARCH VALUE
========================================================= */

function getSearchValue() {

    return cleanText(
        requestSearchInput?.value
    ).toLowerCase();

}


/* =========================================================
   GET STATUS FILTER VALUE
========================================================= */

function getStatusFilterValue() {

    const filterValue =
        cleanText(
            requestStatusFilter?.value
        ).toLowerCase();


    return (
        filterValue ||
        "all"
    );

}


/* =========================================================
   REQUEST MATCHES SEARCH
========================================================= */

function requestMatchesSearch(
    request,
    searchValue
) {

    if (
        !searchValue
    ) {

        return true;

    }


    const searchableValues = [

        request.title,

        request.client_name,

        request.client_department,

        request.service_category,

        request.description

    ];


    return searchableValues.some(
        (value) =>

            cleanText(
                value
            )
                .toLowerCase()
                .includes(
                    searchValue
                )
    );

}


/* =========================================================
   REQUEST MATCHES STATUS
========================================================= */

function requestMatchesStatus(
    request,
    statusFilter
) {

    if (

        !statusFilter ||

        statusFilter ===
        "all"

    ) {

        return true;

    }


    return (

        getFilterStatus(
            request.status
        )

        ===

        statusFilter

    );

}


/* =========================================================
   FILTER REQUESTS
========================================================= */

function filterRequests() {

    const searchValue =
        getSearchValue();


    const statusFilter =
        getStatusFilterValue();


    filteredRequests =
        sortRequestsByDate(
            currentRequests
        ).filter(
            (request) =>

                requestMatchesSearch(
                    request,
                    searchValue
                )

                &&

                requestMatchesStatus(
                    request,
                    statusFilter
                )
        );

}


/* =========================================================
   UPDATE FILTER INFORMATION
========================================================= */

function updateFilterInformation() {

    const searchValue =
        getSearchValue();


    const statusFilter =
        getStatusFilterValue();


    const hasSearch =
        Boolean(
            searchValue
        );


    const hasStatusFilter =
        statusFilter !==
        "all";


    const filtersActive =

        hasSearch ||

        hasStatusFilter;


    clearRequestFiltersButton
        ?.classList.toggle(

            "hidden",

            !filtersActive

        );


    if (
        !filtersActive
    ) {

        setText(

            activeRequestFilterText,

            "Showing all assigned requests"

        );


        return;

    }


    const filterInformation =
        [];


    if (
        hasSearch
    ) {

        filterInformation.push(

            `Search: "${cleanText(
                requestSearchInput?.value
            )}"`

        );

    }


    if (
        hasStatusFilter
    ) {

        filterInformation.push(

            `Status: ${
                statusFilter
                    .charAt(0)
                    .toUpperCase()
                +
                statusFilter.slice(1)
            }`

        );

    }


    setText(

        activeRequestFilterText,

        filterInformation.join(
            " · "
        )

    );

}


/* =========================================================
   GET TOTAL PAGES
========================================================= */

function getTotalPages() {

    return Math.max(

        1,

        Math.ceil(

            filteredRequests.length /

            REQUEST_CONFIG
                .REQUESTS_PER_PAGE

        )

    );

}


/* =========================================================
   GET CURRENT PAGE REQUESTS
========================================================= */

function getCurrentPageRequests() {

    const startIndex =

        (
            currentPage - 1
        )

        *

        REQUEST_CONFIG
            .REQUESTS_PER_PAGE;


    const endIndex =

        startIndex

        +

        REQUEST_CONFIG
            .REQUESTS_PER_PAGE;


    return filteredRequests.slice(

        startIndex,

        endIndex

    );

}


/* =========================================================
   CREATE META ITEM
========================================================= */

function createMetaItem(
    label,
    value
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "freelancer-request-meta-item";


    const labelElement =
        document.createElement(
            "span"
        );


    labelElement.textContent =
        label;


    const valueElement =
        document.createElement(
            "strong"
        );


    valueElement.textContent =
        value;


    item.append(

        labelElement,

        valueElement

    );


    return item;

}


/* =========================================================
   CREATE CARD BUTTON
========================================================= */

function createCardButton(
    label,
    className,
    clickHandler
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =

        `freelancer-request-card-button ${className}`
            .trim();


    button.textContent =
        label;


    button.addEventListener(

        "click",

        clickHandler

    );


    return button;

}


/* =========================================================
   OPEN ACTIVE WORK
========================================================= */

function openActiveWork(
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

        ROUTES.FREELANCER_WORKS,

        {

            request:
                safeRequestId

        }

    );

}


/* =========================================================
   CREATE REQUEST CARD
========================================================= */

function createRequestCard(
    request
) {

    const requestCard =
        document.createElement(
            "article"
        );


    requestCard.className =
        "freelancer-request-card";


    const cardHeader =
        document.createElement(
            "div"
        );


    cardHeader.className =
        "freelancer-request-card-header";


    const headingContent =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "freelancer-request-card-title";


    title.textContent =

        cleanText(
            request.title
        )

        ||

        "Service Request";


    const service =
        document.createElement(
            "p"
        );


    service.className =
        "freelancer-request-card-service";


    service.textContent =

        cleanText(
            request.service_category
        )

        ||

        "Campus Service";


    headingContent.append(

        title,

        service

    );


    const status =
        document.createElement(
            "span"
        );


    const normalizedStatus =
        normalizeRequestStatus(
            request.status
        );


    status.className =

        `freelancer-request-status-badge ${normalizedStatus}`;


    status.textContent =
        formatRequestStatus(
            request.status
        );


    cardHeader.append(

        headingContent,

        status

    );


    const description =
        document.createElement(
            "p"
        );


    description.className =
        "freelancer-request-card-description";


    description.textContent =
        createDescriptionPreview(
            request.description
        );


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "freelancer-request-card-meta";


    meta.append(

        createMetaItem(

            "CLIENT",

            cleanText(
                request.client_name
            ) ||
            "Campus User"

        ),

        createMetaItem(

            "DEPARTMENT",

            cleanText(
                request.client_department
            ) ||
            "KPRIET"

        ),

        createMetaItem(

            "BUDGET",

            formatBudget(
                request.budget
            )

        ),

        createMetaItem(

            "DEADLINE",

            formatDate(
                request.deadline
            )

        )

    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "freelancer-request-card-actions";


    const viewButton =
        createCardButton(

            "View Details",

            "",

            () => {

                openRequestModal(
                    request.id
                );

            }

        );


    actions.appendChild(
        viewButton
    );


    const requestStatus =
        getFilterStatus(
            request.status
        );


    if (
        requestStatus ===
        "pending"
    ) {

        const rejectButton =
            createCardButton(

                "Reject",

                "reject",

                () => {

                    openRequestModal(
                        request.id
                    );

                }

            );


        const acceptButton =
            createCardButton(

                "Accept",

                "accept",

                () => {

                    openRequestModal(
                        request.id
                    );

                }

            );


        actions.append(

            rejectButton,

            acceptButton

        );

    }


  // No additional action button for accepted requests.


    requestCard.append(

        cardHeader,

        description,

        meta,

        actions

    );


    return requestCard;

}


/* =========================================================
   RENDER EMPTY STATE
========================================================= */

function renderEmptyState() {

    const filtersActive =

        Boolean(
            getSearchValue()
        )

        ||

        getStatusFilterValue() !==
        "all";


    if (
        filtersActive
    ) {

        setText(

            requestEmptyStateTitle,

            "No matching requests"

        );


        setText(

            requestEmptyStateDescription,

            "No service requests match the current search or status filter."

        );


        return;

    }


    setText(

        requestEmptyStateTitle,

        "No service requests yet"

    );


    setText(

        requestEmptyStateDescription,

        "Service requests assigned to your freelancer profile will appear here."

    );

}


/* =========================================================
   RENDER REQUEST LIST
========================================================= */

function renderRequestList() {

    if (

        !requestList ||

        !requestEmptyState

    ) {

        return;

    }


    requestList
        .replaceChildren();


    setText(

        requestResultCount,

        `${filteredRequests.length} ${
            filteredRequests.length === 1
                ? "request"
                : "requests"
        }`

    );


    if (
        filteredRequests.length ===
        0
    ) {

        hideElement(
            requestList
        );


        showElement(
            requestEmptyState
        );


        hideElement(
            requestPagination
        );


        renderEmptyState();


        return;

    }


    hideElement(
        requestEmptyState
    );


    showElement(
        requestList
    );


    const pageRequests =
        getCurrentPageRequests();


    const fragment =
        document.createDocumentFragment();


    pageRequests.forEach(
        (request) => {

            fragment.appendChild(

                createRequestCard(
                    request
                )

            );

        }
    );


    requestList.appendChild(
        fragment
    );


    renderPagination();

}


/* =========================================================
   CREATE PAGINATION NUMBER
========================================================= */

function createPaginationNumber(
    pageNumber
) {

    const button =
        document.createElement(
            "button"
        );


    button.type =
        "button";


    button.className =
        "freelancer-pagination-number";


    button.textContent =
        String(
            pageNumber
        );


    button.setAttribute(

        "aria-label",

        `Go to page ${pageNumber}`

    );


    if (
        pageNumber ===
        currentPage
    ) {

        button.classList.add(
            "active"
        );


        button.setAttribute(

            "aria-current",

            "page"

        );

    }


    button.addEventListener(

        "click",

        () => {

            changePage(
                pageNumber
            );

        }

    );


    return button;

}


/* =========================================================
   RENDER PAGINATION
========================================================= */

function renderPagination() {

    if (

        !requestPagination ||

        !requestPaginationNumbers

    ) {

        return;

    }


    const totalPages =
        getTotalPages();


    if (
        totalPages <=
        1
    ) {

        hideElement(
            requestPagination
        );


        return;

    }


    showElement(
        requestPagination
    );


    requestPaginationNumbers
        .replaceChildren();


    for (

        let pageNumber = 1;

        pageNumber <= totalPages;

        pageNumber += 1

    ) {

        requestPaginationNumbers
            .appendChild(

                createPaginationNumber(
                    pageNumber
                )

            );

    }


    if (
        previousRequestPageButton
    ) {

        previousRequestPageButton.disabled =
            currentPage === 1;

    }


    if (
        nextRequestPageButton
    ) {

        nextRequestPageButton.disabled =
            currentPage === totalPages;

    }

}


/* =========================================================
   CHANGE PAGE
========================================================= */

function changePage(
    pageNumber
) {

    const totalPages =
        getTotalPages();


    const safePage =
        Math.min(

            Math.max(

                Number(
                    pageNumber
                ) || 1,

                1

            ),

            totalPages

        );


    if (
        safePage ===
        currentPage
    ) {

        return;

    }


    currentPage =
        safePage;


    renderRequestList();


    requestList
        ?.scrollIntoView({

            behavior:
                "smooth",

            block:
                "start"

        });

}


/* =========================================================
   APPLY REQUEST FILTERS
========================================================= */

function applyRequestFilters() {

    currentPage = 1;


    filterRequests();


    updateFilterInformation();


    renderRequestList();

}


/* =========================================================
   CLEAR REQUEST FILTERS
========================================================= */

function clearRequestFilters() {

    if (
        requestSearchInput
    ) {

        requestSearchInput.value =
            "";

    }


    if (
        requestStatusFilter
    ) {

        requestStatusFilter.value =
            "all";

    }


    applyRequestFilters();

}


/* =========================================================
   FIND REQUEST
========================================================= */

function findRequestById(
    requestId
) {

    const safeRequestId =
        cleanText(
            requestId
        );


    if (
        !safeRequestId
    ) {

        return null;

    }


    return (

        currentRequests.find(
            (request) =>

                String(
                    request.id
                )

                ===

                safeRequestId
        )

        ||

        null

    );

}


/* =========================================================
   CLEAR MODAL MESSAGE
========================================================= */

function clearModalMessage() {

    if (
        !requestModalMessage
    ) {

        return;

    }


    requestModalMessage.textContent =
        "";


    requestModalMessage.classList.remove(

        "success",

        "error"

    );


    hideElement(
        requestModalMessage
    );

}


/* =========================================================
   SHOW MODAL MESSAGE
========================================================= */

function showModalMessage(
    message,
    type = "error"
) {

    if (
        !requestModalMessage
    ) {

        return;

    }


    requestModalMessage.textContent =
        message;


    requestModalMessage.classList.remove(

        "success",

        "error"

    );


    requestModalMessage.classList.add(
        type
    );


    showElement(
        requestModalMessage
    );

}


/* =========================================================
   RENDER MODAL ACTIONS
========================================================= */

function renderModalActions(
    request
) {

    if (

        !requestModalActions ||

        !modalAcceptRequestButton ||

        !modalRejectRequestButton

    ) {

        return;

    }


    const status =
        getFilterStatus(
            request.status
        );


    const isPending =
        status ===
        "pending";


    requestModalActions.classList.toggle(

        "hidden",

        !isPending

    );


    modalAcceptRequestButton.disabled =
        false;


    modalRejectRequestButton.disabled =
        false;

}


/* =========================================================
   OPEN REQUEST MODAL
========================================================= */

function openRequestModal(
    requestId
) {

    const request =
        findRequestById(
            requestId
        );


    if (
        !request
    ) {

        return;

    }


    selectedRequest =
        request;


    clearModalMessage();


    setText(

        requestModalTitle,

        cleanText(
            request.title
        ) ||
        "Request Details"

    );


    setText(

        requestModalClient,

        cleanText(
            request.client_name
        ) ||
        "Campus User"

    );


    setText(

        requestModalDepartment,

        cleanText(
            request.client_department
        ) ||
        "KPRIET"

    );


    if (
        request.status === "accepted"
    ) {

        if (
            request.client_contact_email
        ) {

            setText(
                requestModalClientEmail,
                request.client_contact_email
            );

        } else {

            setText(
                requestModalClientEmail,
                "Contact email unavailable"
            );

        }

    } else {

        setText(
            requestModalClientEmail,
            "Hidden until you accept this request."
        );

    }


    setText(

        requestModalService,

        cleanText(
            request.service_category
        ) ||
        "Campus Service"

    );


    setText(

        requestModalBudget,

        formatBudget(
            request.budget
        )

    );


    setText(

        requestModalDeadline,

        formatDate(
            request.deadline
        )

    );


    setText(

        requestModalCreatedDate,

        formatDate(
            request.created_at
        )

    );


    setText(

        requestModalDescription,

        cleanText(
            request.description
        )

        ||

        "Request description unavailable."

    );


    renderModalActions(
        request
    );


    showElement(
        requestDetailsModal
    );


    document.body.style.overflow =
        "hidden";


    closeRequestModalButton
        ?.focus();

}


/* =========================================================
   CLOSE REQUEST MODAL
========================================================= */

function closeRequestModal() {

    if (
        requestActionInProgress
    ) {

        return;

    }


    hideElement(
        requestDetailsModal
    );


    document.body.style.overflow =
        "";


    selectedRequest =
        null;


    clearModalMessage();

}


/* =========================================================
   UPDATE REQUEST STATUS
========================================================= */

async function updateRequestStatus(
    requestId,
    requestStatus
) {

    const safeRequestId =
        cleanText(
            requestId
        );


    const safeRequestStatus =
        normalizeRequestStatus(
            requestStatus
        );


    let dbStatus = safeRequestStatus;
    if (safeRequestStatus === "rejected") {
        dbStatus = "declined";
    }


    if (

        !safeRequestId

        ||

        (
            dbStatus !==
            "accepted"

            &&

            dbStatus !==
            "declined"
        )

    ) {

        throw new Error(
            "Invalid request status update."
        );

    }


    if (
        !currentFreelancerProfile?.userId
    ) {

        throw new Error(
            "Freelancer profile is unavailable."
        );

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

        .update({

            status:
                dbStatus,

            responded_at:
                new Date()
                    .toISOString(),

            updated_at:
                new Date()
                    .toISOString()

        })

        .eq(
            "id",
            safeRequestId
        )

        .eq(
            "freelancer_id",
            currentFreelancerProfile.userId
        )

        .eq(
            "status",
            "pending"
        )

        .select(
            REQUEST_CONFIG
                .REQUEST_COLUMNS
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
            "The request is no longer available for response."
        );

    }


    return normalizeAssignedRequest(
        data
    );

}


/* =========================================================
   UPDATE LOCAL REQUEST
========================================================= */

function updateLocalRequest(
    updatedRequest
) {

    if (
        !updatedRequest?.id
    ) {

        return;

    }


    currentRequests =
        currentRequests.map(
            (request) => {

                if (

                    String(
                        request.id
                    )

                    !==

                    String(
                        updatedRequest.id
                    )

                ) {

                    return request;

                }


                return {

                    ...request,

                    ...updatedRequest

                };

            }
        );


    selectedRequest =
        findRequestById(
            updatedRequest.id
        );

}


/* =========================================================
   REFRESH REQUEST INTERFACE
========================================================= */

function refreshRequestInterface() {

    renderRequestSummary();


    filterRequests();


    const totalPages =
        getTotalPages();


    if (
        currentPage >
        totalPages
    ) {

        currentPage =
            totalPages;

    }


    updateFilterInformation();


    renderRequestList();

}


/* =========================================================
   SET ACTION BUTTON STATE
========================================================= */

function setActionButtonState(
    isProcessing,
    actionType = ""
) {

    if (
        modalAcceptRequestButton
    ) {

        modalAcceptRequestButton.disabled =
            isProcessing;


        modalAcceptRequestButton.textContent =

            (
                isProcessing

                &&

                actionType ===
                "accepted"
            )

                ? "Accepting..."

                : "Accept Request";

    }


    if (
        modalRejectRequestButton
    ) {

        modalRejectRequestButton.disabled =
            isProcessing;


        modalRejectRequestButton.textContent =

            (
                isProcessing

                &&

                actionType ===
                "rejected"
            )

                ? "Rejecting..."

                : "Reject Request";

    }

}


/* =========================================================
   HANDLE REQUEST ACTION
========================================================= */

async function handleRequestAction(
    nextStatus
) {

    if (

        !selectedRequest ||

        requestActionInProgress

    ) {

        return;

    }


    const currentStatus =
        getFilterStatus(
            selectedRequest.status
        );


    if (
        currentStatus !==
        "pending"
    ) {

        showModalMessage(

            "This service request has already been responded to.",

            "error"

        );


        return;

    }


    if (

        nextStatus !==
        "accepted"

        &&

        nextStatus !==
        "rejected"

    ) {

        return;

    }


    requestActionInProgress =
        true;


    setActionButtonState(

        true,

        nextStatus

    );


    clearModalMessage();


    try {

        const updatedRequest =
            await updateRequestStatus(

                selectedRequest.id,

                nextStatus

            );


        updateLocalRequest(
            updatedRequest
        );


        refreshRequestInterface();


        renderModalActions(
            selectedRequest
        );


        showModalMessage(

            nextStatus ===
            "accepted"

                ? "Service request accepted successfully. The request is now available in your work workspace."

                : "Service request rejected successfully. The admin can review and reassign the request.",

            "success"

        );


    } catch (error) {

        console.error(
            "Request action error:",
            error
        );


        showModalMessage(

            error?.message

            ||

            "Unable to update the service request. Please try again.",

            "error"

        );


    } finally {

        requestActionInProgress =
            false;


        setActionButtonState(
            false
        );

    }

}


/* =========================================================
   SHOW LOADING STATE
========================================================= */

function showLoadingState() {

    showElement(
        freelancerRequestsLoadingState
    );


    hideElement(
        freelancerRequestsAccessState
    );


    hideElement(
        freelancerRequestsContent
    );

}


/* =========================================================
   SHOW REQUEST CONTENT
========================================================= */

function showRequestContent() {

    hideElement(
        freelancerRequestsLoadingState
    );


    hideElement(
        freelancerRequestsAccessState
    );


    showElement(
        freelancerRequestsContent
    );

}


/* =========================================================
   SHOW ACCESS STATE
========================================================= */

function showAccessState(
    title,
    message
) {

    hideElement(
        freelancerRequestsLoadingState
    );


    hideElement(
        freelancerRequestsContent
    );


    showElement(
        freelancerRequestsAccessState
    );


    setText(

        freelancerRequestsAccessTitle,

        title

    );


    setText(

        freelancerRequestsAccessMessage,

        message

    );

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

            "Freelancer profile required",

            "Create a freelancer profile and receive admin approval before accessing assigned service requests."

        );


        return false;

    }


    const approvalStatus =
        cleanText(
            freelancerProfile
                .approval_status
        ).toLowerCase();


    if (
        approvalStatus ===
        "pending"
    ) {

        showAccessState(

            "Freelancer profile under review",

            "Your freelancer profile is currently waiting for admin approval. Service request access will be available after approval."

        );


        return false;

    }


    if (
        approvalStatus ===
        "rejected"
    ) {

        showAccessState(

            "Freelancer profile requires review",

            "Your freelancer profile has not been approved. Review your registration details before accessing service requests."

        );


        return false;

    }


    if (
        approvalStatus !==
        "approved"
    ) {

        showAccessState(

            "Service requests unavailable",

            "An approved freelancer profile is required to access assigned service requests."

        );


        return false;

    }


    return true;

}


/* =========================================================
   NAVIGATION
========================================================= */

function openFreelancerDashboard() {

    navigateTo(
        ROUTES.FREELANCER_DASHBOARD
    );

}


function openMainDashboard() {

    navigateTo(
        ROUTES.MAIN_DASHBOARD
    );

}


/* =========================================================
   HANDLE QUERY REQUEST
========================================================= */

function handleRequestQueryParameter() {

    const queryParameters =
        new URLSearchParams(
            window.location.search
        );


    const requestId =
        cleanText(
            queryParameters.get(
                "request"
            )
        );


    if (
        !requestId
    ) {

        return;

    }


    const request =
        findRequestById(
            requestId
        );


    if (
        !request
    ) {

        return;

    }


    openRequestModal(
        request.id
    );

}


/* =========================================================
   HANDLE KEYBOARD EVENTS
========================================================= */

function handleKeyboardEvent(
    event
) {

    if (
        event.key !==
        "Escape"
    ) {

        return;

    }


    if (
        requestDetailsModal
            ?.classList.contains(
                "hidden"
            )
    ) {

        return;

    }


    closeRequestModal();

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    freelancerDashboardButton
        ?.addEventListener(

            "click",

            openFreelancerDashboard

        );


    accessFreelancerDashboardButton
        ?.addEventListener(

            "click",

            openFreelancerDashboard

        );


    accessMainDashboardButton
        ?.addEventListener(

            "click",

            openMainDashboard

        );


    requestSearchInput
        ?.addEventListener(

            "input",

            applyRequestFilters

        );


    requestStatusFilter
        ?.addEventListener(

            "change",

            applyRequestFilters

        );


    clearRequestFiltersButton
        ?.addEventListener(

            "click",

            clearRequestFilters

        );


    previousRequestPageButton
        ?.addEventListener(

            "click",

            () => {

                changePage(
                    currentPage - 1
                );

            }

        );


    nextRequestPageButton
        ?.addEventListener(

            "click",

            () => {

                changePage(
                    currentPage + 1
                );

            }

        );


    closeRequestModalButton
        ?.addEventListener(

            "click",

            closeRequestModal

        );


    requestModalBackdrop
        ?.addEventListener(

            "click",

            closeRequestModal

        );


    modalAcceptRequestButton
        ?.addEventListener(

            "click",

            () => {

                handleRequestAction(
                    "accepted"
                );

            }

        );


    modalRejectRequestButton
        ?.addEventListener(

            "click",

            () => {

                handleRequestAction(
                    "rejected"
                );

            }

        );


    document.addEventListener(

        "keydown",

        handleKeyboardEvent

    );

}


/* =========================================================
   INITIALIZE FREELANCER REQUESTS
========================================================= */

async function initializeFreelancerRequests(
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


            filteredRequests =
                [];


            return;

        }


        currentRequests =
            await getAssignedRequests(
                currentFreelancerProfile.userId
            );


        if (
            !Array.isArray(
                currentRequests
            )
        ) {

            currentRequests =
                [];

        }


        renderRequestSummary();


        filterRequests();


        updateFilterInformation();


        renderRequestList();


        showRequestContent();


        handleRequestQueryParameter();


    } catch (error) {

        console.error(
            "Freelancer requests initialization error:",
            error
        );


        currentFreelancerProfile =
            null;


        currentRequests =
            [];


        filteredRequests =
            [];


        selectedRequest =
            null;


        showAccessState(

            "Unable to load service requests",

            "The service request workspace could not be loaded. Please return to the freelancer dashboard and try again."

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
            initializeFreelancerRequests
        );

    }

);