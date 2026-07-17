/* =========================================================
   KPRIET FREELANCER PLATFORM
   Admin Platform Users Logic
   File: js/admin/users.js
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
   ADMIN USER CONFIGURATION
========================================================= */

const ADMIN_USER_CONFIG =
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


const totalUsersCount =
    document.getElementById(
        "totalUsersCount"
    );


const studentUsersCount =
    document.getElementById(
        "studentUsersCount"
    );


const facultyUsersCount =
    document.getElementById(
        "facultyUsersCount"
    );


const adminUsersCount =
    document.getElementById(
        "adminUsersCount"
    );


const userSearchInput =
    document.getElementById(
        "userSearchInput"
    );


const userRoleFilter =
    document.getElementById(
        "userRoleFilter"
    );


const userDepartmentFilter =
    document.getElementById(
        "userDepartmentFilter"
    );


const userSortSelect =
    document.getElementById(
        "userSortSelect"
    );


const userResultCount =
    document.getElementById(
        "userResultCount"
    );


const clearUserFiltersButton =
    document.getElementById(
        "clearUserFiltersButton"
    );


const userLoadingState =
    document.getElementById(
        "userLoadingState"
    );


const adminUserList =
    document.getElementById(
        "adminUserList"
    );


const userEmptyState =
    document.getElementById(
        "userEmptyState"
    );


const userNoResultState =
    document.getElementById(
        "userNoResultState"
    );


const userErrorState =
    document.getElementById(
        "userErrorState"
    );


const userErrorMessage =
    document.getElementById(
        "userErrorMessage"
    );


const resetUserFiltersButton =
    document.getElementById(
        "resetUserFiltersButton"
    );


const retryUserLoadButton =
    document.getElementById(
        "retryUserLoadButton"
    );


/* =========================================================
   PAGE STATE
========================================================= */

let currentAdmin = null;

let platformUsers = [];

let visibleUsers = [];


/* =========================================================
   NORMALIZE BOOLEAN
========================================================= */

function normalizeBoolean(
    value
) {

    return (

        value === true ||

        value === "true" ||

        value === 1 ||

        value === "1"

    );

}


/* =========================================================
   NORMALIZE CAMPUS ROLE
========================================================= */

function normalizeCampusRole(
    role
) {

    const normalizedRole =
        cleanText(
            role
        )

            .toLowerCase()

            .replace(
                /[\s-]+/g,
                "_"
            );


    const roleMap = {

        student:
            "student",

        faculty:
            "faculty",

        staff:
            "staff",

        administrator:
            "admin",

        admin:
            "admin"

    };


    return (

        roleMap[
            normalizedRole
        ]

        ||

        normalizedRole

        ||

        "user"

    );

}


/* =========================================================
   NORMALIZE USER
========================================================= */

function normalizePlatformUser(
    profile
) {

    if (
        !profile
    ) {

        return null;

    }


    const isAdmin =
        normalizeBoolean(
            profile.is_admin
        );


    return {

        id:
            cleanText(
                profile.id
            ),

        fullName:
            cleanText(
                profile.full_name
            ) ||
            "Campus User",

        email:
            cleanText(
                profile.email
            ),

        mobileNumber:
            cleanText(
                profile.mobile_number
            ),

        campusRole:
            isAdmin

                ? "admin"

                : normalizeCampusRole(
                    profile.campus_role
                ),

        department:
            cleanText(
                profile.department
            ),

        programme:
            cleanText(
                profile.programme
            ),

        academicYear:
            cleanText(
                profile.academic_year
            ),

        section:
            cleanText(
                profile.section
            ),

        registerNumber:
            cleanText(
                profile.register_number
            ),

        profilePhotoUrl:
            cleanText(
                profile.profile_photo_url
            ),

        isAdmin,

        createdAt:
            profile.created_at ??
            null,

        updatedAt:
            profile.updated_at ??
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
   GET PLATFORM USERS
========================================================= */

async function getPlatformUsers() {

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
            ADMIN_USER_CONFIG
                .PROFILE_COLUMNS
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
            normalizePlatformUser
        )

        .filter(
            Boolean
        );

}


/* =========================================================
   FORMAT CAMPUS ROLE
========================================================= */

function formatCampusRole(
    role
) {

    const roleLabels = {

        student:
            "Student",

        faculty:
            "Faculty",

        staff:
            "Staff",

        admin:
            "Administrator",

        user:
            "Campus User"

    };


    return (

        roleLabels[
            normalizeCampusRole(
                role
            )
        ]

        ||

        "Campus User"

    );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(
    value
) {

    if (
        !value
    ) {

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
   CREATE USER IDENTITY
========================================================= */

function createUserIdentity(
    user
) {

    const identityParts =
        [];


    if (
        user.department
    ) {

        identityParts.push(
            user.department
        );

    }


    if (
        user.programme
    ) {

        identityParts.push(
            user.programme
        );

    }


    if (
        user.academicYear
    ) {

        identityParts.push(
            `Year ${user.academicYear}`
        );

    }


    if (
        user.section
    ) {

        identityParts.push(
            `Section ${user.section}`
        );

    }


    return (

        identityParts.join(
            " · "
        )

        ||

        formatCampusRole(
            user.campusRole
        )

    );

}


/* =========================================================
   RENDER USER OVERVIEW
========================================================= */

function renderUserOverview() {

    const totalUsers =
        platformUsers.length;


    const studentUsers =
        platformUsers.filter(
            (user) => {

                return (

                    user.campusRole ===
                    "student"

                );

            }
        ).length;


    const facultyUsers =
        platformUsers.filter(
            (user) => {

                return (

                    user.campusRole ===
                    "faculty"

                );

            }
        ).length;


    const adminUsers =
        platformUsers.filter(
            (user) => {

                return user.isAdmin;

            }
        ).length;


    setText(

        totalUsersCount,

        String(
            totalUsers
        )

    );


    setText(

        studentUsersCount,

        String(
            studentUsers
        )

    );


    setText(

        facultyUsersCount,

        String(
            facultyUsers
        )

    );


    setText(

        adminUsersCount,

        String(
            adminUsers
        )

    );

}


/* =========================================================
   POPULATE DEPARTMENT FILTER
========================================================= */

function populateDepartmentFilter() {

    if (
        !userDepartmentFilter
    ) {

        return;

    }


    const currentValue =
        userDepartmentFilter.value;


    const departments = [

        ...new Set(

            platformUsers

                .map(
                    (user) => {

                        return cleanText(
                            user.department
                        );

                    }
                )

                .filter(
                    Boolean
                )

        )

    ].sort(
        (
            firstDepartment,
            secondDepartment
        ) => {

            return firstDepartment.localeCompare(
                secondDepartment
            );

        }
    );


    userDepartmentFilter
        .replaceChildren();


    const allDepartmentsOption =
        document.createElement(
            "option"
        );


    allDepartmentsOption.value =
        "all";


    setText(

        allDepartmentsOption,

        "All Departments"

    );


    userDepartmentFilter
        .appendChild(
            allDepartmentsOption
        );


    departments.forEach(
        (department) => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                department;


            setText(
                option,
                department
            );


            userDepartmentFilter
                .appendChild(
                    option
                );

        }
    );


    const optionExists =
        Array.from(
            userDepartmentFilter.options
        )
            .some(
                (option) => {

                    return (

                        option.value ===
                        currentValue

                    );

                }
            );


    userDepartmentFilter.value =

        optionExists

            ? currentValue

            : "all";

}


/* =========================================================
   GET SEARCH VALUE
========================================================= */

function getSearchValue() {

    return cleanText(
        userSearchInput?.value
    )
        .toLowerCase();

}


/* =========================================================
   GET ROLE FILTER
========================================================= */

function getRoleFilter() {

    return (

        userRoleFilter?.value

        ||

        "all"

    );

}


/* =========================================================
   GET DEPARTMENT FILTER
========================================================= */

function getDepartmentFilter() {

    return (

        userDepartmentFilter?.value

        ||

        "all"

    );

}


/* =========================================================
   GET SORT VALUE
========================================================= */

function getSortValue() {

    return (

        userSortSelect?.value

        ||

        "newest"

    );

}


/* =========================================================
   FILTER USERS
========================================================= */

function filterUsers(
    users
) {

    const searchValue =
        getSearchValue();


    const roleFilter =
        getRoleFilter();


    const departmentFilter =
        getDepartmentFilter();


    return users.filter(
        (user) => {

            const searchableText = [

                user.id,

                user.fullName,

                user.email,

                user.mobileNumber,

                user.department,

                user.programme,

                user.academicYear,

                user.section,

                user.registerNumber,

                formatCampusRole(
                    user.campusRole
                )

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


            const matchesRole =

                roleFilter === "all" ||

                user.campusRole ===
                roleFilter;


            const matchesDepartment =

                departmentFilter === "all" ||

                user.department ===
                departmentFilter;


            return (

                matchesSearch &&

                matchesRole &&

                matchesDepartment

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

    if (
        !value
    ) {

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
   SORT USERS
========================================================= */

function sortUsers(
    users
) {

    const sortValue =
        getSortValue();


    const sortedUsers = [

        ...users

    ];


    sortedUsers.sort(
        (
            firstUser,
            secondUser
        ) => {

            switch (
                sortValue
            ) {

                case "oldest":

                    return (

                        getDateTime(
                            firstUser.createdAt,
                            0
                        )

                        -

                        getDateTime(
                            secondUser.createdAt,
                            0
                        )

                    );


                case "name_asc":

                    return firstUser
                        .fullName
                        .localeCompare(
                            secondUser.fullName
                        );


                case "name_desc":

                    return secondUser
                        .fullName
                        .localeCompare(
                            firstUser.fullName
                        );


                case "department":

                    return (

                        firstUser.department
                            .localeCompare(
                                secondUser.department
                            )

                        ||

                        firstUser.fullName
                            .localeCompare(
                                secondUser.fullName
                            )

                    );


                case "newest":

                default:

                    return (

                        getDateTime(
                            secondUser.createdAt,
                            0
                        )

                        -

                        getDateTime(
                            firstUser.createdAt,
                            0
                        )

                    );

            }

        }
    );


    return sortedUsers;

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

        userResultCount,

        `${safeCount} ${

            safeCount === 1

                ? "user"

                : "users"

        } found`

    );

}


/* =========================================================
   CREATE META ITEM
========================================================= */

function createMetaItem(
    labelText,
    valueText
) {

    const item =
        document.createElement(
            "div"
        );


    item.className =
        "admin-user-meta-item";


    const label =
        document.createElement(
            "span"
        );


    setText(
        label,
        labelText
    );


    const value =
        document.createElement(
            "strong"
        );


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
   CREATE USER CARD
========================================================= */

function createUserCard(
    user
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "admin-user-card";


    /* =====================================================
       HEADER
    ===================================================== */

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "admin-user-card-header";


    const identity =
        document.createElement(
            "div"
        );


    identity.className =
        "admin-user-card-identity";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "admin-user-avatar";


    setText(

        avatar,

        getInitials(
            user.fullName
        )

    );


    const identityContent =
        document.createElement(
            "div"
        );


    const name =
        document.createElement(
            "h3"
        );


    name.className =
        "admin-user-name";


    setText(
        name,
        user.fullName
    );


    const campusIdentity =
        document.createElement(
            "p"
        );


    campusIdentity.className =
        "admin-user-identity";


    setText(

        campusIdentity,

        createUserIdentity(
            user
        )

    );


    identityContent.append(
        name,
        campusIdentity
    );


    identity.append(
        avatar,
        identityContent
    );


    const role =
        document.createElement(
            "span"
        );


    role.className =

        `admin-user-role ${
            user.campusRole
        }`;


    setText(

        role,

        formatCampusRole(
            user.campusRole
        )

    );


    header.append(
        identity,
        role
    );


    /* =====================================================
       EMAIL
    ===================================================== */

    const email =
        document.createElement(
            "p"
        );


    email.className =
        "admin-user-email";


    setText(

        email,

        user.email ||

        "Email unavailable"

    );


    /* =====================================================
       META
    ===================================================== */

    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "admin-user-meta";


    meta.append(

        createMetaItem(

            "REGISTER NUMBER",

            user.registerNumber ||

            "Not available"

        ),

        createMetaItem(

            "DEPARTMENT",

            user.department ||

            "Not available"

        ),

        createMetaItem(

            "MOBILE",

            user.mobileNumber ||

            "Not available"

        ),

        createMetaItem(

            "JOINED",

            formatDate(
                user.createdAt
            )

        )

    );


    card.append(

        header,

        email,

        meta

    );


    return card;

}


/* =========================================================
   HIDE ALL USER STATES
========================================================= */

function hideAllUserStates() {

    hideElement(
        userLoadingState
    );


    hideElement(
        adminUserList
    );


    hideElement(
        userEmptyState
    );


    hideElement(
        userNoResultState
    );


    hideElement(
        userErrorState
    );

}


/* =========================================================
   RENDER USER LIST
========================================================= */

function renderUserList(
    users
) {

    hideAllUserStates();


    adminUserList
        ?.replaceChildren();


    updateResultCount(
        users.length
    );


    if (
        platformUsers.length ===
        0
    ) {

        showElement(
            userEmptyState
        );


        return;

    }


    if (
        users.length ===
        0
    ) {

        showElement(
            userNoResultState
        );


        return;

    }


    const fragment =
        document.createDocumentFragment();


    users.forEach(
        (user) => {

            fragment.appendChild(

                createUserCard(
                    user
                )

            );

        }
    );


    adminUserList
        ?.appendChild(
            fragment
        );


    showElement(
        adminUserList
    );

}


/* =========================================================
   APPLY USER FILTERS
========================================================= */

function applyUserFilters() {

    const filteredUsers =
        filterUsers(
            platformUsers
        );


    visibleUsers =
        sortUsers(
            filteredUsers
        );


    renderUserList(
        visibleUsers
    );

}


/* =========================================================
   RESET USER FILTERS
========================================================= */

function resetUserFilters() {

    if (
        userSearchInput
    ) {

        userSearchInput.value =
            "";

    }


    if (
        userRoleFilter
    ) {

        userRoleFilter.value =
            "all";

    }


    if (
        userDepartmentFilter
    ) {

        userDepartmentFilter.value =
            "all";

    }


    if (
        userSortSelect
    ) {

        userSortSelect.value =
            "newest";

    }


    applyUserFilters();

}


/* =========================================================
   RENDER USER ERROR
========================================================= */

function renderUserError(
    error
) {

    hideAllUserStates();


    const message =
        cleanText(
            error?.message
        )

        ||

        "An unexpected error occurred while loading platform users.";


    setText(
        userErrorMessage,
        message
    );


    updateResultCount(
        0
    );


    showElement(
        userErrorState
    );

}


/* =========================================================
   LOAD PLATFORM USERS
========================================================= */

async function loadPlatformUsers() {

    hideAllUserStates();


    showElement(
        userLoadingState
    );


    try {

        platformUsers =
            await getPlatformUsers();


        visibleUsers =
            [];


        renderUserOverview();


        populateDepartmentFilter();


        applyUserFilters();


    } catch (error) {

        console.error(
            "Admin platform user loading error:",
            error
        );


        platformUsers =
            [];


        visibleUsers =
            [];


        renderUserOverview();


        populateDepartmentFilter();


        renderUserError(
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


    userSearchInput
        ?.addEventListener(
            "input",
            applyUserFilters
        );


    userRoleFilter
        ?.addEventListener(
            "change",
            applyUserFilters
        );


    userDepartmentFilter
        ?.addEventListener(
            "change",
            applyUserFilters
        );


    userSortSelect
        ?.addEventListener(
            "change",
            applyUserFilters
        );


    clearUserFiltersButton
        ?.addEventListener(
            "click",
            resetUserFilters
        );


    resetUserFiltersButton
        ?.addEventListener(
            "click",
            resetUserFilters
        );


    retryUserLoadButton
        ?.addEventListener(
            "click",
            loadPlatformUsers
        );

}


/* =========================================================
   INITIALIZE ADMIN USER PAGE
========================================================= */

async function initializeAdminUserPage(
    administratorProfile
) {

    try {

        currentAdmin =
            administratorProfile;


        populateAdminNavbar(
            currentAdmin
        );


        initializeEventListeners();


        await loadPlatformUsers();


    } catch (error) {

        console.error(
            "Admin user page initialization error:",
            error
        );


        platformUsers =
            [];


        visibleUsers =
            [];


        renderUserOverview();


        renderUserError(
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
            initializeAdminUserPage
        );

    }

);