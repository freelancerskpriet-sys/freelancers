/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Freelancer Approvals Logic
   File: js/admin/freelancers.js
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
   ADMIN FREELANCER CONFIGURATION

   FIX 1:
   freelancer_profiles has two foreign keys pointing to
   profiles (user_id and reviewed_by), so a bare
   "profiles (...)" embed is ambiguous and Supabase returns
   PGRST201. This page displays the freelancer's own campus
   identity, so the embed is disambiguated to the user_id
   relationship: profiles!freelancer_profiles_user_id_fkey.

   FIX 2:
   The actual column on freelancer_profiles is the singular
   "service_category", not "service_categories". Selecting
   the plural name returned Postgres error 42703 (column
   does not exist).
========================================================= */

const ADMIN_FREELANCER_CONFIG =
    Object.freeze({

        FREELANCER_COLUMNS: `

            id,
            user_id,
            professional_title,
            bio,
            service_category,
            skills,
            approval_status,
            created_at,

            profiles!freelancer_profiles_user_id_fkey (
                full_name,
                department,
                year_of_study,
                register_number
            )

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


const totalFreelancersCount =
    document.getElementById(
        "totalFreelancersCount"
    );


const pendingFreelancersCount =
    document.getElementById(
        "pendingFreelancersCount"
    );


const approvedFreelancersCount =
    document.getElementById(
        "approvedFreelancersCount"
    );


const rejectedFreelancersCount =
    document.getElementById(
        "rejectedFreelancersCount"
    );


const freelancerSearchInput =
    document.getElementById(
        "freelancerSearchInput"
    );


const freelancerStatusFilter =
    document.getElementById(
        "freelancerStatusFilter"
    );


const freelancerCategoryFilter =
    document.getElementById(
        "freelancerCategoryFilter"
    );


const freelancerSortSelect =
    document.getElementById(
        "freelancerSortSelect"
    );


const freelancerResultCount =
    document.getElementById(
        "freelancerResultCount"
    );


const clearFreelancerFiltersButton =
    document.getElementById(
        "clearFreelancerFiltersButton"
    );


const freelancerLoadingState =
    document.getElementById(
        "freelancerLoadingState"
    );


const adminFreelancerList =
    document.getElementById(
        "adminFreelancerList"
    );


const freelancerEmptyState =
    document.getElementById(
        "freelancerEmptyState"
    );


const freelancerNoResultState =
    document.getElementById(
        "freelancerNoResultState"
    );


const freelancerErrorState =
    document.getElementById(
        "freelancerErrorState"
    );


const freelancerErrorMessage =
    document.getElementById(
        "freelancerErrorMessage"
    );


const resetFreelancerFiltersButton =
    document.getElementById(
        "resetFreelancerFiltersButton"
    );


const retryFreelancerLoadButton =
    document.getElementById(
        "retryFreelancerLoadButton"
    );


/* =========================================================
   ADMIN FREELANCER STATE
========================================================= */

let currentAdmin = null;


let freelancerApplications = [];


let visibleFreelancers = [];


/* =========================================================
   GET RELATED RECORD
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
   NORMALIZE APPROVAL STATUS
========================================================= */

function normalizeApprovalStatus(
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


    const allowedStatuses = [

        "pending",

        "approved",

        "rejected"

    ];


    if (
        allowedStatuses.includes(
            normalizedStatus
        )
    ) {

        return normalizedStatus;

    }


    return "pending";

}


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
   NORMALIZE FREELANCER APPLICATION
========================================================= */

function normalizeFreelancerApplication(
    freelancer
) {

    if (!freelancer) {

        return null;

    }


    const profile =
        getRelatedRecord(
            freelancer.profiles
        ) || {};


    return {

        id:
            cleanText(
                freelancer.id
            ),

        userId:
            cleanText(
                freelancer.user_id
            ),

        fullName:
            cleanText(
                profile.full_name
            ) ||
            "Campus Freelancer",

        professionalTitle:
            cleanText(
                freelancer.professional_title
            ) ||
            "Campus Freelancer",

        bio:
            cleanText(
                freelancer.bio
            ),

        serviceCategories:
            normalizeStringArray(
                freelancer.service_category
            ),

        skills:
            normalizeStringArray(
                freelancer.skills
            ),

        approvalStatus:
            normalizeApprovalStatus(
                freelancer.approval_status
            ),

        department:
            cleanText(
                profile.department
            ),

        year:
            cleanText(
                profile.year_of_study
            ),

        registerNumber:
            cleanText(
                profile.register_number
            ),

        createdAt:
            freelancer.created_at ||
            null

    };

}


/* =========================================================
   POPULATE ADMIN NAVBAR
========================================================= */

function populateAdminNavbar(
    admin
) {

    const adminName =
        cleanText(
            admin?.full_name
        ) ||
        "Platform Administrator";


    setText(
        navbarUserName,
        adminName
    );


    setText(
        navbarUserRole,
        "PLATFORM ADMINISTRATOR"
    );


    setText(
        navbarUserAvatar,
        getInitials(
            adminName
        )
    );

}


/* =========================================================
   GET FREELANCER APPLICATIONS
========================================================= */

async function getFreelancerApplications() {

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
            ADMIN_FREELANCER_CONFIG
                .FREELANCER_COLUMNS
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
    )

        .map(
            normalizeFreelancerApplication
        )

        .filter(
            Boolean
        );

}


/* =========================================================
   FORMAT APPROVAL STATUS
========================================================= */

function formatApprovalStatus(
    status
) {

    const statusLabels = {

        pending:
            "Pending Review",

        approved:
            "Approved",

        rejected:
            "Rejected"

    };


    return (

        statusLabels[
            normalizeApprovalStatus(
                status
            )
        ]

        ||

        "Pending Review"

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
   BUILD CAMPUS IDENTITY
========================================================= */

function buildCampusIdentity(
    freelancer
) {

    const identityParts = [];


    if (
        freelancer.department
    ) {

        identityParts.push(
            freelancer.department
        );

    }


    if (
        freelancer.year
    ) {

        identityParts.push(
            freelancer.year
        );

    }


    if (
        freelancer.registerNumber
    ) {

        identityParts.push(
            freelancer.registerNumber
        );

    }


    return (

        identityParts.join(
            " · "
        )

        ||

        "Campus profile information unavailable"

    );

}


/* =========================================================
   RENDER FREELANCER OVERVIEW
========================================================= */

function renderFreelancerOverview() {

    const totalFreelancers =
        freelancerApplications.length;


    const pendingFreelancers =
        freelancerApplications.filter(
            (freelancer) => {

                return (

                    freelancer.approvalStatus ===
                    "pending"

                );

            }
        ).length;


    const approvedFreelancers =
        freelancerApplications.filter(
            (freelancer) => {

                return (

                    freelancer.approvalStatus ===
                    "approved"

                );

            }
        ).length;


    const rejectedFreelancers =
        freelancerApplications.filter(
            (freelancer) => {

                return (

                    freelancer.approvalStatus ===
                    "rejected"

                );

            }
        ).length;


    setText(

        totalFreelancersCount,

        String(
            totalFreelancers
        )

    );


    setText(

        pendingFreelancersCount,

        String(
            pendingFreelancers
        )

    );


    setText(

        approvedFreelancersCount,

        String(
            approvedFreelancers
        )

    );


    setText(

        rejectedFreelancersCount,

        String(
            rejectedFreelancers
        )

    );

}


/* =========================================================
   POPULATE CATEGORY FILTER
========================================================= */

function populateCategoryFilter() {

    if (
        !freelancerCategoryFilter
    ) {

        return;

    }


    const currentValue =
        freelancerCategoryFilter.value;


    const categories = [

        ...new Set(

            freelancerApplications

                .flatMap(
                    (freelancer) => {

                        return freelancer
                            .serviceCategories;

                    }
                )

                .map(
                    (category) => {

                        return cleanText(
                            category
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


    freelancerCategoryFilter
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


    freelancerCategoryFilter
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


            freelancerCategoryFilter
                .appendChild(
                    option
                );

        }
    );


    const categoryExists =
        Array.from(
            freelancerCategoryFilter
                .options
        ).some(
            (option) => {

                return (
                    option.value ===
                    currentValue
                );

            }
        );


    freelancerCategoryFilter.value =

        categoryExists

            ? currentValue

            : "all";

}


/* =========================================================
   GET FILTER VALUES
========================================================= */

function getSearchValue() {

    return cleanText(
        freelancerSearchInput?.value
    ).toLowerCase();

}


function getStatusFilter() {

    return (

        freelancerStatusFilter?.value ||

        "all"

    );

}


function getCategoryFilter() {

    return (

        freelancerCategoryFilter?.value ||

        "all"

    );

}


function getSortValue() {

    return (

        freelancerSortSelect?.value ||

        "newest"

    );

}


/* =========================================================
   FILTER FREELANCER APPLICATIONS
========================================================= */

function filterFreelancerApplications(
    freelancers
) {

    const searchValue =
        getSearchValue();


    const statusFilter =
        getStatusFilter();


    const categoryFilter =
        getCategoryFilter();


    return freelancers.filter(
        (freelancer) => {

            const searchableText = [

                freelancer.id,

                freelancer.fullName,

                freelancer.professionalTitle,

                freelancer.department,

                freelancer.year,

                freelancer.registerNumber,

                ...freelancer.skills,

                ...freelancer.serviceCategories

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


            const matchesStatus =

                statusFilter === "all" ||

                freelancer.approvalStatus ===
                statusFilter;


            const matchesCategory =

                categoryFilter === "all" ||

                freelancer
                    .serviceCategories
                    .includes(
                        categoryFilter
                    );


            return (

                matchesSearch &&

                matchesStatus &&

                matchesCategory

            );

        }
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
   SORT FREELANCER APPLICATIONS
========================================================= */

function sortFreelancerApplications(
    freelancers
) {

    const sortValue =
        getSortValue();


    const sortedFreelancers = [

        ...freelancers

    ];


    sortedFreelancers.sort(
        (
            firstFreelancer,
            secondFreelancer
        ) => {

            switch (
                sortValue
            ) {

                case "oldest":

                    return (

                        getDateTime(

                            firstFreelancer
                                .createdAt,

                            0

                        )

                        -

                        getDateTime(

                            secondFreelancer
                                .createdAt,

                            0

                        )

                    );


                case "name_asc":

                    return firstFreelancer
                        .fullName
                        .localeCompare(
                            secondFreelancer
                                .fullName
                        );


                case "name_desc":

                    return secondFreelancer
                        .fullName
                        .localeCompare(
                            firstFreelancer
                                .fullName
                        );


                case "newest":

                default:

                    return (

                        getDateTime(

                            secondFreelancer
                                .createdAt,

                            0

                        )

                        -

                        getDateTime(

                            firstFreelancer
                                .createdAt,

                            0

                        )

                    );

            }

        }
    );


    return sortedFreelancers;

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

        freelancerResultCount,

        `${safeCount} ${

            safeCount === 1

                ? "freelancer"

                : "freelancers"

        } found`

    );

}


/* =========================================================
   CREATE TAG
========================================================= */

function createTag(
    value,
    className
) {

    const tag =
        document.createElement(
            "span"
        );


    tag.className =
        className;


    setText(
        tag,
        value
    );


    return tag;

}


/* =========================================================
   CREATE FREELANCER CARD
========================================================= */

function createFreelancerCard(
    freelancer
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "admin-freelancer-card";


    card.tabIndex = 0;


    card.setAttribute(
        "role",
        "button"
    );


    card.setAttribute(

        "aria-label",

        `Review freelancer ${
            freelancer.fullName
        }`

    );


    /* =====================================================
       HEADER
    ===================================================== */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "admin-freelancer-card-header";


    const identity =
        document.createElement(
            "div"
        );


    identity.className =
        "admin-freelancer-identity";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "admin-freelancer-avatar";


    avatar.setAttribute(
        "aria-hidden",
        "true"
    );


    setText(

        avatar,

        getInitials(
            freelancer.fullName
        )

    );


    const titleContent =
        document.createElement(
            "div"
        );


    titleContent.className =
        "admin-freelancer-title-content";


    const name =
        document.createElement(
            "h3"
        );


    name.className =
        "admin-freelancer-name";


    setText(
        name,
        freelancer.fullName
    );


    const professionalTitle =
        document.createElement(
            "p"
        );


    professionalTitle.className =
        "admin-freelancer-professional-title";


    setText(

        professionalTitle,

        freelancer.professionalTitle

    );


    const campusIdentity =
        document.createElement(
            "p"
        );


    campusIdentity.className =
        "admin-freelancer-campus-identity";


    setText(

        campusIdentity,

        buildCampusIdentity(
            freelancer
        )

    );


    titleContent.append(

        name,

        professionalTitle,

        campusIdentity

    );


    identity.append(

        avatar,

        titleContent

    );


    const status =
        document.createElement(
            "span"
        );


    status.className =

        `admin-freelancer-status ${
            freelancer.approvalStatus
        }`;


    setText(

        status,

        formatApprovalStatus(
            freelancer.approvalStatus
        )

    );


    header.append(
        identity,
        status
    );


    /* =====================================================
       BIO
    ===================================================== */

    const bio =
        document.createElement(
            "p"
        );


    bio.className =
        "admin-freelancer-bio";


    setText(

        bio,

        freelancer.bio ||

        "No professional profile summary was provided."

    );


    /* =====================================================
       SERVICE CATEGORIES
    ===================================================== */

    const categorySection =
        document.createElement(
            "div"
        );


    categorySection.className =
        "admin-freelancer-tag-section";


    const categoryLabel =
        document.createElement(
            "span"
        );


    categoryLabel.className =
        "admin-freelancer-tag-label";


    setText(

        categoryLabel,

        "SERVICE CATEGORIES"

    );


    const categoryList =
        document.createElement(
            "div"
        );


    categoryList.className =
        "admin-freelancer-tag-list";


    if (
        freelancer
            .serviceCategories
            .length > 0
    ) {

        freelancer
            .serviceCategories
            .forEach(
                (category) => {

                    categoryList
                        .appendChild(

                            createTag(

                                category,

                                "admin-freelancer-category-tag"

                            )

                        );

                }
            );


    } else {

        categoryList
            .appendChild(

                createTag(

                    "No categories provided",

                    "admin-freelancer-empty-tag"

                )

            );

    }


    categorySection.append(
        categoryLabel,
        categoryList
    );


    /* =====================================================
       SKILLS
    ===================================================== */

    const skillSection =
        document.createElement(
            "div"
        );


    skillSection.className =
        "admin-freelancer-tag-section";


    const skillLabel =
        document.createElement(
            "span"
        );


    skillLabel.className =
        "admin-freelancer-tag-label";


    setText(
        skillLabel,
        "SKILLS"
    );


    const skillList =
        document.createElement(
            "div"
        );


    skillList.className =
        "admin-freelancer-tag-list";


    if (
        freelancer.skills.length > 0
    ) {

        freelancer.skills

            .slice(
                0,
                6
            )

            .forEach(
                (skill) => {

                    skillList
                        .appendChild(

                            createTag(

                                skill,

                                "admin-freelancer-skill-tag"

                            )

                        );

                }
            );


        const remainingSkillCount =

            freelancer.skills.length - 6;


        if (
            remainingSkillCount > 0
        ) {

            skillList
                .appendChild(

                    createTag(

                        `+${
                            remainingSkillCount
                        } more`,

                        "admin-freelancer-skill-tag"

                    )

                );

        }


    } else {

        skillList
            .appendChild(

                createTag(

                    "No skills provided",

                    "admin-freelancer-empty-tag"

                )

            );

    }


    skillSection.append(
        skillLabel,
        skillList
    );


    /* =====================================================
       FOOTER
    ===================================================== */

    const footer =
        document.createElement(
            "div"
        );


    footer.className =
        "admin-freelancer-card-footer";


    const submittedDate =
        document.createElement(
            "div"
        );


    submittedDate.className =
        "admin-freelancer-submitted";


    const submittedLabel =
        document.createElement(
            "span"
        );


    setText(
        submittedLabel,
        "SUBMITTED"
    );


    const submittedValue =
        document.createElement(
            "strong"
        );


    setText(

        submittedValue,

        formatDate(
            freelancer.createdAt
        )

    );


    submittedDate.append(
        submittedLabel,
        submittedValue
    );


    const action =
        document.createElement(
            "span"
        );


    action.className =
        "admin-freelancer-action";


    setText(

        action,

        "Review Freelancer →"

    );


    footer.append(
        submittedDate,
        action
    );


    card.append(

        header,

        bio,

        categorySection,

        skillSection,

        footer

    );


    /* =====================================================
       CARD NAVIGATION
    ===================================================== */

    const openFreelancer = () => {

        navigateTo(

            ROUTES
                .ADMIN_FREELANCER_REVIEW,

            {

                freelancer:
                    freelancer.id

            }

        );

    };


    card.addEventListener(
        "click",
        openFreelancer
    );


    card.addEventListener(
        "keydown",
        (event) => {

            if (

                event.key === "Enter" ||

                event.key === " "

            ) {

                event.preventDefault();


                openFreelancer();

            }

        }
    );


    return card;

}


/* =========================================================
   HIDE ALL FREELANCER STATES
========================================================= */

function hideAllFreelancerStates() {

    hideElement(
        freelancerLoadingState
    );


    hideElement(
        adminFreelancerList
    );


    hideElement(
        freelancerEmptyState
    );


    hideElement(
        freelancerNoResultState
    );


    hideElement(
        freelancerErrorState
    );

}


/* =========================================================
   RENDER FREELANCER LIST
========================================================= */

function renderFreelancerList(
    freelancers
) {

    hideAllFreelancerStates();


    adminFreelancerList
        ?.replaceChildren();


    updateResultCount(
        freelancers.length
    );


    if (
        freelancerApplications.length === 0
    ) {

        showElement(
            freelancerEmptyState
        );


        return;

    }


    if (
        freelancers.length === 0
    ) {

        showElement(
            freelancerNoResultState
        );


        return;

    }


    const fragment =
        document.createDocumentFragment();


    freelancers.forEach(
        (freelancer) => {

            fragment.appendChild(

                createFreelancerCard(
                    freelancer
                )

            );

        }
    );


    adminFreelancerList
        ?.appendChild(
            fragment
        );


    showElement(
        adminFreelancerList
    );

}


/* =========================================================
   APPLY FREELANCER FILTERS
========================================================= */

function applyFreelancerFilters() {

    const filteredFreelancers =
        filterFreelancerApplications(
            freelancerApplications
        );


    visibleFreelancers =
        sortFreelancerApplications(
            filteredFreelancers
        );


    renderFreelancerList(
        visibleFreelancers
    );

}


/* =========================================================
   RESET FREELANCER FILTERS
========================================================= */

function resetFreelancerFilters() {

    if (
        freelancerSearchInput
    ) {

        freelancerSearchInput.value =
            "";

    }


    if (
        freelancerStatusFilter
    ) {

        freelancerStatusFilter.value =
            "all";

    }


    if (
        freelancerCategoryFilter
    ) {

        freelancerCategoryFilter.value =
            "all";

    }


    if (
        freelancerSortSelect
    ) {

        freelancerSortSelect.value =
            "newest";

    }


    applyFreelancerFilters();

}


/* =========================================================
   RENDER FREELANCER ERROR
========================================================= */

function renderFreelancerError(
    error
) {

    hideAllFreelancerStates();


    const message =
        cleanText(
            error?.message
        )

        ||

        "An unexpected error occurred while loading freelancer registrations.";


    setText(
        freelancerErrorMessage,
        message
    );


    updateResultCount(
        0
    );


    showElement(
        freelancerErrorState
    );

}


/* =========================================================
   LOAD FREELANCER APPLICATIONS
========================================================= */

async function loadFreelancerApplications() {

    hideAllFreelancerStates();


    showElement(
        freelancerLoadingState
    );


    try {

        freelancerApplications =
            await getFreelancerApplications();


        visibleFreelancers = [];


        renderFreelancerOverview();


        populateCategoryFilter();


        applyFreelancerFilters();


    } catch (error) {

        console.error(
            "Admin freelancer loading error:",
            error
        );


        freelancerApplications = [];


        visibleFreelancers = [];


        renderFreelancerOverview();


        populateCategoryFilter();


        renderFreelancerError(
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


    freelancerSearchInput
        ?.addEventListener(
            "input",
            applyFreelancerFilters
        );


    freelancerStatusFilter
        ?.addEventListener(
            "change",
            applyFreelancerFilters
        );


    freelancerCategoryFilter
        ?.addEventListener(
            "change",
            applyFreelancerFilters
        );


    freelancerSortSelect
        ?.addEventListener(
            "change",
            applyFreelancerFilters
        );


    clearFreelancerFiltersButton
        ?.addEventListener(
            "click",
            resetFreelancerFilters
        );


    resetFreelancerFiltersButton
        ?.addEventListener(
            "click",
            resetFreelancerFilters
        );


    retryFreelancerLoadButton
        ?.addEventListener(
            "click",
            loadFreelancerApplications
        );

}


/* =========================================================
   INITIALIZE ADMIN FREELANCER PAGE
========================================================= */

async function initializeAdminFreelancerPage(
    administratorProfile
) {

    try {

        currentAdmin =
            administratorProfile;


        populateAdminNavbar(
            currentAdmin
        );


        initializeEventListeners();


        await loadFreelancerApplications();


    } catch (error) {

        console.error(
            "Admin freelancer page initialization error:",
            error
        );


        freelancerApplications = [];


        visibleFreelancers = [];


        renderFreelancerOverview();


        renderFreelancerError(
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
            initializeAdminFreelancerPage
        );

    }

);