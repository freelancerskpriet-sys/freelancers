/* =========================================================
   KPRIET FREELANCER PLATFORM
   Common Helper Functions
   File: js/utils/helpers.js
========================================================= */


/* =========================================================
   STRING HELPERS
========================================================= */

/**
 * Safely converts a string value into trimmed text.
 */
export function cleanText(
    value
) {

    if (
        typeof value !==
        "string"
    ) {

        return "";

    }


    return value.trim();

}


/**
 * Converts text into title case.
 *
 * Example:
 * antony rojes m
 * ->
 * Antony Rojes M
 */
export function toTitleCase(
    value
) {

    const text =
        cleanText(
            value
        );


    if (
        !text
    ) {

        return "";

    }


    return text

        .toLowerCase()

        .split(
            /\s+/
        )

        .filter(
            Boolean
        )

        .map(
            (word) => {

                return (

                    word
                        .charAt(
                            0
                        )
                        .toUpperCase()

                    +

                    word.slice(
                        1
                    )

                );

            }
        )

        .join(
            " "
        );

}


/**
 * Converts text to uppercase safely.
 */
export function toUpperCase(
    value
) {

    return cleanText(
        value
    ).toUpperCase();

}


/**
 * Returns the first name from a full name.
 *
 * Example:
 * Antony Rojes M
 * ->
 * Antony
 */
export function getFirstName(
    fullName
) {

    const name =
        cleanText(
            fullName
        );


    if (
        !name
    ) {

        return "User";

    }


    const firstName =
        name
            .split(
                /\s+/
            )
            .filter(
                Boolean
            )[0];


    return (
        firstName ||
        "User"
    );

}


/**
 * Creates initials from a full name.
 *
 * Example:
 * Antony Rojes M
 * ->
 * AR
 */
export function getInitials(
    fullName,
    maximumLetters = 2
) {

    const name =
        cleanText(
            fullName
        );


    if (
        !name
    ) {

        return "US";

    }


    const safeMaximumLetters =
        Number.isInteger(
            maximumLetters
        )

        &&

        maximumLetters > 0

            ? maximumLetters

            : 2;


    const words =
        name

            .split(
                /\s+/
            )

            .filter(
                Boolean
            );


    return words

        .slice(
            0,
            safeMaximumLetters
        )

        .map(
            (word) => {

                return word.charAt(
                    0
                );

            }
        )

        .join(
            ""
        )

        .toUpperCase();

}


/**
 * Limits long text.
 */
export function truncateText(
    value,
    maximumLength = 100
) {

    const text =
        cleanText(
            value
        );


    const safeMaximumLength =
        Number.isInteger(
            maximumLength
        )

        &&

        maximumLength > 0

            ? maximumLength

            : 100;


    if (
        text.length <=
        safeMaximumLength
    ) {

        return text;

    }


    return (

        text
            .slice(
                0,
                safeMaximumLength
            )
            .trimEnd()

        +

        "..."

    );

}


/* =========================================================
   EMAIL HELPERS
========================================================= */

/**
 * Checks whether an email has a valid basic format.
 */
export function isValidEmail(
    email
) {

    const value =
        cleanText(
            email
        );


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    return emailPattern.test(
        value
    );

}


/**
 * Checks whether an email belongs to KPRIET.
 */
export function isKprietEmail(
    email
) {

    const value =
        cleanText(
            email
        ).toLowerCase();


    return value.endsWith(
        "@kpriet.ac.in"
    );

}


/* =========================================================
   MOBILE NUMBER HELPERS
========================================================= */

/**
 * Removes all non-numeric characters.
 */
export function onlyNumbers(
    value
) {

    return String(
        value ??
        ""
    ).replace(
        /\D/g,
        ""
    );

}


/**
 * Validates an Indian mobile number.
 *
 * Expected:
 * - 10 digits
 * - First digit from 6 to 9
 */
export function isValidMobileNumber(
    mobileNumber
) {

    const number =
        onlyNumbers(
            mobileNumber
        );


    return /^[6-9]\d{9}$/.test(
        number
    );

}


/**
 * Formats a 10-digit mobile number.
 *
 * Example:
 * 9876543210
 * ->
 * 98765 43210
 */
export function formatMobileNumber(
    mobileNumber
) {

    const number =
        onlyNumbers(
            mobileNumber
        );


    if (
        number.length !==
        10
    ) {

        return number;

    }


    return (

        `${number.slice(
            0,
            5
        )} `

        +

        number.slice(
            5
        )

    );

}


/* =========================================================
   URL HELPERS
========================================================= */

/**
 * Normalizes a URL by adding HTTPS when required.
 */
export function normalizeUrl(
    value
) {

    const url =
        cleanText(
            value
        );


    if (
        !url
    ) {

        return "";

    }


    if (

        url.startsWith(
            "http://"
        )

        ||

        url.startsWith(
            "https://"
        )

    ) {

        return url;

    }


    return `https://${url}`;

}


/**
 * Checks whether a URL is valid.
 *
 * Only HTTP and HTTPS URLs are accepted.
 */
export function isValidUrl(
    value
) {

    const normalizedUrl =
        normalizeUrl(
            value
        );


    if (
        !normalizedUrl
    ) {

        return false;

    }


    try {

        const parsedUrl =
            new URL(
                normalizedUrl
            );


        return (

            parsedUrl.protocol ===
                "http:"

            ||

            parsedUrl.protocol ===
                "https:"

        );


    } catch {

        return false;

    }

}


/* =========================================================
   DATE HELPERS
========================================================= */

/**
 * Converts a date into a readable format.
 *
 * Example:
 * 2026-07-14
 * ->
 * 14 Jul 2026
 */
export function formatDate(
    dateValue
) {

    if (
        !dateValue
    ) {

        return "Not available";

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


/**
 * Converts a date and time into a readable format.
 */
export function formatDateTime(
    dateValue
) {

    if (
        !dateValue
    ) {

        return "Not available";

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
                "numeric",

            hour:
                "2-digit",

            minute:
                "2-digit"

        }
    ).format(
        date
    );

}


/**
 * Returns YYYY-MM-DD using the user's local date.
 */
export function getLocalDateString(
    dateValue = new Date()
) {

    const date =
        new Date(
            dateValue
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }


    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() +
            1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


    return `${year}-${month}-${day}`;

}


/**
 * Checks whether a date is in the past.
 */
export function isPastDate(
    dateValue
) {

    const safeDateValue =
        cleanText(
            dateValue
        );


    if (
        !safeDateValue
    ) {

        return false;

    }


    const inputDate =
        new Date(
            `${safeDateValue}T00:00:00`
        );


    if (
        Number.isNaN(
            inputDate.getTime()
        )
    ) {

        return false;

    }


    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return inputDate <
        today;

}


/* =========================================================
   STATUS HELPERS
========================================================= */

/**
 * Converts database status values into readable labels.
 *
 * Example:
 * in_progress
 * ->
 * In Progress
 */
export function formatStatus(
    status
) {

    const value =
        cleanText(
            status
        );


    if (
        !value
    ) {

        return "Unknown";

    }


    return value

        .replace(
            /_/g,
            " "
        )

        .replace(
            /\b\w/g,
            (letter) => {

                return letter.toUpperCase();

            }
        );

}


/**
 * Returns a common badge class for a status.
 */
export function getStatusBadgeClass(
    status
) {

    const value =
        cleanText(
            status
        ).toLowerCase();


    const successStatuses =
        new Set([

            "accepted",

            "approved",

            "active",

            "completed",

            "available"

        ]);


    const warningStatuses =
        new Set([

            "pending",

            "forwarded",

            "in_progress",

            "busy"

        ]);


    const dangerStatuses =
        new Set([

            "rejected",

            "not_available",

            "cancelled",

            "failed"

        ]);


    if (
        successStatuses.has(
            value
        )
    ) {

        return "badge badge-success";

    }


    if (
        warningStatuses.has(
            value
        )
    ) {

        return "badge badge-warning";

    }


    if (
        dangerStatuses.has(
            value
        )
    ) {

        return "badge badge-danger";

    }


    return "badge badge-neutral";

}


/* =========================================================
   ROLE HELPERS
========================================================= */

/**
 * Formats a campus role.
 */
export function formatCampusRole(
    role
) {

    const roles = {

        student:
            "Student",

        faculty:
            "Faculty",

        staff:
            "Staff",

        hod:
            "HOD"

    };


    return (

        roles[
            cleanText(
                role
            ).toLowerCase()
        ]

        ??

        "User"

    );

}


/**
 * Checks whether a profile belongs to an administrator.
 */
export function isAdminProfile(
    profile
) {

    return (
        profile?.is_admin ===
        true
    );

}


/**
 * Creates a simple role label.
 *
 * Example:
 * STUDENT · CSE
 */
export function createRoleLabel(
    profile
) {

    if (
        !profile
    ) {

        return "KPRIET USER";

    }


    if (
        isAdminProfile(
            profile
        )
    ) {

        return "ADMINISTRATOR";

    }


    const role =
        formatCampusRole(
            profile.campus_role
        ).toUpperCase();


    const department =
        cleanText(
            profile.department
        ).toUpperCase();


    if (
        !department
    ) {

        return role;

    }


    return `${role} · ${department}`;

}


/**
 * Creates detailed navbar role text.
 *
 * Student example:
 * III YEAR · CSE · SECTION A
 *
 * Faculty example:
 * FACULTY · CSE
 */
export function createNavbarRole(
    profile
) {

    if (
        !profile
    ) {

        return "KPRIET USER";

    }


    if (
        isAdminProfile(
            profile
        )
    ) {

        return "ADMINISTRATOR";

    }


    const campusRole =
        cleanText(
            profile.campus_role
        ).toLowerCase();


    const academicYear =
        cleanText(
            profile.academic_year
        ).toUpperCase();


    const department =
        cleanText(
            profile.department
        ).toUpperCase();


    const section =
        cleanText(
            profile.section
        ).toUpperCase();


    if (
        campusRole ===
        "student"
    ) {

        const studentRoleParts =
            [];


        if (
            academicYear
        ) {

            studentRoleParts.push(
                `${academicYear} YEAR`
            );

        }


        if (
            department
        ) {

            studentRoleParts.push(
                department
            );

        }


        if (
            section
        ) {

            studentRoleParts.push(
                `SECTION ${section}`
            );

        }


        return (

            studentRoleParts.join(
                " · "
            )

            ||

            "STUDENT"

        );

    }


    const roleParts = [

        formatCampusRole(
            campusRole
        ).toUpperCase(),

        department

    ].filter(
        Boolean
    );


    return (

        roleParts.join(
            " · "
        )

        ||

        "KPRIET USER"

    );

}


/* =========================================================
   DOM HELPERS
========================================================= */

/**
 * Finds one HTML element.
 */
export function getElement(
    selector,
    parent = document
) {

    if (
        !selector ||
        !parent?.querySelector
    ) {

        return null;

    }


    return parent.querySelector(
        selector
    );

}


/**
 * Finds multiple HTML elements.
 */
export function getElements(
    selector,
    parent = document
) {

    if (
        !selector ||
        !parent?.querySelectorAll
    ) {

        return [];

    }


    return Array.from(

        parent.querySelectorAll(
            selector
        )

    );

}


/**
 * Resolves either a DOM element or CSS selector.
 */
function resolveElement(
    elementOrSelector
) {

    if (
        typeof elementOrSelector ===
        "string"
    ) {

        return getElement(
            elementOrSelector
        );

    }


    return (
        elementOrSelector ??
        null
    );

}


/**
 * Safely updates text content.
 */
export function setText(
    elementOrSelector,
    value
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    element.textContent =
        value ??
        "";

}


/**
 * Shows an HTML element.
 */
export function showElement(
    elementOrSelector
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    element.classList.remove(
        "hidden"
    );

}


/**
 * Hides an HTML element.
 */
export function hideElement(
    elementOrSelector
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    element.classList.add(
        "hidden"
    );

}


/**
 * Enables an element.
 */
export function enableElement(
    elementOrSelector
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    element.disabled =
        false;

}


/**
 * Disables an element.
 */
export function disableElement(
    elementOrSelector
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    element.disabled =
        true;

}


/* =========================================================
   FORM MESSAGE HELPERS
========================================================= */

/**
 * Displays a common form message.
 *
 * Supported types:
 * success
 * error
 * warning
 */
export function showFormMessage(
    elementOrSelector,
    message,
    type = "error"
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    const allowedTypes =
        new Set([

            "success",

            "error",

            "warning"

        ]);


    const messageType =
        allowedTypes.has(
            type
        )

            ? type

            : "error";


    element.classList.remove(

        "success",

        "error",

        "warning"

    );


    element.textContent =
        cleanText(
            message
        );


    element.classList.add(

        "show",

        messageType

    );

}


/**
 * Hides a common form message.
 */
export function hideFormMessage(
    elementOrSelector
) {

    const element =
        resolveElement(
            elementOrSelector
        );


    if (
        !element
    ) {

        return;

    }


    element.classList.remove(

        "show",

        "success",

        "error",

        "warning"

    );


    element.textContent =
        "";

}


/* =========================================================
   FIELD VALIDATION UI
========================================================= */

/**
 * Displays an error below a form field.
 */
export function setFieldError(
    fieldElement,
    message
) {

    if (
        !fieldElement
    ) {

        return;

    }


    fieldElement.classList.remove(
        "has-success"
    );


    fieldElement.classList.add(
        "has-error"
    );


    const errorElement =
        fieldElement.querySelector(
            ".field-error"
        );


    if (
        errorElement
    ) {

        errorElement.textContent =
            cleanText(
                message
            );

    }

}


/**
 * Clears a form field validation state.
 */
export function clearFieldError(
    fieldElement
) {

    if (
        !fieldElement
    ) {

        return;

    }


    fieldElement.classList.remove(

        "has-error",

        "has-success"

    );


    const errorElement =
        fieldElement.querySelector(
            ".field-error"
        );


    if (
        errorElement
    ) {

        errorElement.textContent =
            "";

    }

}


/**
 * Displays a successful field state.
 */
export function setFieldSuccess(
    fieldElement
) {

    if (
        !fieldElement
    ) {

        return;

    }


    fieldElement.classList.remove(
        "has-error"
    );


    fieldElement.classList.add(
        "has-success"
    );


    const errorElement =
        fieldElement.querySelector(
            ".field-error"
        );


    if (
        errorElement
    ) {

        errorElement.textContent =
            "";

    }

}


/**
 * Clears all validation states inside a form.
 */
export function clearFormValidation(
    formElement
) {

    if (
        !formElement
    ) {

        return;

    }


    const fields =
        formElement.querySelectorAll(
            ".form-field"
        );


    fields.forEach(
        (field) => {

            clearFieldError(
                field
            );

        }
    );

}


/* =========================================================
   BUTTON LOADING HELPERS
========================================================= */

/**
 * Controls the loading state of a button.
 */
export function setButtonLoading(
    buttonElement,
    isLoading = true
) {

    if (
        !buttonElement
    ) {

        return;

    }


    const loading =
        Boolean(
            isLoading
        );


    buttonElement.classList.toggle(

        "is-loading",

        loading

    );


    buttonElement.disabled =
        loading;


    buttonElement.setAttribute(

        "aria-busy",

        String(
            loading
        )

    );

}


/* =========================================================
   CHARACTER COUNTER
========================================================= */

/**
 * Connects an input or textarea to a character counter.
 */
export function initializeCharacterCounter(
    inputElement,
    counterElement,
    maximumLength
) {

    if (

        !inputElement ||

        !counterElement

    ) {

        return null;

    }


    const safeMaximumLength =
        Number.isInteger(
            maximumLength
        )

        &&

        maximumLength > 0

            ? maximumLength

            : 100;


    const updateCounter =
        () => {

            const currentLength =
                inputElement
                    .value
                    .length;


            counterElement.textContent =

                `${currentLength} / ${safeMaximumLength}`;

        };


    inputElement.maxLength =
        safeMaximumLength;


    inputElement.addEventListener(

        "input",

        updateCounter

    );


    updateCounter();


    return updateCounter;

}


/* =========================================================
   LOCAL STORAGE HELPERS
========================================================= */

/**
 * Stores JSON-compatible temporary UI data.
 *
 * Supabase remains the permanent database.
 */
export function saveLocalData(
    key,
    value
) {

    const safeKey =
        cleanText(
            key
        );


    if (
        !safeKey
    ) {

        return false;

    }


    try {

        localStorage.setItem(

            safeKey,

            JSON.stringify(
                value
            )

        );


        return true;


    } catch (error) {

        console.error(
            "Unable to save local data:",
            error
        );


        return false;

    }

}


/**
 * Reads JSON data from localStorage.
 */
export function getLocalData(
    key,
    fallbackValue = null
) {

    const safeKey =
        cleanText(
            key
        );


    if (
        !safeKey
    ) {

        return fallbackValue;

    }


    try {

        const storedValue =
            localStorage.getItem(
                safeKey
            );


        if (
            storedValue ===
            null
        ) {

            return fallbackValue;

        }


        return JSON.parse(
            storedValue
        );


    } catch (error) {

        console.error(
            "Unable to read local data:",
            error
        );


        return fallbackValue;

    }

}


/**
 * Removes temporary local data.
 */
export function removeLocalData(
    key
) {

    const safeKey =
        cleanText(
            key
        );


    if (
        !safeKey
    ) {

        return false;

    }


    try {

        localStorage.removeItem(
            safeKey
        );


        return true;


    } catch (error) {

        console.error(
            "Unable to remove local data:",
            error
        );


        return false;

    }

}


/* =========================================================
   HTML SAFETY
========================================================= */

/**
 * Escapes text before inserting user-controlled content
 * into an HTML string.
 *
 * Prefer textContent whenever possible.
 */
export function escapeHtml(
    value
) {

    return String(
        value ??
        ""
    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   DEBOUNCE
========================================================= */

/**
 * Delays repeated function calls.
 *
 * Useful for search inputs.
 */
export function debounce(
    callback,
    delay = 300
) {

    if (
        typeof callback !==
        "function"
    ) {

        throw new TypeError(
            "Debounce callback must be a function."
        );

    }


    const safeDelay =
        Number.isFinite(
            Number(
                delay
            )
        )

        &&

        Number(
            delay
        ) >= 0

            ? Number(
                delay
            )

            : 300;


    let timerId =
        null;


    return function debouncedFunction(
        ...args
    ) {

        const context =
            this;


        clearTimeout(
            timerId
        );


        timerId =
            setTimeout(
                () => {

                    callback.apply(
                        context,
                        args
                    );

                },
                safeDelay
            );

    };

}


/* =========================================================
   UNIQUE VALUES
========================================================= */

/**
 * Removes duplicate and empty string values.
 */
export function getUniqueValues(
    values = []
) {

    if (
        !Array.isArray(
            values
        )
    ) {

        return [];

    }


    return [

        ...new Set(

            values

                .map(
                    (value) => {

                        return cleanText(
                            value
                        );

                    }
                )

                .filter(
                    Boolean
                )

        )

    ];

}