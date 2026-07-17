/* =========================================================
   KPRIET FREELANCER PLATFORM
   Signup Page Logic
   File: js/auth/signup.js
========================================================= */


import {

    requireSupabaseClient

} from "../config/supabase.js";


import {

    cleanText,

    toTitleCase,

    isValidEmail,

    isKprietEmail,

    setFieldError,

    clearFieldError,

    clearFormValidation,

    showFormMessage,

    hideFormMessage,

    setButtonLoading

} from "../utils/helpers.js";


import {

    ROUTES,

    replacePage

} from "../utils/navigation.js";


/* =========================================================
   DOM ELEMENTS
========================================================= */

const loginView =
    document.getElementById(
        "loginView"
    );


const signupView =
    document.getElementById(
        "signupView"
    );


const signupForm =
    document.getElementById(
        "signupForm"
    );


const fullNameInput =
    document.getElementById(
        "signupFullName"
    );


const emailInput =
    document.getElementById(
        "signupEmail"
    );


const passwordInput =
    document.getElementById(
        "signupPassword"
    );


const confirmPasswordInput =
    document.getElementById(
        "signupConfirmPassword"
    );


const fullNameField =
    document.getElementById(
        "signupFullNameField"
    );


const emailField =
    document.getElementById(
        "signupEmailField"
    );


const passwordField =
    document.getElementById(
        "signupPasswordField"
    );


const confirmPasswordField =
    document.getElementById(
        "signupConfirmPasswordField"
    );


const signupButton =
    document.getElementById(
        "signupButton"
    );


const signupMessage =
    document.getElementById(
        "signupMessage"
    );


const togglePasswordButton =
    document.getElementById(
        "signupTogglePasswordButton"
    );


const toggleConfirmPasswordButton =
    document.getElementById(
        "signupToggleConfirmPasswordButton"
    );


const showLoginButton =
    document.getElementById(
        "showLoginButton"
    );


const passwordShowIcon =
    togglePasswordButton?.querySelector(
        ".password-show-icon"
    );


const passwordHideIcon =
    togglePasswordButton?.querySelector(
        ".password-hide-icon"
    );


const confirmPasswordShowIcon =
    toggleConfirmPasswordButton?.querySelector(
        ".password-show-icon"
    );


const confirmPasswordHideIcon =
    toggleConfirmPasswordButton?.querySelector(
        ".password-hide-icon"
    );


/* =========================================================
   SIGNUP CONFIGURATION
========================================================= */

const SIGNUP_CONFIG =
    Object.freeze({

        MINIMUM_PASSWORD_LENGTH:
            8,

        PASSWORD_UPPERCASE_PATTERN:
            /[A-Z]/,

        PASSWORD_LOWERCASE_PATTERN:
            /[a-z]/,

        PASSWORD_DIGIT_PATTERN:
            /[0-9]/,

        PASSWORD_SYMBOL_PATTERN:
            /[^A-Za-z0-9]/

    });


/* =========================================================
   SIGNUP STATE
========================================================= */

let signupInProgress =
    false;


let eventListenersInitialized =
    false;


let liveValidationInitialized =
    false;


/* =========================================================
   VALIDATE FULL NAME
========================================================= */

function validateFullName() {

    const fullName =
        cleanText(
            fullNameInput?.value
        );


    if (
        !fullName
    ) {

        setFieldError(

            fullNameField,

            "Full name is required."

        );


        return false;

    }


    if (
        fullName.length <
        3
    ) {

        setFieldError(

            fullNameField,

            "Enter your complete name."

        );


        return false;

    }


    const nameParts =
        fullName

            .split(
                /\s+/
            )

            .filter(
                Boolean
            );


    if (
        nameParts.length <
        2
    ) {

        setFieldError(

            fullNameField,

            "Enter your full name."

        );


        return false;

    }


    clearFieldError(
        fullNameField
    );


    return true;

}


/* =========================================================
   VALIDATE KPRIET EMAIL
========================================================= */

function validateEmail() {

    const email =
        cleanText(
            emailInput?.value
        ).toLowerCase();


    if (
        !email
    ) {

        setFieldError(

            emailField,

            "KPRIET email address is required."

        );


        return false;

    }


    if (
        !isValidEmail(
            email
        )
    ) {

        setFieldError(

            emailField,

            "Enter a valid email address."

        );


        return false;

    }


    if (
        !isKprietEmail(
            email
        )
    ) {

        setFieldError(

            emailField,

            "Use your official @kpriet.ac.in email address."

        );


        return false;

    }


    clearFieldError(
        emailField
    );


    return true;

}


/* =========================================================
   CHECK PASSWORD STRENGTH
========================================================= */

function isStrongPassword(
    password
) {

    const value =
        String(
            password ??
            ""
        );


    return (

        value.length >=
            SIGNUP_CONFIG
                .MINIMUM_PASSWORD_LENGTH

        &&

        SIGNUP_CONFIG
            .PASSWORD_UPPERCASE_PATTERN
            .test(
                value
            )

        &&

        SIGNUP_CONFIG
            .PASSWORD_LOWERCASE_PATTERN
            .test(
                value
            )

        &&

        SIGNUP_CONFIG
            .PASSWORD_DIGIT_PATTERN
            .test(
                value
            )

        &&

        SIGNUP_CONFIG
            .PASSWORD_SYMBOL_PATTERN
            .test(
                value
            )

    );

}


/* =========================================================
   VALIDATE PASSWORD
========================================================= */

function validatePassword() {

    const password =
        passwordInput?.value ??
        "";


    if (
        !password
    ) {

        setFieldError(

            passwordField,

            "Password is required."

        );


        return false;

    }


    if (
        password.length <
        SIGNUP_CONFIG
            .MINIMUM_PASSWORD_LENGTH
    ) {

        setFieldError(

            passwordField,

            `Password must contain at least ${SIGNUP_CONFIG.MINIMUM_PASSWORD_LENGTH} characters.`

        );


        return false;

    }


    if (
        !SIGNUP_CONFIG
            .PASSWORD_UPPERCASE_PATTERN
            .test(
                password
            )
    ) {

        setFieldError(

            passwordField,

            "Password must contain an uppercase letter."

        );


        return false;

    }


    if (
        !SIGNUP_CONFIG
            .PASSWORD_LOWERCASE_PATTERN
            .test(
                password
            )
    ) {

        setFieldError(

            passwordField,

            "Password must contain a lowercase letter."

        );


        return false;

    }


    if (
        !SIGNUP_CONFIG
            .PASSWORD_DIGIT_PATTERN
            .test(
                password
            )
    ) {

        setFieldError(

            passwordField,

            "Password must contain a number."

        );


        return false;

    }


    if (
        !SIGNUP_CONFIG
            .PASSWORD_SYMBOL_PATTERN
            .test(
                password
            )
    ) {

        setFieldError(

            passwordField,

            "Password must contain a symbol."

        );


        return false;

    }


    if (
        !isStrongPassword(
            password
        )
    ) {

        setFieldError(

            passwordField,

            "Create a stronger password."

        );


        return false;

    }


    clearFieldError(
        passwordField
    );


    return true;

}


/* =========================================================
   VALIDATE CONFIRM PASSWORD
========================================================= */

function validateConfirmPassword() {

    const password =
        passwordInput?.value ??
        "";


    const confirmPassword =
        confirmPasswordInput?.value ??
        "";


    if (
        !confirmPassword
    ) {

        setFieldError(

            confirmPasswordField,

            "Confirm your password."

        );


        return false;

    }


    if (
        confirmPassword !==
        password
    ) {

        setFieldError(

            confirmPasswordField,

            "Passwords do not match."

        );


        return false;

    }


    clearFieldError(
        confirmPasswordField
    );


    return true;

}


/* =========================================================
   COMPLETE SIGNUP VALIDATION
========================================================= */

function validateSignupForm() {

    const fullNameValid =
        validateFullName();


    const emailValid =
        validateEmail();


    const passwordValid =
        validatePassword();


    const confirmPasswordValid =
        validateConfirmPassword();


    return (

        fullNameValid

        &&

        emailValid

        &&

        passwordValid

        &&

        confirmPasswordValid

    );

}


/* =========================================================
   PASSWORD VISIBILITY HELPER
========================================================= */

function updatePasswordVisibility(

    inputElement,

    toggleButton,

    showIcon,

    hideIcon

) {

    if (

        !inputElement

        ||

        !toggleButton

    ) {

        return;

    }


    const passwordIsHidden =
        inputElement.type ===
        "password";


    inputElement.type =
        passwordIsHidden

            ? "text"

            : "password";


    toggleButton.setAttribute(

        "aria-label",

        passwordIsHidden

            ? "Hide password"

            : "Show password"

    );


    toggleButton.setAttribute(

        "aria-pressed",

        String(
            passwordIsHidden
        )

    );


    showIcon?.classList.toggle(

        "hidden",

        passwordIsHidden

    );


    hideIcon?.classList.toggle(

        "hidden",

        !passwordIsHidden

    );

}


/* =========================================================
   TOGGLE PASSWORD
========================================================= */

function togglePasswordVisibility() {

    updatePasswordVisibility(

        passwordInput,

        togglePasswordButton,

        passwordShowIcon,

        passwordHideIcon

    );

}


/* =========================================================
   TOGGLE CONFIRM PASSWORD
========================================================= */

function toggleConfirmPasswordVisibility() {

    updatePasswordVisibility(

        confirmPasswordInput,

        toggleConfirmPasswordButton,

        confirmPasswordShowIcon,

        confirmPasswordHideIcon

    );

}


/* =========================================================
   CREATE AUTH ACCOUNT
========================================================= */

async function createAuthAccount(

    fullName,

    email,

    password

) {

    const client =
        requireSupabaseClient();


    const {

        data,

        error

    } = await client.auth.signUp({

        email,

        password,

        options: {

            data: {

                full_name:
                    fullName

            }

        }

    });


    if (
        error
    ) {

        throw error;

    }


    if (
        !data?.user
    ) {

        throw new Error(
            "User account was not created."
        );

    }


    return {

        success:
            true,

        user:
            data.user,

        session:
            data.session ??
            null

    };

}


/* =========================================================
   SIGN OUT UNCONFIRMED SIGNUP SESSION
========================================================= */

async function clearSignupSession() {

    try {

        const client =
            requireSupabaseClient();


        const {

            data: {
                session
            }

        } = await client.auth.getSession();


        if (
            !session
        ) {

            return;

        }


        await client.auth.signOut();


    } catch (error) {

        console.warn(
            "Unable to clear signup session:",
            error
        );

    }

}


/* =========================================================
   SIGNUP ERROR MESSAGE
========================================================= */

function getSignupErrorMessage(
    error
) {

    const message =
        String(
            error?.message ??
            ""
        ).toLowerCase();


    const status =
        Number(
            error?.status ??
            0
        );


    if (

        message.includes(
            "already registered"
        )

        ||

        message.includes(
            "already exists"
        )

        ||

        message.includes(
            "user already registered"
        )

    ) {

        return "An account already exists for this email address. Sign in instead.";

    }


    if (

        message.includes(
            "password"
        )

        &&

        message.includes(
            "weak"
        )

    ) {

        return "The password does not meet the account security requirements.";

    }


    if (

        message.includes(
            "signup is disabled"
        )

        ||

        message.includes(
            "signups not allowed"
        )

    ) {

        return "New account registration is currently unavailable.";

    }


    if (

        message.includes(
            "rate limit"
        )

        ||

        message.includes(
            "too many requests"
        )

        ||

        status ===
            429

    ) {

        return "Too many account creation attempts. Try again later.";

    }


    if (

        message.includes(
            "failed to fetch"
        )

        ||

        message.includes(
            "network"
        )

        ||

        message.includes(
            "fetch"
        )

    ) {

        return "Unable to connect to the server. Check your internet connection.";

    }


    return "Unable to create your account. Please try again.";

}


/* =========================================================
   SIGNUP SUBMISSION
========================================================= */

async function handleSignupSubmit(
    event
) {

    event.preventDefault();


    if (
        signupInProgress
    ) {

        return;

    }


    hideFormMessage(
        signupMessage
    );


    clearFormValidation(
        signupForm
    );


    const formIsValid =
        validateSignupForm();


    if (
        !formIsValid
    ) {

        showFormMessage(

            signupMessage,

            "Check the highlighted fields and complete the required information.",

            "error"

        );


        return;

    }


    const fullName =
        toTitleCase(
            fullNameInput.value
        );


    const email =
        cleanText(
            emailInput.value
        ).toLowerCase();


    const password =
        passwordInput.value;


    signupInProgress =
        true;


    setButtonLoading(

        signupButton,

        true

    );


    try {

        const signupResult =
            await createAuthAccount(

                fullName,

                email,

                password

            );


        if (
            !signupResult?.success
        ) {

            throw new Error(
                "User account was not created."
            );

        }


        /*
           EMAIL CONFIRMATION ENABLED

           Supabase creates the Auth user but does not
           provide an active session until the email is
           confirmed.
        */

        if (
            !signupResult.session
        ) {

            await clearSignupSession();


            signupForm?.reset();


            clearFormValidation(
                signupForm
            );


            showFormMessage(

                signupMessage,

                "Account created. Check your KPRIET email and confirm your account, then sign in.",

                "success"

            );


            return;

        }


        /*
           EMAIL CONFIRMATION DISABLED

           Supabase immediately returns a session.

           The user has no profiles row yet, so continue
           directly to first-time profile setup.
        */

        replacePage(
            ROUTES.PROFILE_SETUP
        );


    } catch (error) {

        console.error(
            "Signup error:",
            error
        );


        showFormMessage(

            signupMessage,

            getSignupErrorMessage(
                error
            ),

            "error"

        );


    } finally {

        signupInProgress =
            false;


        setButtonLoading(

            signupButton,

            false

        );

    }

}


/* =========================================================
   SHOW LOGIN VIEW
========================================================= */

function showLoginView() {

    hideFormMessage(
        signupMessage
    );


    clearFormValidation(
        signupForm
    );


    signupView?.classList.add(
        "hidden"
    );


    signupView?.setAttribute(
        "aria-hidden",
        "true"
    );


    loginView?.classList.remove(
        "hidden"
    );


    loginView?.setAttribute(
        "aria-hidden",
        "false"
    );


    document.dispatchEvent(

        new CustomEvent(
            "auth:login-view-opened"
        )

    );

}


/* =========================================================
   HANDLE SIGNUP VIEW OPENED
========================================================= */

function handleSignupViewOpened() {

    hideFormMessage(
        signupMessage
    );


    clearFormValidation(
        signupForm
    );


    fullNameInput?.focus();

}


/* =========================================================
   LIVE VALIDATION
========================================================= */

function initializeLiveValidation() {

    if (
        liveValidationInitialized
    ) {

        return;

    }


    fullNameInput?.addEventListener(

        "blur",

        validateFullName

    );


    emailInput?.addEventListener(

        "blur",

        validateEmail

    );


    passwordInput?.addEventListener(

        "blur",

        validatePassword

    );


    confirmPasswordInput?.addEventListener(

        "blur",

        validateConfirmPassword

    );


    fullNameInput?.addEventListener(

        "input",

        () => {

            if (
                fullNameField
                    ?.classList
                    .contains(
                        "has-error"
                    )
            ) {

                validateFullName();

            }


            hideFormMessage(
                signupMessage
            );

        }

    );


    emailInput?.addEventListener(

        "input",

        () => {

            if (
                emailField
                    ?.classList
                    .contains(
                        "has-error"
                    )
            ) {

                validateEmail();

            }


            hideFormMessage(
                signupMessage
            );

        }

    );


    passwordInput?.addEventListener(

        "input",

        () => {

            if (
                passwordField
                    ?.classList
                    .contains(
                        "has-error"
                    )
            ) {

                validatePassword();

            }


            if (
                confirmPasswordField
                    ?.classList
                    .contains(
                        "has-error"
                    )

                &&

                confirmPasswordInput?.value
            ) {

                validateConfirmPassword();

            }


            hideFormMessage(
                signupMessage
            );

        }

    );


    confirmPasswordInput?.addEventListener(

        "input",

        () => {

            if (
                confirmPasswordField
                    ?.classList
                    .contains(
                        "has-error"
                    )
            ) {

                validateConfirmPassword();

            }


            hideFormMessage(
                signupMessage
            );

        }

    );


    liveValidationInitialized =
        true;

}


/* =========================================================
   INITIALIZE EVENT LISTENERS
========================================================= */

function initializeEventListeners() {

    if (
        eventListenersInitialized
    ) {

        return;

    }


    signupForm?.addEventListener(

        "submit",

        handleSignupSubmit

    );


    togglePasswordButton?.addEventListener(

        "click",

        togglePasswordVisibility

    );


    toggleConfirmPasswordButton?.addEventListener(

        "click",

        toggleConfirmPasswordVisibility

    );


    showLoginButton?.addEventListener(

        "click",

        showLoginView

    );


    document.addEventListener(

        "auth:signup-view-opened",

        handleSignupViewOpened

    );


    eventListenersInitialized =
        true;

}


/* =========================================================
   SIGNUP INITIALIZATION
========================================================= */

function initializeSignupPage() {

    if (

        !signupForm

        ||

        !fullNameInput

        ||

        !emailInput

        ||

        !passwordInput

        ||

        !confirmPasswordInput

    ) {

        console.error(
            "Signup page elements are unavailable."
        );


        return;

    }


    initializeEventListeners();


    initializeLiveValidation();

}


/* =========================================================
   START SIGNUP
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    initializeSignupPage

);


/* =========================================================
   EXPORTS
========================================================= */

export {

    SIGNUP_CONFIG,

    validateFullName,

    validateEmail,

    isStrongPassword,

    validatePassword,

    validateConfirmPassword,

    validateSignupForm,

    createAuthAccount,

    getSignupErrorMessage,

    handleSignupSubmit,

    showLoginView,

    initializeSignupPage

};