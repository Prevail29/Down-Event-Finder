// Behavior
const checkboxSlow = document.getElementById("slow")
const speedInput = document.getElementById("speed")
const checkboxForm = document.getElementById("form")

// Colors
const primaryProblemColorInput = document.getElementById("primaryProblemColor")
const secondaryProblemColorInput = document.getElementById("secondaryProblemColor")
const primaryWarningColorInput = document.getElementById("primaryWarningColor")
const secondaryWarningColorInput = document.getElementById("secondaryWarningColor")

// Filter
const checkboxMultipleDownEvents = document.getElementById("multipleDownEvents")
const checkboxCSS = document.getElementById("cssFilter")
const checkboxFalsy = document.getElementById("falsyFilter")
const checkboxSameAttribute = document.getElementById("sameAttributeFilter")
const checkboxAriaExpanded = document.getElementById("ariaExpandedFilter")
const checkboxData = document.getElementById("dataFilter")
const checkboxHeadTitle = document.getElementById("headTitleFilter")
const checkboxSameCD = document.getElementById("sameCDFilter")

// Save Button
const saveButton = document.getElementById("saveButton")
saveButton.addEventListener("click", saveOptions)

// Various Elements
const dialog = document.querySelector("dialog");
const optionStatus = document.getElementById("optionStatus")

// Open Dialog Button
const resetDialogButton = document.getElementById("openResetDialog")
resetDialogButton.addEventListener("click", openDialog)

// Confirm Reset Button
const confirmReset = document.getElementById("confirmReset")
confirmReset.addEventListener("click", clear)

// Cancel Reset Button 
const cancelReset = document.getElementById("cancelReset")
cancelReset.addEventListener("click", closeDialog)

// Open Dialog
function openDialog() {
    dialog.showModal()
}

// Close Dialog
function closeDialog() {
    dialog.close()
}

// Clear storage
function clear() {
    dialog.close()
    chrome.storage.sync.clear()
    optionStatus.textContent = "Options reverted."
    setTimeout(() => {
        optionStatus.textContent = '';
    }, 3000);
}

// Save all options
function saveOptions() {
    const slowCheckboxActive = checkboxSlow.checked
    const speedValue = speedInput.value
    const formCheckboxActive = checkboxForm.checked

    const primaryProblemColor = primaryProblemColorInput.value
    const secondaryProblemColor = secondaryProblemColorInput.value
    const primaryWarningColor = primaryWarningColorInput.value
    const secondaryWarningColor = secondaryWarningColorInput.value

    const multipleFilter = checkboxMultipleDownEvents.checked
    const cssFilter = checkboxCSS.checked
    const falsyFilter = checkboxFalsy.checked
    const sameAttributeFilter = checkboxSameAttribute.checked
    const ariaExpandedFilter = checkboxAriaExpanded.checked
    const dataFilter = checkboxData.checked
    const headTitleFilter = checkboxHeadTitle.checked
    const characterDataFilter = checkboxSameCD.checked

    chrome.storage.sync.set(
        {
            sCA: slowCheckboxActive, sV: speedValue, fCA: formCheckboxActive,
            pPC: primaryProblemColor, sPC: secondaryProblemColor, pWC: primaryWarningColor, sWC: secondaryWarningColor,
            fME: multipleFilter, fS: cssFilter, fF: falsyFilter,
            fSA: sameAttributeFilter, fAE: ariaExpandedFilter, fD: dataFilter,
            fHT: headTitleFilter, fCD: characterDataFilter
        },
        () => {
            optionStatus.textContent = "Options saved."
            setTimeout(() => {
                optionStatus.textContent = '';
            }, 3000);
        }
    )
}

// Change sV to a higher value later
// Load options
function restoreOptions() {
    chrome.storage.sync.get(
        {
            sCA: false, sV: 10, fCA: true,
            pPC: "#ff8400", sPC: "#0421c4", pWC: "#9400D3", sWC: "#F5F531",
            fME: false, fS: true, fF: true,
            fSA: true, fAE: true, fD: true,
            fHT: true, fCD: true
        },
        (items) => {
            checkboxSlow.checked = items.sCA
            speedInput.value = items.sV
            checkboxForm.checked = items.fCA

            primaryProblemColorInput.value = items.pPC
            secondaryProblemColorInput.value = items.sPC
            primaryWarningColorInput.value = items.pWC
            secondaryWarningColorInput.value = items.sWC

            checkboxMultipleDownEvents.checked = items.fME
            checkboxCSS.checked = items.fS
            checkboxFalsy.checked = items.fF
            checkboxSameAttribute.checked = items.fSA
            checkboxAriaExpanded.checked = items.fAE
            checkboxData.checked = items.fD
            checkboxHeadTitle.checked = items.fHT
            checkboxSameCD.checked = items.fCD

            if (checkboxSlow.checked) document.querySelector("fieldset div").classList.remove("hidden")
        }
    )
}

// Display all items in storage
/*
chrome.storage.sync.get(null, (items) => {
    console.log(items);
});
*/

// Monitor how much space the storage takes up
/*
chrome.storage.sync.getBytesInUse(null, (bytes) => {
    console.log("Sync storage in bytes:", bytes);
});
*/

document.addEventListener('DOMContentLoaded', restoreOptions)