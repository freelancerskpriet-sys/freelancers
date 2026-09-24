/* =========================================================
   KPRIET FREELANCER PLATFORM
   Administrator Authorization Guard
   File: js/admin/admin-guard.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    requireAuthentication

} from "../auth/auth-guard.js";


import {

    ROUTES,

    replacePage

} from "../utils/navigation.js";


/* =========================================================
   ADMIN GUARD CONFIGURATION

   FIX:
   Authorization has migrated from the legacy "role" column
   to the boolean "is_admin" column (matching js/auth/login.js
   and the already-updated js/admin/dashboard.js). "role" is
   no longer queried or trusted here.
========================================================= */

const ADMIN_GUARD_CONFIG = Object.freeze({

    PROFILE_COLUMNS: [

        "id",

        "full_name",

        "email",

        "department",

        "academic_year",

        "section",

        "is_admin",

        "freelancer_status"

    ].join(",")

});


/* =========================================================
   ADMIN AUTHORIZATION STATE
========================================================= */

let administratorProfile = null;

let administratorChecked = false;


/* =========================================================
   GET USER PROFILE

   Reads the authenticated user's platform profile
   from the profiles table.
========================================================= */

async function getUserProfile(
    userId
) {

    if (!userId) {

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
            ADMIN_GUARD_CONFIG.PROFILE_COLUMNS
        )

        .eq(
            "id",
            userId
        )

        .maybeSingle();


    if (error) {

        throw error;

    }


    return data;

}


/* =========================================================
   CHECK ADMINISTRATOR ROLE

   FIX:
   Validates using the is_admin boolean instead of the
   legacy role string comparison.
========================================================= */

function hasAdministratorRole(
    profile
) {

    return profile?.is_admin === true;

}


/* =========================================================
   REDIRECT NON-ADMIN USER
========================================================= */

function redirectNonAdministrator() {

    replacePage(
        ROUTES.MAIN_DASHBOARD
    );

}


/* =========================================================
   REQUIRE ADMINISTRATOR

   FLOW:

   Admin page
       ↓
   Check authentication
       ↓
   Read user profile
       ↓
   is_admin === true?
       │
       ├── NO
       │    ↓
       │ Main Dashboard
       │
       └── YES
            ↓
       Allow admin page
========================================================= */

async function requireAdministrator() {

    if (

        administratorChecked &&
        administratorProfile

    ) {

        return administratorProfile;

    }


    const user =
        await requireAuthentication();


    if (!user) {

        return null;

    }


    try {

        const profile =
            await getUserProfile(
                user.id
            );


        administratorChecked = true;


        if (

            !profile ||
            !hasAdministratorRole(
                profile
            )

        ) {

            administratorProfile = null;


            redirectNonAdministrator();


            return null;

        }


        administratorProfile =
            profile;


        return administratorProfile;


    } catch (error) {

        console.error(
            "Administrator authorization error:",
            error
        );


        clearAdministratorCache();


        redirectNonAdministrator();


        return null;

    }

}


/* =========================================================
   CHECK ADMINISTRATOR

   Does not redirect for role failure.

   Returns:

   true
   → Administrator

   false
   → Not administrator
========================================================= */

async function isAdministrator() {

    const user =
        await requireAuthentication();


    if (!user) {

        return false;

    }


    try {

        const profile =
            await getUserProfile(
                user.id
            );


        administratorChecked = true;


        if (

            !profile ||
            !hasAdministratorRole(
                profile
            )

        ) {

            administratorProfile = null;


            return false;

        }


        administratorProfile =
            profile;


        return true;


    } catch (error) {

        console.error(
            "Administrator check error:",
            error
        );


        clearAdministratorCache();


        return false;

    }

}


/* =========================================================
   GET CACHED ADMINISTRATOR PROFILE
========================================================= */

function getCachedAdministratorProfile() {

    return administratorProfile;

}


/* =========================================================
   CLEAR ADMINISTRATOR CACHE
========================================================= */

function clearAdministratorCache() {

    administratorProfile = null;

    administratorChecked = false;

}


/* =========================================================
   ADMINISTRATOR PAGE INITIALIZER

   Usage:

   initializeAdministratorPage(
       initializeAdminDashboard
   );

   The page initializer executes only after
   administrator authorization succeeds.
========================================================= */

async function initializeAdministratorPage(
    pageInitializer
) {

    const profile =
        await requireAdministrator();


    if (!profile) {

        return null;

    }


    if (

        typeof pageInitializer ===
        "function"

    ) {

        await pageInitializer(
            profile
        );

    }


    return profile;

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    ADMIN_GUARD_CONFIG,

    getUserProfile,

    hasAdministratorRole,

    requireAdministrator,

    isAdministrator,

    getCachedAdministratorProfile,

    clearAdministratorCache,

    initializeAdministratorPage

};