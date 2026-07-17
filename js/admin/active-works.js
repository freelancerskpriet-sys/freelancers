/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Active Works Logic
   File: js/admin/active-works.js
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
   ACTIVE WORKS CONFIGURATION
========================================================= */

const ACTIVE_WORKS_CONFIG = Object.freeze({

    ASSIGNMENT_COLUMNS: `

        id,
        request_id,
        freelancer_id,
        status,
        assigned_at,
        started_at,
        completed_at,
        created_at,

        service_requests (
            id,
            title,
            category,
            budget,
            deadline,
            client_id,
            status,
            profiles (
                full_name
            )
        ),

        freelancer_profiles (
            id,
            user_id,
            professional_title,
            profiles (
                full_name
            )
        )

    `

});


/* =========================================================
   DOM ELEMENTS
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


const openMatchingButton =
    document.getElementById(
        "openMatchingButton"
    );


const activeWorksCount =
    document.getElementById(
        "activeWorksCount"
    );


const assignedWorksCount =
    document.getElementById(
        "assignedWorksCount"
    );


const completedWorksCount =
    document.getElementById(
        "completedWorksCount"
    );


const totalAssignmentsCount =
    document.getElementById(
        "totalAssignmentsCount"
    );


const workSearchInput =
    document.getElementById(
        "workSearchInput"
    );


const workStatusFilter =
    document.getElementById(
        "workStatusFilter"
    );


const serviceCategoryFilter =
    document.getElementById(
        "serviceCategoryFilter"
    );


const clearFiltersButton =
    document.getElementById(
        "clearFiltersButton"
    );


const workResultCount =
    document.getElementById(
        "workResultCount"
    );


const activeWorksLoadingState =
    document.getElementById(
        "activeWorksLoadingState"
    );


const activeWorksList =
    document.getElementById(
        "activeWorksList"
    );


const activeWorksEmptyState =
    document.getElementById(
        "activeWorksEmptyState"
    );


const activeWorksErrorState =
    document.getElementById(
        "activeWorksErrorState"
    );


const activeWorksErrorMessage =
    document.getElementById(
        "activeWorksErrorMessage"
    );


const retryActiveWorksButton =
    document.getElementById(
        "retryActiveWorksButton"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentAdministrator = null;

let serviceAssignments = [];

let filteredAssignments = [];

let loadingAssignments = false;


/* =========================================================
   NORMALIZE TEXT
========================================================= */

function normalizeText(
    value
) {

    return cleanText(
        value
    ).toLowerCase();

}


/* =========================================================
   FORMAT STATUS
========================================================= */

function formatStatus(
    status
) {

    const normalizedStatus =
        normalizeText(
            status
        );


    const statusLabels = {

        assigned:
            "Assigned",

        active:
            "Active Work",

        completed:
            "Completed",

        cancelled:
            "Cancelled"

    };


    return (

        statusLabels[
            normalizedStatus
        ]

        ||

        "Unknown"

    );

}


/* =========================================================
   FORMAT CURRENCY
========================================================= */

function formatCurrency(
    value
) {

    const numericValue =
        Number(
            value
        );


    if (
        !Number.isFinite(
            numericValue
        )
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
        numericValue
    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (!value) {

        return "Not available";

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

        return "Not available";

    }


    return new Intl.DateTimeFormat(

        "en-GB",

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
   GET RELATED RECORD

   Supabase relationship results can be returned as
   an object or a one-item array depending on the
   detected relationship.
========================================================= */

function getRelatedRecord(
    value
) {

    if (
        Array.isArray(
            value
        )
    ) {

        return value[0] ?? null;

    }


    return value ?? null;

}


/* =========================================================
   NORMALIZE ASSIGNMENT
========================================================= */

function normalizeAssignment(
    assignment
) {

    const request =
        getRelatedRecord(
            assignment
                ?.service_requests
        );


    const freelancer =
        getRelatedRecord(
            assignment
                ?.freelancer_profiles
        );


    const clientProfile =
        getRelatedRecord(
            request?.profiles
        );


    const freelancerProfile =
        getRelatedRecord(
            freelancer?.profiles
        );


    return {

        id:
            assignment?.id ?? "",

        requestId:
            assignment?.request_id ?? "",

        freelancerId:
            assignment?.freelancer_id ?? "",

        status:
            normalizeText(
                assignment?.status
            ),

        assignedAt:
            assignment?.assigned_at ?? null,

        startedAt:
            assignment?.started_at ?? null,

        completedAt:
            assignment?.completed_at ?? null,

        createdAt:
            assignment?.created_at ?? null,

        request: {

            id:
                request?.id ?? "",

            title:
                cleanText(
                    request?.title
                ) ||
                "Untitled Service Request",

            category:
                cleanText(
                    request?.category
                ) ||
                "General Service",

            budget:
                request?.budget ?? null,

            deadline:
                request?.deadline ?? null,

            status:
                normalizeText(
                    request?.status
                ),

            clientName:
                cleanText(
                    clientProfile
                        ?.full_name
                ) ||
                "Campus Client"

        },

        freelancer: {

            id:
                freelancer?.id ?? "",

            userId:
                freelancer?.user_id ?? "",

            fullName:
                cleanText(
                    freelancerProfile
                        ?.full_name
                ) ||
                "Campus Freelancer",

            professionalTitle:
                cleanText(
                    freelancer
                        ?.professional_title
                ) ||
                "Campus Freelancer"

        }

    };

}


/* =========================================================
   POPULATE ADMIN NAVBAR
========================================================= */

function populateAdminNavbar(
    administrator
) {

    if (!administrator) {

        return;

    }


    const administratorName =
        cleanText(
            administrator.full_name
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
   GET SERVICE ASSIGNMENTS
========================================================= */

async function getServiceAssignments() {

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
            ACTIVE_WORKS_CONFIG
                .ASSIGNMENT_COLUMNS
        )

        .order(
            "created_at",
            {

                ascending:
                    false

            }
        );


    if (error) {

        throw error;

    }


    return (
        data ?? []
    ).map(
        normalizeAssignment
    );

}


/* =========================================================
   RENDER SUMMARY
========================================================= */

function renderSummary() {

    const activeCount =
        serviceAssignments.filter(

            (assignment) => {

                return (
                    assignment.status ===
                    "active"
                );

            }

        ).length;


    const assignedCount =
        serviceAssignments.filter(

            (assignment) => {

                return (
                    assignment.status ===
                    "assigned"
                );

            }

        ).length;


    const completedCount =
        serviceAssignments.filter(

            (assignment) => {

                return (
                    assignment.status ===
                    "completed"
                );

            }

        ).length;


    setText(

        activeWorksCount,

        String(
            activeCount
        )

    );


    setText(

        assignedWorksCount,

        String(
            assignedCount
        )

    );


    setText(

        completedWorksCount,

        String(
            completedCount
        )

    );


    setText(

        totalAssignmentsCount,

        String(
            serviceAssignments.length
        )

    );

}


/* =========================================================
   GET SERVICE CATEGORIES
========================================================= */

function getServiceCategories() {

    return [

        ...new Set(

            serviceAssignments

                .map(
                    (assignment) => {

                        return cleanText(

                            assignment
                                .request
                                .category

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

}


/* =========================================================
   POPULATE CATEGORY FILTER
========================================================= */

function populateCategoryFilter() {

    if (
        !serviceCategoryFilter
    ) {

        return;

    }


    const selectedValue =
        serviceCategoryFilter.value;


    serviceCategoryFilter
        .replaceChildren();


    const allCategoriesOption =
        document.createElement(
            "option"
        );


    allCategoriesOption.value = "";

    allCategoriesOption.textContent =
        "All Categories";


    serviceCategoryFilter.appendChild(
        allCategoriesOption
    );


    getServiceCategories()
        .forEach(
            (category) => {

                const option =
                    document.createElement(
                        "option"
                    );


                option.value =
                    category;


                option.textContent =
                    category;


                serviceCategoryFilter
                    .appendChild(
                        option
                    );

            }
        );


    const optionExists = [

        ...serviceCategoryFilter
            .options

    ].some(
        (option) => {

            return (
                option.value ===
                selectedValue
            );

        }
    );


    serviceCategoryFilter.value =
        optionExists
            ? selectedValue
            : "";

}


/* =========================================================
   FILTER ASSIGNMENTS
========================================================= */

function filterAssignments() {

    const searchValue =
        normalizeText(
            workSearchInput?.value
        );


    const statusValue =
        normalizeText(
            workStatusFilter?.value
        );


    const categoryValue =
        normalizeText(
            serviceCategoryFilter?.value
        );


    filteredAssignments =
        serviceAssignments.filter(
            (assignment) => {

                const searchableText = [

                    assignment
                        .request
                        .title,

                    assignment
                        .request
                        .category,

                    assignment
                        .request
                        .clientName,

                    assignment
                        .freelancer
                        .fullName,

                    assignment
                        .freelancer
                        .professionalTitle

                ]

                    .map(
                        normalizeText
                    )

                    .join(
                        " "
                    );


                const matchesSearch =

                    !searchValue ||

                    searchableText.includes(
                        searchValue
                    );


                const matchesStatus =

                    !statusValue ||

                    assignment.status ===
                    statusValue;


                const matchesCategory =

                    !categoryValue ||

                    normalizeText(

                        assignment
                            .request
                            .category

                    ) ===
                    categoryValue;


                return (

                    matchesSearch &&

                    matchesStatus &&

                    matchesCategory

                );

            }
        );


    renderAssignments();

}


/* =========================================================
   CREATE DETAIL ITEM
========================================================= */

function createDetailItem(
    labelText,
    valueText
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "admin-work-detail";


    const label =
        document.createElement(
            "span"
        );


    label.className =
        "admin-work-detail-label";


    setText(
        label,
        labelText
    );


    const value =
        document.createElement(
            "strong"
        );


    value.className =
        "admin-work-detail-value";


    setText(
        value,
        valueText
    );


    item.append(
        label,
        value
    );


    return item;

}


/* =========================================================
   CREATE ASSIGNMENT CARD
========================================================= */

function createAssignmentCard(
    assignment
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "admin-work-card";


    const header =
        document.createElement(
            "div"
        );


    header.className =
        "admin-work-card-header";


    const heading =
        document.createElement(
            "div"
        );


    heading.className =
        "admin-work-card-heading";


    const category =
        document.createElement(
            "span"
        );


    category.className =
        "admin-work-category";


    setText(

        category,

        assignment
            .request
            .category

    );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "admin-work-title";


    setText(

        title,

        assignment
            .request
            .title

    );


    heading.append(
        category,
        title
    );


    const status =
        document.createElement(
            "span"
        );


    status.className = [

        "admin-work-status",

        `status-${assignment.status || "unknown"}`

    ].join(
        " "
    );


    setText(

        status,

        formatStatus(
            assignment.status
        )

    );


    header.append(
        heading,
        status
    );


    const participants =
        document.createElement(
            "div"
        );


    participants.className =
        "admin-work-participants";


    const client =
        document.createElement(
            "div"
        );


    client.className =
        "admin-work-person";


    const clientLabel =
        document.createElement(
            "span"
        );


    clientLabel.className =
        "admin-work-person-label";


    setText(
        clientLabel,
        "CLIENT"
    );


    const clientName =
        document.createElement(
            "strong"
        );


    clientName.className =
        "admin-work-person-name";


    setText(

        clientName,

        assignment
            .request
            .clientName

    );


    client.append(
        clientLabel,
        clientName
    );


    const freelancer =
        document.createElement(
            "div"
        );


    freelancer.className =
        "admin-work-person";


    const freelancerLabel =
        document.createElement(
            "span"
        );


    freelancerLabel.className =
        "admin-work-person-label";


    setText(
        freelancerLabel,
        "FREELANCER"
    );


    const freelancerName =
        document.createElement(
            "strong"
        );


    freelancerName.className =
        "admin-work-person-name";


    setText(

        freelancerName,

        assignment
            .freelancer
            .fullName

    );


    const freelancerTitle =
        document.createElement(
            "span"
        );


    freelancerTitle.className =
        "admin-work-person-description";


    setText(

        freelancerTitle,

        assignment
            .freelancer
            .professionalTitle

    );


    freelancer.append(
        freelancerLabel,
        freelancerName,
        freelancerTitle
    );


    participants.append(
        client,
        freelancer
    );


    const details =
        document.createElement(
            "div"
        );


    details.className =
        "admin-work-details";


    details.append(

        createDetailItem(

            "BUDGET",

            formatCurrency(
                assignment
                    .request
                    .budget
            )

        ),

        createDetailItem(

            "DEADLINE",

            formatDate(
                assignment
                    .request
                    .deadline
            )

        ),

        createDetailItem(

            "ASSIGNED",

            formatDate(
                assignment
                    .assignedAt
            )

        ),

        createDetailItem(

            "STARTED",

            formatDate(
                assignment
                    .startedAt
            )

        )

    );


    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "admin-work-card-footer";


    const lifecycleText =
        document.createElement(
            "span"
        );


    lifecycleText.className =
        "admin-work-lifecycle";


    if (
        assignment.status ===
        "completed"
    ) {

        setText(

            lifecycleText,

            `Completed ${formatDate(
                assignment.completedAt
            )}`

        );


    } else if (
        assignment.status ===
        "active"
    ) {

        setText(

            lifecycleText,

            "Service work is currently active."

        );


    } else if (
        assignment.status ===
        "assigned"
    ) {

        setText(

            lifecycleText,

            "Waiting for the assigned work to begin."

        );


    } else {

        setText(

            lifecycleText,

            "Service assignment lifecycle information."

        );

    }


    const requestButton =
        document.createElement(
            "button"
        );


    requestButton.type =
        "button";


    requestButton.className =
        "admin-work-action";


    setText(

        requestButton,

        "View Request →"

    );


    requestButton.addEventListener(

        "click",

        () => {

            navigateTo(

                `${ROUTES.ADMIN_REQUEST_REVIEW}?request=${encodeURIComponent(
                    assignment.requestId
                )}`

            );

        }

    );


    footer.append(
        lifecycleText,
        requestButton
    );


    card.append(
        header,
        participants,
        details,
        footer
    );


    return card;

}


/* =========================================================
   UPDATE RESULT COUNT
========================================================= */

function updateResultCount() {

    const assignmentCount =
        filteredAssignments.length;


    setText(

        workResultCount,

        `${assignmentCount} ${

            assignmentCount === 1
                ? "assignment"
                : "assignments"

        } found.`

    );

}


/* =========================================================
   RENDER ASSIGNMENTS
========================================================= */

function renderAssignments() {

    hideElement(
        activeWorksLoadingState
    );


    hideElement(
        activeWorksErrorState
    );


    if (
        !activeWorksList
    ) {

        return;

    }


    activeWorksList
        .replaceChildren();


    updateResultCount();


    if (
        filteredAssignments.length === 0
    ) {

        hideElement(
            activeWorksList
        );


        showElement(
            activeWorksEmptyState
        );


        return;

    }


    hideElement(
        activeWorksEmptyState
    );


    const fragment =
        document.createDocumentFragment();


    filteredAssignments.forEach(
        (assignment) => {

            fragment.appendChild(

                createAssignmentCard(
                    assignment
                )

            );

        }
    );


    activeWorksList.appendChild(
        fragment
    );


    showElement(
        activeWorksList
    );

}


/* =========================================================
   RENDER ERROR
========================================================= */

function renderError(
    error
) {

    console.error(
        "Admin active works error:",
        error
    );


    hideElement(
        activeWorksLoadingState
    );


    hideElement(
        activeWorksList
    );


    hideElement(
        activeWorksEmptyState
    );


    setText(

        activeWorksErrorMessage,

        "Unable to load service assignments. Check the database configuration and try again."

    );


    showElement(
        activeWorksErrorState
    );


    setText(

        workResultCount,

        "0 assignments found."

    );

}


/* =========================================================
   LOAD SERVICE ASSIGNMENTS
========================================================= */

async function loadServiceAssignments() {

    if (
        loadingAssignments
    ) {

        return;

    }


    loadingAssignments = true;


    hideElement(
        activeWorksList
    );


    hideElement(
        activeWorksEmptyState
    );


    hideElement(
        activeWorksErrorState
    );


    showElement(
        activeWorksLoadingState
    );


    try {

        serviceAssignments =
            await getServiceAssignments();


        renderSummary();


        populateCategoryFilter();


        filterAssignments();


    } catch (error) {

        serviceAssignments = [];

        filteredAssignments = [];


        renderSummary();


        renderError(
            error
        );


    } finally {

        loadingAssignments = false;

    }

}


/* =========================================================
   CLEAR FILTERS
========================================================= */

function clearFilters() {

    if (
        workSearchInput
    ) {

        workSearchInput.value = "";

    }


    if (
        workStatusFilter
    ) {

        workStatusFilter.value = "";

    }


    if (
        serviceCategoryFilter
    ) {

        serviceCategoryFilter.value = "";

    }


    filterAssignments();

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


    openMatchingButton
        ?.addEventListener(

            "click",

            () => {

                navigateTo(
                    ROUTES.ADMIN_FREELANCER_MATCHING
                );

            }

        );


    workSearchInput
        ?.addEventListener(

            "input",

            filterAssignments

        );


    workStatusFilter
        ?.addEventListener(

            "change",

            filterAssignments

        );


    serviceCategoryFilter
        ?.addEventListener(

            "change",

            filterAssignments

        );


    clearFiltersButton
        ?.addEventListener(

            "click",

            clearFilters

        );


    retryActiveWorksButton
        ?.addEventListener(

            "click",

            loadServiceAssignments

        );

}


/* =========================================================
   INITIALIZE ADMIN ACTIVE WORKS PAGE
========================================================= */

async function initializeAdminActiveWorks(
    administratorProfile
) {

    currentAdministrator =
        administratorProfile;


    populateAdminNavbar(
        currentAdministrator
    );


    initializeEventListeners();


    await loadServiceAssignments();

}


/* =========================================================
   START PAGE
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    () => {

        initializeAdministratorPage(
            initializeAdminActiveWorks
        );

    }

);