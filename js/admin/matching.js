/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Freelancer Matching Logic
   File: js/admin/matching.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    cleanText,

    getInitials,

    setText,

    showElement,

    hideElement

} from "../utils/helpers.js";


import {

    ROUTES,

    navigateTo

} from "../utils/navigation.js";


import {

    initializeAdministratorPage

} from "./admin-guard.js";


/* =========================================================
   ADMIN MATCHING CONFIGURATION

   FIX:
   service_requests no longer has a "category" column.
   The current schema uses "service_category", and skills
   are stored in "required_skills". REQUEST_COLUMNS has been
   updated to match the live table exactly.
========================================================= */

const ADMIN_MATCHING_CONFIG =
    Object.freeze({

REQUEST_COLUMNS: `

    id,
    display_id,
    client_id,
    title,
    service_category,
    description,
    required_skills,
    budget,
    deadline,
    status,
    admin_review_note,
    reviewed_by,
    reviewed_at,
    created_at,
    updated_at

`,


        ASSIGNMENT_COLUMNS: `

            id,
            request_id,
            freelancer_id,
            status,
            assigned_at

        `

    });


/* =========================================================
   DOM REFERENCES
========================================================= */

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


const backToAdminDashboardButton =
    document.getElementById(
        "backToAdminDashboardButton"
    );


const waitingForMatchCount =
    document.getElementById(
        "waitingForMatchCount"
    );


const availableFreelancersCount =
    document.getElementById(
        "availableFreelancersCount"
    );


const matchedRequestsCount =
    document.getElementById(
        "matchedRequestsCount"
    );


const activeWorksCount =
    document.getElementById(
        "activeWorksCount"
    );


const matchingSearchInput =
    document.getElementById(
        "matchingSearchInput"
    );


const matchingCategoryFilter =
    document.getElementById(
        "matchingCategoryFilter"
    );


const matchingStatusFilter =
    document.getElementById(
        "matchingStatusFilter"
    );


const matchingSortSelect =
    document.getElementById(
        "matchingSortSelect"
    );


const matchingResultCount =
    document.getElementById(
        "matchingResultCount"
    );


const clearMatchingFiltersButton =
    document.getElementById(
        "clearMatchingFiltersButton"
    );


const matchingLoadingState =
    document.getElementById(
        "matchingLoadingState"
    );


const adminMatchingRequestList =
    document.getElementById(
        "adminMatchingRequestList"
    );


const matchingEmptyState =
    document.getElementById(
        "matchingEmptyState"
    );


const matchingNoResultState =
    document.getElementById(
        "matchingNoResultState"
    );


const matchingErrorState =
    document.getElementById(
        "matchingErrorState"
    );


const matchingErrorMessage =
    document.getElementById(
        "matchingErrorMessage"
    );


const resetMatchingFiltersButton =
    document.getElementById(
        "resetMatchingFiltersButton"
    );


const retryMatchingLoadButton =
    document.getElementById(
        "retryMatchingLoadButton"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentAdmin = null;

let matchingRequests = [];

let visibleMatchingRequests = [];

let availableFreelancerCount = 0;


/* =========================================================
   NORMALIZE NUMBER
========================================================= */

function normalizeNumber(
    value
) {

    const numericValue =
        Number(
            value
        );


    return Number.isFinite(
        numericValue
    )

        ? numericValue

        : 0;

}


/* =========================================================
   NORMALIZE STRING ARRAY

   FIX:
   Added to support the required_skills column, which is
   now part of REQUEST_COLUMNS.
========================================================= */

function normalizeStringArray(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        return [

            ...new Set(

                value

                    .map(
                        (item) => {

                            return cleanText(
                                item
                            );

                        }
                    )

                    .filter(
                        Boolean
                    )

            )

        ];

    }


    if (
        typeof value === "string"
    ) {

        return [

            ...new Set(

                value

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
                    )

            )

        ];

    }


    return [];

}


/* =========================================================
   NORMALIZE MATCHING STATUS
========================================================= */

function normalizeMatchingStatus(
    status
) {

    const normalizedStatus =
        cleanText(
            status
        )

            .toLowerCase()

            .replace(
                /[\s-]+/g,
                "_"
            );


    const statusMap = {

        approved:
            "waiting",

        waiting:
            "waiting",

        waiting_for_match:
            "waiting",

        freelancer_matching:
            "waiting",

        matching:
            "waiting",

        matched:
            "matched",

        assigned:
            "matched",

        freelancer_assigned:
            "matched",

        active:
            "active",

        active_work:
            "active",

        in_progress:
            "active",

        completed:
            "completed"

    };


    return (

        statusMap[
            normalizedStatus
        ]

        ||

        normalizedStatus

        ||

        "waiting"

    );

}


/* =========================================================
   NORMALIZE MATCHING REQUEST

   FIX:
   Reads request.title and request.service_category (the
   live column names) instead of the legacy service_title
   and category columns, and now also normalizes
   required_skills.
========================================================= */

function normalizeMatchingRequest(
    request
) {

    if (!request) {

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
            "Untitled Service Request",

        service_category:
            cleanText(
                request.service_category
            ) ||
            "Uncategorized",

        description:
            cleanText(
                request.description
            ),

        requiredSkills:
            normalizeStringArray(
                request.required_skills
            ),

        budget:
            normalizeNumber(
                request.budget
            ),

        deadline:
            request.deadline ??
            null,

        status:
            normalizeMatchingStatus(
                request.status
            ),

        databaseStatus:
            cleanText(
                request.status
            )
                .toLowerCase(),

        assignedFreelancerId:
            cleanText(
                request.assignment
                    ?.freelancer_id
            ),

        assignmentId:
            cleanText(
                request.assignment
                    ?.id
            ),

        assignmentStatus:
            cleanText(
                request.assignment
                    ?.status
            )
                .toLowerCase(),

        displayId:
            cleanText(
                request.display_id
            ),

        createdAt:
            request.created_at ??
            null

    };

}


/* =========================================================
   POPULATE ADMIN NAVBAR
========================================================= */

function populateAdminNavbar(
    administrator
) {

    const administratorName =
        cleanText(
            administrator?.full_name
        ) ||
        "Platform Administrator";


    setText(

        navbarUserName,

        administratorName

    );


    setText(

        navbarUserRole,

        "PLATFORM ADMINISTRATOR"

    );


    setText(

        navbarUserAvatar,

        getInitials(
            administratorName
        )

    );

}


/* =========================================================
   GET MATCHING WORKSPACE DATA
========================================================= */

async function getMatchingWorkspaceData() {

    const client =
        requireSupabaseClient();


    const [

        requestResult,

        assignmentResult,

        freelancerResult

    ] = await Promise.all([

        client

            .from(
                "service_requests"
            )

            .select(
                ADMIN_MATCHING_CONFIG
                    .REQUEST_COLUMNS
            )

            .in(
                "status",
                [

                    "approved",

                    "matching",

                    "assigned",

                    "active"

                ]
            )

            .order(
                "created_at",
                {

                    ascending:
                        false

                }
            ),


        client

            .from(
                "service_assignments"
            )

            .select(
                ADMIN_MATCHING_CONFIG
                    .ASSIGNMENT_COLUMNS
            ),


        client

            .from(
                "freelancer_profiles"
            )

            .select(
                "id",
                {

                    count:
                        "exact",

                    head:
                        true

                }
            )

            .eq(
                "approval_status",
                "approved"
            )

            .eq(
                "availability_status",
                "available"
            )

    ]);


    if (
        requestResult.error
    ) {

        throw requestResult.error;

    }


    if (
        assignmentResult.error
    ) {

        throw assignmentResult.error;

    }


    if (
        freelancerResult.error
    ) {

        throw freelancerResult.error;

    }


    const assignmentsByRequest =
        new Map();


    (
        assignmentResult.data ??
        []
    ).forEach(
        (assignment) => {

            const requestIdentifier =
                cleanText(
                    assignment.request_id
                );


            if (
                !requestIdentifier
            ) {

                return;

            }


            assignmentsByRequest.set(

                requestIdentifier,

                assignment

            );

        }
    );


    const requests =
        (
            requestResult.data ??
            []
        )

            .map(
                (request) => {

                    return {

                        ...request,

                        assignment:
                            assignmentsByRequest.get(
                                cleanText(
                                    request.id
                                )
                            )
                            ??
                            null

                    };

                }
            )

            .map(
                normalizeMatchingRequest
            )

            .filter(
                Boolean
            );


    return {

        requests,

        availableFreelancerCount:
            normalizeNumber(
                freelancerResult.count
            )

    };

}


/* =========================================================
   FORMAT MATCHING STATUS
========================================================= */

function formatMatchingStatus(
    status
) {

    const labels = {

        waiting:
            "Waiting for Match",

        matched:
            "Matched",

        active:
            "Active Work",

        completed:
            "Completed"

    };


    return (

        labels[
            normalizeMatchingStatus(
                status
            )
        ]

        ||

        "Waiting for Match"

    );

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(
    value
) {

    const amount =
        normalizeNumber(
            value
        );


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
        amount
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Not specified";

    }


    const date =
        new Date(
            value
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
   GET DATE TIME
========================================================= */

function getDateTime(
    value,
    fallback
) {

    if (!value) {

        return fallback;

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

        ? fallback

        : time;

}


/* =========================================================
   RENDER MATCHING OVERVIEW
========================================================= */

function renderMatchingOverview() {

    const waitingRequests =
        matchingRequests.filter(
            (request) => {

                return (

                    request.status ===
                    "waiting"

                );

            }
        ).length;


    const matchedRequests =
        matchingRequests.filter(
            (request) => {

                return (

                    request.status ===
                    "matched"

                );

            }
        ).length;


    const activeRequests =
        matchingRequests.filter(
            (request) => {

                return (

                    request.status ===
                    "active"

                );

            }
        ).length;


    setText(

        waitingForMatchCount,

        String(
            waitingRequests
        )

    );


    setText(

        availableFreelancersCount,

        String(
            availableFreelancerCount
        )

    );


    setText(

        matchedRequestsCount,

        String(
            matchedRequests
        )

    );


    setText(

        activeWorksCount,

        String(
            activeRequests
        )

    );

}


/* =========================================================
   POPULATE CATEGORY FILTER

   FIX:
   Reads the normalized request.service_category field
   instead of the legacy request.category field.
========================================================= */

function populateCategoryFilter() {

    if (
        !matchingCategoryFilter
    ) {

        return;

    }


    const currentValue =
        matchingCategoryFilter.value;


    const categories = [

        ...new Set(

            matchingRequests

                .map(
                    (request) => {

                        return cleanText(
                            request.service_category
                        );

                    }
                )

                .filter(
                    Boolean
                )

        )

    ].sort(
        (
            firstCategory,
            secondCategory
        ) => {

            return firstCategory.localeCompare(
                secondCategory
            );

        }
    );


    matchingCategoryFilter
        .replaceChildren();


    const allCategoriesOption =
        document.createElement(
            "option"
        );


    allCategoriesOption.value =
        "all";


    setText(

        allCategoriesOption,

        "All Categories"

    );


    matchingCategoryFilter
        .appendChild(
            allCategoriesOption
        );


    categories.forEach(
        (category) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                category;


            setText(
                option,
                category
            );


            matchingCategoryFilter
                .appendChild(
                    option
                );

        }
    );


    const categoryExists =
        Array.from(
            matchingCategoryFilter.options
        )
            .some(
                (option) => {

                    return (

                        option.value ===
                        currentValue

                    );

                }
            );


    matchingCategoryFilter.value =

        categoryExists

            ? currentValue

            : "all";

}


/* =========================================================
   GET FILTER VALUES
========================================================= */

function getSearchValue() {

    return cleanText(
        matchingSearchInput?.value
    )
        .toLowerCase();

}


function getCategoryFilter() {

    return (

        matchingCategoryFilter?.value

        ||

        "all"

    );

}


function getStatusFilter() {

    return (

        matchingStatusFilter?.value

        ||

        "all"

    );

}


function getSortValue() {

    return (

        matchingSortSelect?.value

        ||

        "newest"

    );

}


/* =========================================================
   FILTER MATCHING REQUESTS

   FIX:
   Searches and filters against request.service_category
   instead of the legacy request.category field.
========================================================= */

function filterMatchingRequests(
    requests
) {

    const searchValue =
        getSearchValue();


    const categoryFilter =
        getCategoryFilter();


    const statusFilter =
        getStatusFilter();


    return requests.filter(
        (request) => {

            const searchableText = [

                request.id,

                request.title,

                request.service_category,

                request.description

            ]

                .join(
                    " "
                )

                .toLowerCase();


            const matchesSearch =

                !searchValue ||

                searchableText.includes(
                    searchValue
                );


            const matchesCategory =

                categoryFilter === "all" ||

                request.service_category ===
                categoryFilter;


            const matchesStatus =

                statusFilter === "all" ||

                request.status ===
                statusFilter;


            return (

                matchesSearch &&

                matchesCategory &&

                matchesStatus

            );

        }
    );

}


/* =========================================================
   SORT MATCHING REQUESTS
========================================================= */

function sortMatchingRequests(
    requests
) {

    const sortValue =
        getSortValue();


    const sortedRequests = [

        ...requests

    ];


    sortedRequests.sort(
        (
            firstRequest,
            secondRequest
        ) => {

            switch (
                sortValue
            ) {

                case "oldest":

                    return (

                        getDateTime(
                            firstRequest.createdAt,
                            0
                        )

                        -

                        getDateTime(
                            secondRequest.createdAt,
                            0
                        )

                    );


                case "deadline_asc":

                    return (

                        getDateTime(
                            firstRequest.deadline,
                            Number.MAX_SAFE_INTEGER
                        )

                        -

                        getDateTime(
                            secondRequest.deadline,
                            Number.MAX_SAFE_INTEGER
                        )

                    );


                case "budget_desc":

                    return (

                        secondRequest.budget

                        -

                        firstRequest.budget

                    );


                case "budget_asc":

                    return (

                        firstRequest.budget

                        -

                        secondRequest.budget

                    );


                case "newest":

                default:

                    return (

                        getDateTime(
                            secondRequest.createdAt,
                            0
                        )

                        -

                        getDateTime(
                            firstRequest.createdAt,
                            0
                        )

                    );

            }

        }
    );


    return sortedRequests;

}


/* =========================================================
   UPDATE RESULT COUNT
========================================================= */

function updateResultCount(
    count
) {

    const numericCount =
        Number(
            count
        );


    const safeCount =
        Number.isFinite(
            numericCount
        )

            ? numericCount

            : 0;


    setText(

        matchingResultCount,

        `${safeCount} ${

            safeCount === 1

                ? "request"

                : "requests"

        } found`

    );

}


/* =========================================================
   CREATE META ITEM
========================================================= */

function createMetaItem(
    labelValue,
    contentValue
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "admin-matching-meta-item";


    const label =
        document.createElement(
            "span"
        );


    setText(
        label,
        labelValue
    );


    const content =
        document.createElement(
            "strong"
        );


    setText(
        content,
        contentValue
    );


    item.append(
        label,
        content
    );


    return item;

}


/* =========================================================
   CREATE MATCHING REQUEST CARD

   FIX:
   Displays request.service_category instead of the legacy
   request.category field.
========================================================= */

function createMatchingRequestCard(
    request
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "admin-matching-request-card";


    card.tabIndex =
        0;


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(

        "aria-label",

        `Open matching workspace for ${
            request.title
        }`

    );


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "admin-matching-request-header";


    const titleContent =
        document.createElement(
            "div"
        );


    titleContent.className =
        "admin-matching-request-title-content";


    const category =
        document.createElement(
            "span"
        );


    category.className =
        "admin-matching-request-category";


    setText(
        category,
        request.service_category
    );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "admin-matching-request-title";


    setText(
        title,
        request.title
    );


    const requestIdentifier =
        document.createElement(
            "p"
        );


    requestIdentifier.className =
        "admin-matching-request-id";


    setText(

    requestIdentifier,

    request.displayId

        ? `REQUEST ID · ${
            request.displayId
        }`

        : "REQUEST ID UNAVAILABLE"

);


    titleContent.append(

        category,

        title,

        requestIdentifier

    );


    const status =
        document.createElement(
            "span"
        );


    status.className =

        `admin-matching-status ${
            request.status
        }`;


    setText(

        status,

        formatMatchingStatus(
            request.status
        )

    );


    header.append(
        titleContent,
        status
    );


    const description =
        document.createElement(
            "p"
        );


    description.className =
        "admin-matching-request-description";


    setText(

        description,

        request.description ||

        "No project description was provided."

    );


    const metaGrid =
        document.createElement(
            "div"
        );


    metaGrid.className =
        "admin-matching-meta-grid";


    metaGrid.append(

        createMetaItem(

            "BUDGET",

            formatCurrency(
                request.budget
            )

        ),

        createMetaItem(

            "DEADLINE",

            formatDate(
                request.deadline
            )

        ),

        createMetaItem(

            "SUBMITTED",

            formatDate(
                request.createdAt
            )

        )

    );


    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "admin-matching-request-footer";


    const assignmentState =
        document.createElement(
            "span"
        );


    assignmentState.className =
        "admin-matching-assignment-state";


    setText(

        assignmentState,

        request.assignmentId

            ? "Freelancer assignment recorded"

            : "No freelancer assigned"

    );


    const action =
        document.createElement(
            "span"
        );


    action.className =
        "admin-matching-request-action";


    setText(

        action,

        request.status === "waiting"

            ? "Match Freelancer →"

            : "View Assignment →"

    );


    footer.append(
        assignmentState,
        action
    );


    card.append(

        header,

        description,

        metaGrid,

        footer

    );


    const openMatchingRequest = () => {

        navigateTo(

            ROUTES
                .ADMIN_MATCHING_DETAILS,

            {

                request:
                    request.id

            }

        );

    };


    card.addEventListener(
        "click",
        openMatchingRequest
    );


    card.addEventListener(
        "keydown",
        (event) => {

            if (

                event.key === "Enter" ||

                event.key === " "

            ) {

                event.preventDefault();


                openMatchingRequest();

            }

        }
    );


    return card;

}


/* =========================================================
   HIDE ALL MATCHING STATES
========================================================= */

function hideAllMatchingStates() {

    hideElement(
        matchingLoadingState
    );


    hideElement(
        adminMatchingRequestList
    );


    hideElement(
        matchingEmptyState
    );


    hideElement(
        matchingNoResultState
    );


    hideElement(
        matchingErrorState
    );

}


/* =========================================================
   RENDER MATCHING REQUEST LIST
========================================================= */

function renderMatchingRequestList(
    requests
) {

    hideAllMatchingStates();


    adminMatchingRequestList
        ?.replaceChildren();


    updateResultCount(
        requests.length
    );


    if (
        matchingRequests.length ===
        0
    ) {

        showElement(
            matchingEmptyState
        );


        return;

    }


    if (
        requests.length ===
        0
    ) {

        showElement(
            matchingNoResultState
        );


        return;

    }


    const fragment =
        document.createDocumentFragment();


    requests.forEach(
        (request) => {

            fragment.appendChild(

                createMatchingRequestCard(
                    request
                )

            );

        }
    );


    adminMatchingRequestList
        ?.appendChild(
            fragment
        );


    showElement(
        adminMatchingRequestList
    );

}


/* =========================================================
   APPLY MATCHING FILTERS
========================================================= */

function applyMatchingFilters() {

    const filteredRequests =
        filterMatchingRequests(
            matchingRequests
        );


    visibleMatchingRequests =
        sortMatchingRequests(
            filteredRequests
        );


    renderMatchingRequestList(
        visibleMatchingRequests
    );

}


/* =========================================================
   RESET MATCHING FILTERS
========================================================= */

function resetMatchingFilters() {

    if (
        matchingSearchInput
    ) {

        matchingSearchInput.value =
            "";

    }


    if (
        matchingCategoryFilter
    ) {

        matchingCategoryFilter.value =
            "all";

    }


    if (
        matchingStatusFilter
    ) {

        matchingStatusFilter.value =
            "all";

    }


    if (
        matchingSortSelect
    ) {

        matchingSortSelect.value =
            "newest";

    }


    applyMatchingFilters();

}


/* =========================================================
   RENDER MATCHING ERROR
========================================================= */

function renderMatchingError(
    error
) {

    hideAllMatchingStates();


    const message =
        cleanText(
            error?.message
        )

        ||

        "An unexpected error occurred while loading service requests for freelancer matching.";


    setText(
        matchingErrorMessage,
        message
    );


    updateResultCount(
        0
    );


    showElement(
        matchingErrorState
    );

}


/* =========================================================
   LOAD MATCHING WORKSPACE
========================================================= */

async function loadMatchingWorkspace() {

    hideAllMatchingStates();


    showElement(
        matchingLoadingState
    );


    try {

        const workspaceData =
            await getMatchingWorkspaceData();


        matchingRequests =
            workspaceData.requests ??
            [];


        availableFreelancerCount =
            normalizeNumber(
                workspaceData
                    .availableFreelancerCount
            );


        visibleMatchingRequests =
            [];


        renderMatchingOverview();


        populateCategoryFilter();


        applyMatchingFilters();


    } catch (error) {

        console.error(
            "Admin matching workspace loading error:",
            error
        );


        matchingRequests =
            [];


        visibleMatchingRequests =
            [];


        availableFreelancerCount =
            0;


        renderMatchingOverview();


        populateCategoryFilter();


        renderMatchingError(
            error
        );

    }

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    backToAdminDashboardButton
        ?.addEventListener(
            "click",
            () => {

                navigateTo(
                    ROUTES.ADMIN_DASHBOARD
                );

            }
        );


    matchingSearchInput
        ?.addEventListener(
            "input",
            applyMatchingFilters
        );


    matchingCategoryFilter
        ?.addEventListener(
            "change",
            applyMatchingFilters
        );


    matchingStatusFilter
        ?.addEventListener(
            "change",
            applyMatchingFilters
        );


    matchingSortSelect
        ?.addEventListener(
            "change",
            applyMatchingFilters
        );


    clearMatchingFiltersButton
        ?.addEventListener(
            "click",
            resetMatchingFilters
        );


    resetMatchingFiltersButton
        ?.addEventListener(
            "click",
            resetMatchingFilters
        );


    retryMatchingLoadButton
        ?.addEventListener(
            "click",
            loadMatchingWorkspace
        );

}


/* =========================================================
   INITIALIZE ADMIN MATCHING PAGE
========================================================= */

async function initializeAdminMatchingPage(
    administratorProfile
) {

    try {

        currentAdmin =
            administratorProfile;


        populateAdminNavbar(
            currentAdmin
        );


        initializeEventListeners();


        await loadMatchingWorkspace();


    } catch (error) {

        console.error(
            "Admin matching page initialization error:",
            error
        );


        matchingRequests =
            [];


        visibleMatchingRequests =
            [];


        availableFreelancerCount =
            0;


        renderMatchingOverview();


        renderMatchingError(
            error
        );

    }

}


/* =========================================================
   ADMINISTRATOR PAGE INITIALIZATION
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAdministratorPage(
            initializeAdminMatchingPage
        );

    }

);