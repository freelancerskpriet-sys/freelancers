/* =========================================================
   KPRIET FREELANCER PLATFORM
   Freelancer Works Logic
   File: js/freelancers/works.js
========================================================= */


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
    requireSupabaseClient
} from "../config/supabase.js";


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

const freelancerWorksLoadingState =
    document.getElementById(
        "freelancerWorksLoadingState"
    );


const freelancerWorksAccessState =
    document.getElementById(
        "freelancerWorksAccessState"
    );


const freelancerWorksAccessTitle =
    document.getElementById(
        "freelancerWorksAccessTitle"
    );


const freelancerWorksAccessMessage =
    document.getElementById(
        "freelancerWorksAccessMessage"
    );


const freelancerWorksContent =
    document.getElementById(
        "freelancerWorksContent"
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
   SUMMARY
--------------------------------------------------------- */

const allWorksCount =
    document.getElementById(
        "allWorksCount"
    );


const activeWorksCount =
    document.getElementById(
        "activeWorksCount"
    );


const inProgressWorksCount =
    document.getElementById(
        "inProgressWorksCount"
    );


const completedWorksCount =
    document.getElementById(
        "completedWorksCount"
    );


/* ---------------------------------------------------------
   SEARCH AND FILTER
--------------------------------------------------------- */

const workSearchInput =
    document.getElementById(
        "workSearchInput"
    );


const workStatusFilter =
    document.getElementById(
        "workStatusFilter"
    );


const workResultCount =
    document.getElementById(
        "workResultCount"
    );


const activeWorkFilterText =
    document.getElementById(
        "activeWorkFilterText"
    );


const clearWorkFiltersButton =
    document.getElementById(
        "clearWorkFiltersButton"
    );


/* ---------------------------------------------------------
   WORK LIST
--------------------------------------------------------- */

const workList =
    document.getElementById(
        "workList"
    );


const workEmptyState =
    document.getElementById(
        "workEmptyState"
    );


const workEmptyStateTitle =
    document.getElementById(
        "workEmptyStateTitle"
    );


const workEmptyStateDescription =
    document.getElementById(
        "workEmptyStateDescription"
    );


/* ---------------------------------------------------------
   PAGINATION
--------------------------------------------------------- */

const workPagination =
    document.getElementById(
        "workPagination"
    );


const previousWorkPageButton =
    document.getElementById(
        "previousWorkPageButton"
    );


const workPaginationNumbers =
    document.getElementById(
        "workPaginationNumbers"
    );


const nextWorkPageButton =
    document.getElementById(
        "nextWorkPageButton"
    );


/* ---------------------------------------------------------
   WORK MODAL
--------------------------------------------------------- */

const workDetailsModal =
    document.getElementById(
        "workDetailsModal"
    );


const workModalBackdrop =
    document.getElementById(
        "workModalBackdrop"
    );


const closeWorkModalButton =
    document.getElementById(
        "closeWorkModalButton"
    );


const workModalTitle =
    document.getElementById(
        "workModalTitle"
    );


const workModalClient =
    document.getElementById(
        "workModalClient"
    );


const workModalDepartment =
    document.getElementById(
        "workModalDepartment"
    );


const workModalService =
    document.getElementById(
        "workModalService"
    );


const workModalBudget =
    document.getElementById(
        "workModalBudget"
    );


const workModalStartedDate =
    document.getElementById(
        "workModalStartedDate"
    );


const workModalDeadline =
    document.getElementById(
        "workModalDeadline"
    );


const workModalDescription =
    document.getElementById(
        "workModalDescription"
    );


/* ---------------------------------------------------------
   PROGRESS
--------------------------------------------------------- */

const workProgressSection =
    document.getElementById(
        "workProgressSection"
    );


const workProgressValue =
    document.getElementById(
        "workProgressValue"
    );


const workProgressBar =
    document.getElementById(
        "workProgressBar"
    );


const workProgressInput =
    document.getElementById(
        "workProgressInput"
    );


/* ---------------------------------------------------------
   MODAL ACTIONS
--------------------------------------------------------- */

const workModalMessage =
    document.getElementById(
        "workModalMessage"
    );


const workModalActions =
    document.getElementById(
        "workModalActions"
    );


const saveWorkProgressButton =
    document.getElementById(
        "saveWorkProgressButton"
    );


const completeWorkButton =
    document.getElementById(
        "completeWorkButton"
    );


/* =========================================================
   WORK CONFIGURATION
========================================================= */

const WORK_CONFIG =
    Object.freeze({

        WORKS_PER_PAGE:
            5

    });


/* =========================================================
   PAGE STATE
========================================================= */

let currentUser = null;

let currentFreelancerProfile = null;

let currentWorks = [];

let filteredWorks = [];

let selectedWork = null;

let currentPage = 1;

let workActionInProgress = false;


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

        .select(`
            id,
            full_name,
            email,
            campus_role,
            department,
            programme,
            academic_year,
            section,
            profile_photo_url
        `)

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

        .select(`
            id,
            user_id,
            professional_title,
            approval_status,
            availability_status,
            rejection_reason,
            created_at,
            updated_at
        `)

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
   NORMALIZE FREELANCER WORK
========================================================= */

function normalizeFreelancerWork(
    work
) {

    if (
        !work
    ) {

        return null;

    }


    const serviceRequest =
        Array.isArray(
            work.service_requests
        )
            ? work.service_requests[0]
            : work.service_requests;


    const clientProfile =
        Array.isArray(
            serviceRequest?.profiles
        )
            ? serviceRequest.profiles[0]
            : serviceRequest?.profiles;


    return {

        id:
            cleanText(
                work.id
            ),

        request_id:
            cleanText(
                work.request_id
            ),

        freelancer_id:
            cleanText(
                work.freelancer_id
            ),

        client_id:
            cleanText(
                work.client_id
            ),

        client_name:
            cleanText(
                clientProfile?.full_name
            ) ||
            "Campus User",

        client_department:
            cleanText(
                clientProfile?.department
            ) ||
            "KPRIET",

        service_title:
            cleanText(
                serviceRequest?.service_title
            ),

        service_category:
            cleanText(
                serviceRequest?.service_category
            ),

        description:
            cleanText(
                serviceRequest?.description
            ),

        budget:
            serviceRequest?.budget ??
            null,

        deadline:
            serviceRequest?.deadline ??
            null,

        progress_percentage:
            work.progress_percentage ??
            0,

        work_status:
            cleanText(
                work.work_status
            ).toLowerCase() ||
            "active",

        started_at:
            work.started_at ??
            null,

        completed_at:
            work.completed_at ??
            null,

        updated_at:
            work.updated_at ??
            null

    };

}


/* =========================================================
   GET FREELANCER WORKS
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
            "works"
        )

        .select(`
            id,
            request_id,
            freelancer_id,
            client_id,
            progress_percentage,
            work_status,
            started_at,
            completed_at,
            updated_at,
            service_requests (
                service_title,
                service_category,
                description,
                budget,
                deadline,
                profiles!service_requests_client_id_fkey (
                    full_name,
                    department
                )
            )
        `)

        .eq(
            "freelancer_id",
            safeFreelancerId
        )

        .order(
            "updated_at",
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
            normalizeFreelancerWork
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
        "Freelancer";


    setText(
        navbarUserName,
        fullName
    );


    setText(
        navbarUserRole,
        createNavbarRole(
            user
        ) ||
        "FREELANCER"
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
   NORMALIZE WORK STATUS
========================================================= */

function normalizeWorkStatus(
    workStatus
) {

    return cleanText(
        workStatus
    ).toLowerCase();

}


/* =========================================================
   FORMAT WORK STATUS
========================================================= */

function formatWorkStatus(
    workStatus
) {

    const status =
        normalizeWorkStatus(
            workStatus
        );


    const statusLabels = {

        active:
            "Active",

        in_progress:
            "In Progress",

        completed:
            "Completed"

    };


    return (
        statusLabels[
            status
        ] ||
        "Work"
    );

}


/* =========================================================
   NORMALIZE PROGRESS
========================================================= */

function normalizeProgress(
    progressValue
) {

    const progress =
        Number(
            progressValue
        );


    if (
        !Number.isFinite(
            progress
        )
    ) {

        return 0;

    }


    return Math.min(

        Math.max(

            Math.round(
                progress
            ),

            0

        ),

        100

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

    const budget =
        Number(
            budgetValue
        );


    if (
        !Number.isFinite(
            budget
        ) ||
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

        return "Work description unavailable.";

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
            .trimEnd() +
        "..."
    );

}


/* =========================================================
   SORT WORKS
========================================================= */

function sortWorksByUpdatedDate(
    works
) {

    return [
        ...works
    ].sort(
        (
            firstWork,
            secondWork
        ) => {

            const firstDate =
                new Date(
                    firstWork.updated_at
                ).getTime();


            const secondDate =
                new Date(
                    secondWork.updated_at
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
   CALCULATE WORK SUMMARY
========================================================= */

function calculateWorkSummary() {

    const active =
        currentWorks.filter(
            (work) =>

                normalizeWorkStatus(
                    work.work_status
                ) ===
                "active"

        ).length;


    const inProgress =
        currentWorks.filter(
            (work) =>

                normalizeWorkStatus(
                    work.work_status
                ) ===
                "in_progress"

        ).length;


    const completed =
        currentWorks.filter(
            (work) =>

                normalizeWorkStatus(
                    work.work_status
                ) ===
                "completed"

        ).length;


    return {

        all:
            currentWorks.length,

        active,

        inProgress,

        completed

    };

}


/* =========================================================
   RENDER WORK SUMMARY
========================================================= */

function renderWorkSummary() {

    const summary =
        calculateWorkSummary();


    setText(
        allWorksCount,
        summary.all
    );


    setText(
        activeWorksCount,
        summary.active
    );


    setText(
        inProgressWorksCount,
        summary.inProgress
    );


    setText(
        completedWorksCount,
        summary.completed
    );

}


/* =========================================================
   GET SEARCH VALUE
========================================================= */

function getSearchValue() {

    return cleanText(
        workSearchInput?.value
    ).toLowerCase();

}


/* =========================================================
   GET STATUS FILTER
========================================================= */

function getStatusFilterValue() {

    const filterValue =
        cleanText(
            workStatusFilter?.value
        ).toLowerCase();


    return (
        filterValue ||
        "all"
    );

}


/* =========================================================
   WORK MATCHES SEARCH
========================================================= */

function workMatchesSearch(
    work,
    searchValue
) {

    if (
        !searchValue
    ) {

        return true;

    }


    const searchableValues = [

        work.service_title,

        work.client_name,

        work.client_department,

        work.service_category,

        work.description

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
   WORK MATCHES STATUS
========================================================= */

function workMatchesStatus(
    work,
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
        normalizeWorkStatus(
            work.work_status
        ) ===
        statusFilter
    );

}


/* =========================================================
   FILTER WORKS
========================================================= */

function filterWorks() {

    const searchValue =
        getSearchValue();


    const statusFilter =
        getStatusFilterValue();


    filteredWorks =
        sortWorksByUpdatedDate(
            currentWorks
        ).filter(
            (work) => {

                return (

                    workMatchesSearch(
                        work,
                        searchValue
                    ) &&

                    workMatchesStatus(
                        work,
                        statusFilter
                    )

                );

            }
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


    clearWorkFiltersButton
        ?.classList.toggle(
            "hidden",
            !filtersActive
        );


    if (
        !filtersActive
    ) {

        setText(
            activeWorkFilterText,
            "Showing all freelance works"
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
                workSearchInput?.value
            )}"`

        );

    }


    if (
        hasStatusFilter
    ) {

        filterInformation.push(

            `Status: ${formatWorkStatus(
                statusFilter
            )}`

        );

    }


    setText(
        activeWorkFilterText,
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

            filteredWorks.length /

            WORK_CONFIG
                .WORKS_PER_PAGE

        )

    );

}


/* =========================================================
   GET CURRENT PAGE WORKS
========================================================= */

function getCurrentPageWorks() {

    const startIndex =
        (
            currentPage -
            1
        ) *
        WORK_CONFIG
            .WORKS_PER_PAGE;


    const endIndex =
        startIndex +
        WORK_CONFIG
            .WORKS_PER_PAGE;


    return filteredWorks.slice(
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
        "freelancer-work-meta-item";


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
   CREATE WORK CARD
========================================================= */

function createWorkCard(
    work
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "freelancer-work-card";


    /* -----------------------------------------------------
       HEADER
    ----------------------------------------------------- */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "freelancer-work-card-header";


    const headingContent =
        document.createElement(
            "div"
        );


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "freelancer-work-card-title";


    title.textContent =
        cleanText(
            work.service_title
        ) ||
        "Freelance Work";


    const service =
        document.createElement(
            "p"
        );


    service.className =
        "freelancer-work-card-service";


    service.textContent =
        cleanText(
            work.service_category
        ) ||
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
        normalizeWorkStatus(
            work.work_status
        );


    status.className =
        `freelancer-work-status-badge ${normalizedStatus}`;


    status.textContent =
        formatWorkStatus(
            work.work_status
        );


    header.append(
        headingContent,
        status
    );


    /* -----------------------------------------------------
       DESCRIPTION
    ----------------------------------------------------- */

    const description =
        document.createElement(
            "p"
        );


    description.className =
        "freelancer-work-card-description";


    description.textContent =
        createDescriptionPreview(
            work.description
        );


    /* -----------------------------------------------------
       META
    ----------------------------------------------------- */

    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "freelancer-work-card-meta";


    meta.append(

        createMetaItem(

            "CLIENT",

            cleanText(
                work.client_name
            ) ||
            "Campus User"

        ),

        createMetaItem(

            "DEPARTMENT",

            cleanText(
                work.client_department
            ) ||
            "KPRIET"

        ),

        createMetaItem(

            "BUDGET",

            formatBudget(
                work.budget
            )

        ),

        createMetaItem(

            "DEADLINE",

            formatDate(
                work.deadline
            )

        )

    );


    /* -----------------------------------------------------
       PROGRESS
    ----------------------------------------------------- */

    const progress =
        normalizeProgress(
            work.progress_percentage
        );


    const progressContainer =
        document.createElement(
            "div"
        );


    progressContainer.className =
        "freelancer-work-card-progress";


    const progressHeader =
        document.createElement(
            "div"
        );


    progressHeader.className =
        "freelancer-work-card-progress-header";


    const progressLabel =
        document.createElement(
            "span"
        );


    progressLabel.textContent =
        "WORK PROGRESS";


    const progressValue =
        document.createElement(
            "strong"
        );


    progressValue.textContent =
        `${progress}%`;


    progressHeader.append(
        progressLabel,
        progressValue
    );


    const progressTrack =
        document.createElement(
            "div"
        );


    progressTrack.className =
        "freelancer-work-card-progress-track";


    const progressBar =
        document.createElement(
            "span"
        );


    progressBar.className =
        "freelancer-work-card-progress-bar";


    progressBar.style.width =
        `${progress}%`;


    progressTrack.appendChild(
        progressBar
    );


    progressContainer.append(
        progressHeader,
        progressTrack
    );


    /* -----------------------------------------------------
       ACTIONS
    ----------------------------------------------------- */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "freelancer-work-card-actions";


    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.className =
        "freelancer-work-card-button";


    viewButton.textContent =
        normalizedStatus ===
        "completed"
            ? "View Work"
            : "Manage Work";


    viewButton.addEventListener(
        "click",
        () => {

            openWorkModal(
                work.id
            );

        }
    );


    actions.appendChild(
        viewButton
    );


    card.append(
        header,
        description,
        meta,
        progressContainer,
        actions
    );


    return card;

}


/* =========================================================
   RENDER EMPTY STATE
========================================================= */

function renderEmptyState() {

    const filtersActive =
        Boolean(
            getSearchValue()
        ) ||
        getStatusFilterValue() !==
            "all";


    if (
        filtersActive
    ) {

        setText(
            workEmptyStateTitle,
            "No matching works"
        );


        setText(
            workEmptyStateDescription,
            "No freelance works match the current search or status filter."
        );


        return;

    }


    setText(
        workEmptyStateTitle,
        "No freelance works yet"
    );


    setText(
        workEmptyStateDescription,
        "Accepted service requests will appear in your work workspace."
    );

}


/* =========================================================
   RENDER WORK LIST
========================================================= */

function renderWorkList() {

    if (
        !workList ||
        !workEmptyState
    ) {

        return;

    }


    workList.replaceChildren();


    setText(

        workResultCount,

        `${filteredWorks.length} ${
            filteredWorks.length === 1
                ? "work"
                : "works"
        }`

    );


    if (
        filteredWorks.length ===
        0
    ) {

        hideElement(
            workList
        );


        showElement(
            workEmptyState
        );


        hideElement(
            workPagination
        );


        renderEmptyState();


        return;

    }


    hideElement(
        workEmptyState
    );


    showElement(
        workList
    );


    const pageWorks =
        getCurrentPageWorks();


    const fragment =
        document.createDocumentFragment();


    pageWorks.forEach(
        (work) => {

            fragment.appendChild(

                createWorkCard(
                    work
                )

            );

        }
    );


    workList.appendChild(
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
        "freelancer-work-pagination-number";


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
        !workPagination ||
        !workPaginationNumbers
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
            workPagination
        );


        return;

    }


    showElement(
        workPagination
    );


    workPaginationNumbers
        .replaceChildren();


    for (
        let pageNumber = 1;
        pageNumber <= totalPages;
        pageNumber += 1
    ) {

        workPaginationNumbers
            .appendChild(

                createPaginationNumber(
                    pageNumber
                )

            );

    }


    if (
        previousWorkPageButton
    ) {

        previousWorkPageButton.disabled =
            currentPage ===
            1;

    }


    if (
        nextWorkPageButton
    ) {

        nextWorkPageButton.disabled =
            currentPage ===
            totalPages;

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
                ) ||
                1,
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


    renderWorkList();


    workList?.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });

}


/* =========================================================
   APPLY WORK FILTERS
========================================================= */

function applyWorkFilters() {

    currentPage =
        1;


    filterWorks();


    updateFilterInformation();


    renderWorkList();

}


/* =========================================================
   CLEAR WORK FILTERS
========================================================= */

function clearWorkFilters() {

    if (
        workSearchInput
    ) {

        workSearchInput.value =
            "";

    }


    if (
        workStatusFilter
    ) {

        workStatusFilter.value =
            "all";

    }


    applyWorkFilters();

}


/* =========================================================
   FIND WORK
========================================================= */

function findWorkById(
    workId
) {

    const safeWorkId =
        cleanText(
            workId
        );


    if (
        !safeWorkId
    ) {

        return null;

    }


    return (
        currentWorks.find(
            (work) =>

                String(
                    work.id
                ) ===
                safeWorkId

        ) ||
        null
    );

}

/* =========================================================
   CLEAR MODAL MESSAGE
========================================================= */

function clearModalMessage() {

    if (
        !workModalMessage
    ) {

        return;

    }


    workModalMessage.textContent =
        "";


    workModalMessage.classList.remove(
        "success",
        "error"
    );


    hideElement(
        workModalMessage
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
        !workModalMessage
    ) {

        return;

    }


    workModalMessage.textContent =
        cleanText(
            message
        );


    workModalMessage.classList.remove(
        "success",
        "error"
    );


    workModalMessage.classList.add(
        type
    );


    showElement(
        workModalMessage
    );

}


/* =========================================================
   UPDATE MODAL PROGRESS
========================================================= */

function updateModalProgress(
    progressValue
) {

    const progress =
        normalizeProgress(
            progressValue
        );


    if (
        workProgressInput
    ) {

        workProgressInput.value =
            String(
                progress
            );

    }


    setText(
        workProgressValue,
        `${progress}%`
    );


    if (
        workProgressBar
    ) {

        workProgressBar.style.width =
            `${progress}%`;

    }

}


/* =========================================================
   RENDER MODAL STATE
========================================================= */

function renderModalState(
    work
) {

    if (
        !work
    ) {

        return;

    }


    const status =
        normalizeWorkStatus(
            work.work_status
        );


    const isCompleted =
        status ===
        "completed";


    workProgressSection
        ?.classList.toggle(
            "hidden",
            false
        );


    workModalActions
        ?.classList.toggle(
            "hidden",
            isCompleted
        );


    if (
        workProgressInput
    ) {

        workProgressInput.disabled =
            isCompleted;

    }


    updateModalProgress(
        work.progress_percentage
    );

}


/* =========================================================
   OPEN WORK MODAL
========================================================= */

function openWorkModal(
    workId
) {

    const work =
        findWorkById(
            workId
        );


    if (
        !work
    ) {

        return;

    }


    selectedWork =
        work;


    clearModalMessage();


    setText(
        workModalTitle,
        cleanText(
            work.service_title
        ) ||
        "Work Details"
    );


    setText(
        workModalClient,
        cleanText(
            work.client_name
        ) ||
        "Campus User"
    );


    setText(
        workModalDepartment,
        cleanText(
            work.client_department
        ) ||
        "KPRIET"
    );


    setText(
        workModalService,
        cleanText(
            work.service_category
        ) ||
        "Campus Service"
    );


    setText(
        workModalBudget,
        formatBudget(
            work.budget
        )
    );


    setText(
        workModalStartedDate,
        formatDate(
            work.started_at
        )
    );


    setText(
        workModalDeadline,
        formatDate(
            work.deadline
        )
    );


    setText(
        workModalDescription,
        cleanText(
            work.description
        ) ||
        "Work description unavailable."
    );


    renderModalState(
        work
    );


    showElement(
        workDetailsModal
    );


    document.body.style.overflow =
        "hidden";


    closeWorkModalButton
        ?.focus();

}


/* =========================================================
   CLOSE WORK MODAL
========================================================= */

function closeWorkModal() {

    if (
        workActionInProgress
    ) {

        return;

    }


    hideElement(
        workDetailsModal
    );


    document.body.style.overflow =
        "";


    selectedWork =
        null;


    clearModalMessage();

}


/* =========================================================
   VALIDATE WORK UPDATE VALUES
========================================================= */

function createSafeWorkUpdateValues(
    updateValues
) {

    if (
        !updateValues ||
        typeof updateValues !==
            "object" ||
        Array.isArray(
            updateValues
        )
    ) {

        throw new Error(
            "Invalid work update values."
        );

    }


    const safeUpdateValues =
        {};


    if (
        Object.prototype.hasOwnProperty.call(
            updateValues,
            "progress_percentage"
        )
    ) {

        const progress =
            Number(
                updateValues
                    .progress_percentage
            );


        if (
            !Number.isFinite(
                progress
            ) ||
            progress < 0 ||
            progress > 100
        ) {

            throw new Error(
                "Work progress must be between 0 and 100."
            );

        }


        safeUpdateValues
            .progress_percentage =
            Math.round(
                progress
            );

    }


    if (
        Object.prototype.hasOwnProperty.call(
            updateValues,
            "work_status"
        )
    ) {

        const workStatus =
            normalizeWorkStatus(
                updateValues
                    .work_status
            );


        const allowedStatuses =
            new Set([
                "active",
                "in_progress",
                "completed"
            ]);


        if (
            !allowedStatuses.has(
                workStatus
            )
        ) {

            throw new Error(
                "Invalid work status."
            );

        }


        safeUpdateValues
            .work_status =
            workStatus;

    }


    if (
        Object.prototype.hasOwnProperty.call(
            updateValues,
            "completed_at"
        )
    ) {

        const completedAt =
            updateValues
                .completed_at;


        if (
            completedAt ===
            null
        ) {

            safeUpdateValues
                .completed_at =
                null;

        } else {

            const completedDate =
                new Date(
                    completedAt
                );


            if (
                Number.isNaN(
                    completedDate.getTime()
                )
            ) {

                throw new Error(
                    "Invalid completion date."
                );

            }


            safeUpdateValues
                .completed_at =
                completedDate
                    .toISOString();

        }

    }


    if (
        Object.keys(
            safeUpdateValues
        ).length ===
        0
    ) {

        throw new Error(
            "No permitted work fields were provided."
        );

    }


    return safeUpdateValues;

}


/* =========================================================
   UPDATE WORK
========================================================= */

async function updateWork(
    workId,
    updateValues
) {

    const safeWorkId =
        cleanText(
            workId
        );


    if (
        !safeWorkId
    ) {

        throw new Error(
            "Work ID is required."
        );

    }


    if (
        !currentFreelancerProfile?.id
    ) {

        throw new Error(
            "Freelancer profile is unavailable."
        );

    }


    const currentWork =
        findWorkById(
            safeWorkId
        );


    if (
        !currentWork
    ) {

        throw new Error(
            "Work record is unavailable."
        );

    }


    if (
        normalizeWorkStatus(
            currentWork.work_status
        ) ===
        "completed"
    ) {

        throw new Error(
            "Completed works cannot be modified."
        );

    }


    const safeUpdateValues =
        createSafeWorkUpdateValues(
            updateValues
        );


    const client =
        requireSupabaseClient();


    const {
        data,
        error
    } = await client

        .from(
            "works"
        )

        .update({

            ...safeUpdateValues,

            updated_at:
                new Date()
                    .toISOString()

        })

        .eq(
            "id",
            safeWorkId
        )

        .eq(
            "freelancer_id",
            currentFreelancerProfile.id
        )

        .neq(
            "work_status",
            "completed"
        )

        .select(`
            id,
            request_id,
            freelancer_id,
            client_id,
            progress_percentage,
            work_status,
            started_at,
            completed_at,
            updated_at
        `)

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
            "Work update was not permitted or the work record no longer exists."
        );

    }


    return data;

}


/* =========================================================
   UPDATE LOCAL WORK
========================================================= */

function updateLocalWork(
    updatedWork
) {

    if (
        !updatedWork?.id
    ) {

        return;

    }


    currentWorks =
        currentWorks.map(
            (work) => {

                if (
                    String(
                        work.id
                    ) !==
                    String(
                        updatedWork.id
                    )
                ) {

                    return work;

                }


                return {

                    ...work,

                    ...updatedWork

                };

            }
        );


    selectedWork =
        findWorkById(
            updatedWork.id
        );

}


/* =========================================================
   REFRESH WORK INTERFACE
========================================================= */

function refreshWorkInterface() {

    renderWorkSummary();


    filterWorks();


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


    renderWorkList();

}


/* =========================================================
   SET ACTION BUTTON STATE
========================================================= */

function setActionButtonState(
    isProcessing,
    actionType = ""
) {

    if (
        saveWorkProgressButton
    ) {

        saveWorkProgressButton.disabled =
            Boolean(
                isProcessing
            );


        saveWorkProgressButton.textContent =
            (
                isProcessing &&
                actionType ===
                    "progress"
            )
                ? "Saving..."
                : "Save Progress";

    }


    if (
        completeWorkButton
    ) {

        completeWorkButton.disabled =
            Boolean(
                isProcessing
            );


        completeWorkButton.textContent =
            (
                isProcessing &&
                actionType ===
                    "complete"
            )
                ? "Completing..."
                : "Mark as Completed";

    }

}


/* =========================================================
   SAVE WORK PROGRESS
========================================================= */

async function saveWorkProgress() {

    if (
        !selectedWork ||
        workActionInProgress
    ) {

        return;

    }


    if (
        normalizeWorkStatus(
            selectedWork.work_status
        ) ===
        "completed"
    ) {

        showModalMessage(
            "Completed works cannot be modified.",
            "error"
        );


        return;

    }


    const rawProgress =
        Number(
            workProgressInput?.value
        );


    if (
        !Number.isFinite(
            rawProgress
        ) ||
        rawProgress < 0 ||
        rawProgress > 100
    ) {

        showModalMessage(
            "Enter a valid progress value between 0 and 100.",
            "error"
        );


        return;

    }


    const progress =
        normalizeProgress(
            rawProgress
        );


    if (
        progress >=
        100
    ) {

        showModalMessage(
            "Use Mark as Completed to finish this work at 100% progress.",
            "error"
        );


        return;

    }


    const nextStatus =
        progress > 0
            ? "in_progress"
            : "active";


    workActionInProgress =
        true;


    setActionButtonState(
        true,
        "progress"
    );


    clearModalMessage();


    try {

        const updatedWork =
            await updateWork(
                selectedWork.id,
                {

                    progress_percentage:
                        progress,

                    work_status:
                        nextStatus

                }
            );


        updateLocalWork(
            updatedWork
        );


        refreshWorkInterface();


        renderModalState(
            selectedWork
        );


        showModalMessage(
            "Work progress updated successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Save work progress error:",
            error
        );


        showModalMessage(
            error?.message ||
            "Unable to save work progress. Please try again.",
            "error"
        );


    } finally {

        workActionInProgress =
            false;


        setActionButtonState(
            false
        );

    }

}


/* =========================================================
   COMPLETE WORK
========================================================= */

async function completeWork() {

    if (
        !selectedWork ||
        workActionInProgress
    ) {

        return;

    }


    if (
        normalizeWorkStatus(
            selectedWork.work_status
        ) ===
        "completed"
    ) {

        showModalMessage(
            "This work has already been completed.",
            "error"
        );


        return;

    }


    workActionInProgress =
        true;


    setActionButtonState(
        true,
        "complete"
    );


    clearModalMessage();


    try {

        const completionTimestamp =
            new Date()
                .toISOString();


        const updatedWork =
            await updateWork(
                selectedWork.id,
                {

                    progress_percentage:
                        100,

                    work_status:
                        "completed",

                    completed_at:
                        completionTimestamp

                }
            );


        updateLocalWork(
            updatedWork
        );


        refreshWorkInterface();


        renderModalState(
            selectedWork
        );


        showModalMessage(
            "Work marked as completed successfully.",
            "success"
        );


    } catch (error) {

        console.error(
            "Complete work error:",
            error
        );


        showModalMessage(
            error?.message ||
            "Unable to complete the work. Please try again.",
            "error"
        );


    } finally {

        workActionInProgress =
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
        freelancerWorksLoadingState
    );


    hideElement(
        freelancerWorksAccessState
    );


    hideElement(
        freelancerWorksContent
    );

}


/* =========================================================
   SHOW WORK CONTENT
========================================================= */

function showWorkContent() {

    hideElement(
        freelancerWorksLoadingState
    );


    hideElement(
        freelancerWorksAccessState
    );


    showElement(
        freelancerWorksContent
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
        freelancerWorksLoadingState
    );


    hideElement(
        freelancerWorksContent
    );


    showElement(
        freelancerWorksAccessState
    );


    setText(
        freelancerWorksAccessTitle,
        title
    );


    setText(
        freelancerWorksAccessMessage,
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
            "Create a freelancer profile and receive admin approval before accessing your freelance works."
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
            "Your freelancer profile is currently waiting for admin approval. Your work workspace will become available after approval."
        );


        return false;

    }


    if (
        approvalStatus ===
        "rejected"
    ) {

        showAccessState(
            "Freelancer profile requires review",
            "Your freelancer profile has not been approved. Review your registration details before accessing freelance works."
        );


        return false;

    }


    if (
        approvalStatus !==
        "approved"
    ) {

        showAccessState(
            "Freelance works unavailable",
            "An approved freelancer profile is required to access your freelance work workspace."
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
   HANDLE WORK QUERY PARAMETER
========================================================= */

function handleWorkQueryParameter() {

    const queryParameters =
        new URLSearchParams(
            window.location.search
        );


    const workId =
        cleanText(
            queryParameters.get(
                "work"
            )
        );


    if (
        !workId
    ) {

        return;

    }


    const work =
        findWorkById(
            workId
        );


    if (
        !work
    ) {

        return;

    }


    openWorkModal(
        work.id
    );

}


/* =========================================================
   HANDLE SEARCH INPUT
========================================================= */

function handleWorkSearchInput() {

    applyWorkFilters();

}


/* =========================================================
   HANDLE STATUS FILTER
========================================================= */

function handleWorkStatusFilter() {

    applyWorkFilters();

}


/* =========================================================
   HANDLE PREVIOUS PAGE
========================================================= */

function handlePreviousWorkPage() {

    if (
        currentPage <=
        1
    ) {

        return;

    }


    changePage(
        currentPage -
        1
    );

}


/* =========================================================
   HANDLE NEXT PAGE
========================================================= */

function handleNextWorkPage() {

    const totalPages =
        getTotalPages();


    if (
        currentPage >=
        totalPages
    ) {

        return;

    }


    changePage(
        currentPage +
        1
    );

}


/* =========================================================
   HANDLE PROGRESS INPUT
========================================================= */

function handleProgressInput() {

    if (
        !selectedWork ||
        !workProgressInput
    ) {

        return;

    }


    const progress =
        normalizeProgress(
            workProgressInput.value
        );


    setText(
        workProgressValue,
        `${progress}%`
    );


    if (
        workProgressBar
    ) {

        workProgressBar.style.width =
            `${progress}%`;

    }

}


/* =========================================================
   HANDLE ESCAPE KEY
========================================================= */

function handleDocumentKeydown(
    event
) {

    if (
        event.key !==
        "Escape"
    ) {

        return;

    }


    if (
        workDetailsModal
            ?.classList.contains(
                "hidden"
            )
    ) {

        return;

    }


    closeWorkModal();

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


    workSearchInput
        ?.addEventListener(
            "input",
            handleWorkSearchInput
        );


    workStatusFilter
        ?.addEventListener(
            "change",
            handleWorkStatusFilter
        );


    clearWorkFiltersButton
        ?.addEventListener(
            "click",
            clearWorkFilters
        );


    previousWorkPageButton
        ?.addEventListener(
            "click",
            handlePreviousWorkPage
        );


    nextWorkPageButton
        ?.addEventListener(
            "click",
            handleNextWorkPage
        );


    closeWorkModalButton
        ?.addEventListener(
            "click",
            closeWorkModal
        );


    workModalBackdrop
        ?.addEventListener(
            "click",
            closeWorkModal
        );


    workProgressInput
        ?.addEventListener(
            "input",
            handleProgressInput
        );


    saveWorkProgressButton
        ?.addEventListener(
            "click",
            saveWorkProgress
        );


    completeWorkButton
        ?.addEventListener(
            "click",
            completeWork
        );


    document.addEventListener(
        "keydown",
        handleDocumentKeydown
    );

}


/* =========================================================
   RESET WORK STATE
========================================================= */

function resetWorkState() {

    currentFreelancerProfile =
        null;


    currentWorks =
        [];


    filteredWorks =
        [];


    selectedWork =
        null;


    currentPage =
        1;


    workActionInProgress =
        false;

}


/* =========================================================
   LOAD FREELANCER WORK DATA
========================================================= */

async function loadFreelancerWorkData(
    authenticatedUser
) {

    showLoadingState();


    resetWorkState();


    try {

        currentUser =
            await getCurrentUserProfile(
                authenticatedUser
            );


        if (
            !currentUser
        ) {

            showAccessState(
                "Campus profile required",
                "Complete your campus profile before accessing the freelancer work workspace."
            );


            return false;

        }


        populateNavbar(
            currentUser
        );


        currentFreelancerProfile =
            await getFreelancerProfile(
                currentUser.id
            );


        const hasFreelancerAccess =
            handleFreelancerAccess(
                currentFreelancerProfile
            );


        if (
            !hasFreelancerAccess
        ) {

            return false;

        }


        currentWorks =
            await getFreelancerWorks(
                currentFreelancerProfile.id
            );


        currentWorks =
            sortWorksByUpdatedDate(
                currentWorks
            );


        renderWorkSummary();


        filterWorks();


        updateFilterInformation();


        renderWorkList();


        showWorkContent();


        handleWorkQueryParameter();


        return true;


    } catch (error) {

        console.error(
            "Freelancer works loading error:",
            error
        );


        resetWorkState();


        showAccessState(
            "Unable to load freelance works",
            "The freelancer work workspace could not be loaded. Please refresh the page and try again."
        );


        return false;

    }

}


/* =========================================================
   INITIALIZE FREELANCER WORKS PAGE
========================================================= */

async function initializeFreelancerWorksPage(
    authenticatedUser
) {

    initializeEventListeners();


    await loadFreelancerWorkData(
        authenticatedUser
    );

}


/* =========================================================
   START PAGE
========================================================= */

initializeAuthenticatedPage(
    initializeFreelancerWorksPage
);


/* =========================================================
   EXPORTS
========================================================= */

export {

    getCurrentUserProfile,

    getFreelancerProfile,

    getFreelancerWorks,

    normalizeFreelancerWork,

    normalizeWorkStatus,

    formatWorkStatus,

    normalizeProgress,

    formatDate,

    formatBudget,

    calculateWorkSummary,

    filterWorks,

    applyWorkFilters,

    clearWorkFilters,

    findWorkById,

    openWorkModal,

    closeWorkModal,

    createSafeWorkUpdateValues,

    updateWork,

    updateLocalWork,

    saveWorkProgress,

    completeWork,

    handleFreelancerAccess,

    loadFreelancerWorkData,

    initializeFreelancerWorksPage

};