/* =========================================================
   KPRIET FREELANCER PLATFORM
   Supabase Configuration
   File: js/config/supabase.js
========================================================= */


/* =========================================================
   SUPABASE CDN
========================================================= */

import {
    createClient
} from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";


/* =========================================================
   SUPABASE PROJECT CONFIGURATION

   IMPORTANT:

   Use only the browser-safe Supabase publishable key here.

   NEVER place the following in frontend JavaScript:

   - Secret key
   - service_role key
   - Database password
   - Private server secrets
========================================================= */

const SUPABASE_CONFIG = Object.freeze({

    /*
       DEVELOPMENT MODE

       false
       → Real Supabase project is connected.
       → Application modules use the Supabase client.
    */

    DEVELOPMENT_MODE: false,


    /*
       SUPABASE PROJECT URL
    */

    PROJECT_URL:
        "https://nbuuyckmfsorxvacuwga.supabase.co",


    /*
       SUPABASE PUBLISHABLE KEY

       Paste only the sb_publishable_... key.

       This key is intended for browser applications.

       Database authorization will be protected using
       Supabase Auth and Row Level Security policies.
    */

    PUBLIC_KEY:
        "sb_publishable_aFPJSQoMfemDammm4PcO6g_O5z30c--"

});


/* =========================================================
   NORMALIZE CONFIGURATION VALUE
========================================================= */

function normalizeConfigValue(value) {

    return String(
        value ?? ""
    ).trim();

}


/* =========================================================
   CHECK PROJECT URL
========================================================= */

function isValidSupabaseProjectUrl(
    projectUrl
) {

    const normalizedUrl =
        normalizeConfigValue(
            projectUrl
        );


    if (!normalizedUrl) {

        return false;

    }


    try {

        const parsedUrl =
            new URL(
                normalizedUrl
            );


        return (
            parsedUrl.protocol === "https:" &&
            parsedUrl.hostname.endsWith(
                ".supabase.co"
            )
        );


    } catch (error) {

        console.error(
            "Invalid Supabase project URL:",
            error
        );


        return false;

    }

}


/* =========================================================
   CHECK PUBLIC KEY
========================================================= */

function isValidSupabasePublicKey(
    publicKey
) {

    const normalizedKey =
        normalizeConfigValue(
            publicKey
        );


    if (!normalizedKey) {

        return false;

    }


    /*
       Supported browser-safe Supabase keys:

       1. New publishable key
          sb_publishable_...

       2. Legacy anon JWT key
          eyJ...

       This function only validates the basic key format.

       Actual authorization is enforced using:

       - Supabase Auth
       - PostgreSQL permissions
       - Row Level Security
    */


    const isPublishableKey =
        normalizedKey.startsWith(
            "sb_publishable_"
        );


    const looksLikeLegacyAnonKey =
        normalizedKey.startsWith(
            "eyJ"
        ) &&
        normalizedKey.split(".").length === 3;


    return (
        isPublishableKey ||
        looksLikeLegacyAnonKey
    );

}


/* =========================================================
   GET CONFIGURATION STATUS
========================================================= */

function getSupabaseConfigurationStatus() {

    const projectUrl =
        normalizeConfigValue(
            SUPABASE_CONFIG.PROJECT_URL
        );


    const publicKey =
        normalizeConfigValue(
            SUPABASE_CONFIG.PUBLIC_KEY
        );


    const projectUrlValid =
        isValidSupabaseProjectUrl(
            projectUrl
        );


    const publicKeyValid =
        isValidSupabasePublicKey(
            publicKey
        );


    return {

        developmentMode:
            SUPABASE_CONFIG.DEVELOPMENT_MODE,

        projectUrlConfigured:
            Boolean(
                projectUrl
            ),

        publicKeyConfigured:
            Boolean(
                publicKey
            ),

        projectUrlValid,

        publicKeyValid,

        configured:
            projectUrlValid &&
            publicKeyValid

    };

}


/* =========================================================
   VALIDATE SUPABASE CONFIGURATION
========================================================= */

function validateSupabaseConfiguration() {

    const status =
        getSupabaseConfigurationStatus();


    if (
        SUPABASE_CONFIG.DEVELOPMENT_MODE
    ) {

        return true;

    }


    if (
        !status.projectUrlConfigured
    ) {

        throw new Error(
            "Supabase project URL is not configured."
        );

    }


    if (
        !status.projectUrlValid
    ) {

        throw new Error(
            "Supabase project URL is invalid."
        );

    }


    if (
        !status.publicKeyConfigured
    ) {

        throw new Error(
            "Supabase publishable key is not configured."
        );

    }


    if (
        !status.publicKeyValid
    ) {

        throw new Error(
            "Supabase publishable key is invalid."
        );

    }


    return true;

}


/* =========================================================
   CREATE SUPABASE CLIENT
========================================================= */

function createSupabaseClient() {

    const status =
        getSupabaseConfigurationStatus();


    /*
       Development mode without credentials.

       This branch is retained so local frontend
       development can be enabled again if required.
    */

    if (
        SUPABASE_CONFIG.DEVELOPMENT_MODE &&
        !status.configured
    ) {

        console.info(
            "Supabase development mode is active. " +
            "Remote database connection is disabled."
        );


        return null;

    }


    validateSupabaseConfiguration();


    const projectUrl =
        normalizeConfigValue(
            SUPABASE_CONFIG.PROJECT_URL
        );


    const publicKey =
        normalizeConfigValue(
            SUPABASE_CONFIG.PUBLIC_KEY
        );


    const client =
        createClient(
            projectUrl,
            publicKey,
            {

                auth: {

                    persistSession: true,

                    autoRefreshToken: true,

                    detectSessionInUrl: true

                }

            }
        );


    return client;

}


/* =========================================================
   SUPABASE CLIENT
========================================================= */

const supabase =
    createSupabaseClient();


/* =========================================================
   CHECK SUPABASE AVAILABILITY
========================================================= */

function isSupabaseAvailable() {

    return Boolean(
        supabase
    );

}


/* =========================================================
   REQUIRE SUPABASE CLIENT

   Use inside modules that require the real database.

   Example:

   const client =
       requireSupabaseClient();

   const {
       data,
       error
   } = await client
       .from("profiles")
       .select("*");
========================================================= */

function requireSupabaseClient() {

    if (!supabase) {

        throw new Error(
            "Supabase client is unavailable. " +
            "Check the project configuration."
        );

    }


    return supabase;

}


/* =========================================================
   CHECK SUPABASE CONNECTION

   Checks whether the Supabase Auth API is reachable.

   A logged-in user is not required.
========================================================= */

async function checkSupabaseConnection() {

    if (!supabase) {

        console.error(
            "Supabase connection check failed: " +
            "client is unavailable."
        );


        return false;

    }


    try {

        const {
            error
        } = await supabase.auth.getSession();


        if (error) {

            throw error;

        }


        console.info(
            "Supabase connection successful."
        );


        return true;


    } catch (error) {

        console.error(
            "Supabase connection check failed:",
            error
        );


        return false;

    }

}


/* =========================================================
   GET SAFE CONFIGURATION INFORMATION

   IMPORTANT:

   The publishable key itself is intentionally
   not returned.
========================================================= */

function getSupabaseConfigurationInfo() {

    const status =
        getSupabaseConfigurationStatus();


    return {

        developmentMode:
            status.developmentMode,

        configured:
            status.configured,

        projectUrlConfigured:
            status.projectUrlConfigured,

        publicKeyConfigured:
            status.publicKeyConfigured,

        projectUrlValid:
            status.projectUrlValid,

        publicKeyValid:
            status.publicKeyValid

    };

}


/* =========================================================
   EXPORTS
========================================================= */

export {

    SUPABASE_CONFIG,

    supabase,

    isSupabaseAvailable,

    requireSupabaseClient,

    checkSupabaseConnection,

    getSupabaseConfigurationStatus,

    getSupabaseConfigurationInfo

};