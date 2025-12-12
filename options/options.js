// Behavior
const checkboxSlow = document.getElementById("slow")
const speedInput = document.getElementById("speed")
const highlightBackgroundColorInput = document.getElementById("highlightBackgroundColor")
const highlightBorderColorInput = document.getElementById("highlightBorderColor")

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

// Display 
const checkboxProblemDisplay = document.getElementById("problemResult")
const checkboxWarningDisplay = document.getElementById("warningResult")
const checkboxUnobservableDisplay = document.getElementById("unobservableResult")
const checkboxMousedownDisplay = document.getElementById("mousedownResults")
const checkboxPointerdownDisplay = document.getElementById("pointerdownResults")
const checkboxTouchstartDisplay = document.getElementById("touchstartResults")
const checkboxFormDisplay = document.getElementById("formResults")

// Option Buttons and Elements
const optionStatus = document.getElementById("optionStatus")
const optionDialog = document.getElementById("optionDialog")

const optionSaveButton = document.getElementById("optionSave")
optionSaveButton.addEventListener("click", saveOptions)

const optionResetButton = document.getElementById("optionResetDialog")
optionResetButton.addEventListener("click", () => optionDialog.showModal())

const optionConfirmButton = document.getElementById("optionReset")
optionConfirmButton.addEventListener("click", clearOptions)
const optionCancelButton = document.getElementById("optionCancel")
optionCancelButton.addEventListener("click", () => optionDialog.close())

// Display Buttons and Elements
const displayStatus = document.getElementById("displayStatus")
const displayDialog = document.getElementById("displayDialog")

const displaySaveButton = document.getElementById("displaySave")
displaySaveButton.addEventListener("click", saveDisplay)

const displayResetButton = document.getElementById("displayResetDialog")
displayResetButton.addEventListener("click", () => displayDialog.showModal())

const displayConfirmButton = document.getElementById("displayReset")
displayConfirmButton.addEventListener("click", clearDisplay)
const displayCancelButton = document.getElementById("displayCancel")
displayCancelButton.addEventListener("click", () => displayDialog.close())

// DEBUG: Display all items in storage
chrome.storage.sync.get(null, (items) => {
    console.log(items);
});

// DEBUG: Monitor how much space the storage takes up
chrome.storage.sync.getBytesInUse(null, (bytes) => {
    console.log("Sync storage in bytes:", bytes);
});

// DEBUG: Delete entire sync.storage :chrome.storage.sync.clear()

// Save options
function saveOptions() {
    const slowTest = checkboxSlow.checked
    const speedValue = speedInput.value
    const highlightBackgroundColor = highlightBackgroundColorInput.value
    const highlightBorderColor = highlightBorderColorInput.value

    const primaryProblemColor = primaryProblemColorInput.value
    const secondaryProblemColor = secondaryProblemColorInput.value
    const primaryWarningColor = primaryWarningColorInput.value
    const secondaryWarningColor = secondaryWarningColorInput.value

    const filterMultiple = checkboxMultipleDownEvents.checked
    const filterCSS = checkboxCSS.checked
    const filterFalsy = checkboxFalsy.checked
    const filterSameAttribute = checkboxSameAttribute.checked
    const filterAriaExpanded = checkboxAriaExpanded.checked
    const filterData = checkboxData.checked
    const filterHeadTitle = checkboxHeadTitle.checked
    const filterCharacterData = checkboxSameCD.checked

    chrome.storage.sync.set(
        {
            sT: slowTest, sV: speedValue, hBa: highlightBackgroundColor, hBo: highlightBorderColor,
            pPC: primaryProblemColor, sPC: secondaryProblemColor, pWC: primaryWarningColor, sWC: secondaryWarningColor,
            fME: filterMultiple, fS: filterCSS, fF: filterFalsy,
            fSA: filterSameAttribute, fAE: filterAriaExpanded, fD: filterData,
            fHT: filterHeadTitle, fCD: filterCharacterData
        },
        () => {
            optionStatus.textContent = "Options saved."
            setTimeout(() => {
                optionStatus.textContent = '';
            }, 3000);
        }
    )
}

// Clear options 
function clearOptions() {
    let optionKeys = ["sT", "sV", "hBa", "hBo",
        "pPC", "sPC", "pWC", "sWC",
        "fME", "fS", "fF", "fSA", "fAE", "fD", "fHT", "fCD"]
    let testingSpeedField = document.querySelector(".behavior div")
    optionDialog.close()
    chrome.storage.sync.remove(optionKeys)
    checkboxSlow.checked = false
    speedInput.value = 10
    highlightBackgroundColorInput.value = "#FDFF47"
    highlightBorderColorInput.value = "#000000"
    primaryProblemColorInput.value = "#ff8400"
    secondaryProblemColorInput.value = "#0421c4"
    primaryWarningColorInput.value = "#9400D3"
    secondaryWarningColorInput.value = "#F5F531"
    checkboxMultipleDownEvents.checked = false
    checkboxCSS.checked = true
    checkboxFalsy.checked = true
    checkboxSameAttribute.checked = true
    checkboxAriaExpanded.checked = true
    checkboxData.checked = true
    checkboxHeadTitle.checked = true
    checkboxSameCD.checked = true
    if (!testingSpeedField.classList.contains("hidden")) testingSpeedField.classList.add("hidden")
    optionStatus.textContent = "Defaults restored."
    setTimeout(() => {
        optionStatus.textContent = ''
    }, 3000)
}

// Save Display Options
function saveDisplay() {
    const displayProblem = checkboxProblemDisplay.checked
    const displayWarning = checkboxWarningDisplay.checked
    const displayUnobservable = checkboxUnobservableDisplay.checked
    const displayMousedown = checkboxMousedownDisplay.checked
    const displayPointerdown = checkboxPointerdownDisplay.checked
    const displayTouchstart = checkboxTouchstartDisplay.checked
    const displayForm = checkboxFormDisplay.checked

    chrome.storage.sync.set(
        {
            dPr: displayProblem, dWa: displayWarning, dUn: displayUnobservable,
            dMo: displayMousedown, dPo: displayPointerdown, dTo: displayTouchstart,
            dF: displayForm
        },
        () => {
            displayStatus.textContent = "Display options saved."
            setTimeout(() => {
                displayStatus.textContent = '';
            }, 3000);
        }
    )
}

// Clear display options
function clearDisplay() {
    // ToDo: Check all checkboxes and take a look at display
    let displayKeys = ["dPr", "dWa", "dUn",
        "dMo", "dPo", "dTo", "dF"]
    displayDialog.close()
    chrome.storage.sync.remove(displayKeys)
    checkboxProblemDisplay.checked = true
    checkboxWarningDisplay.checked = true
    checkboxUnobservableDisplay.checked = true
    checkboxMousedownDisplay.checked = true
    checkboxPointerdownDisplay.checked = true
    checkboxTouchstartDisplay.checked = true
    checkboxFormDisplay.checked = true
    
    // Calls function from panel.js
    displayResults()
    displayFormMarkings()
 
    displayStatus.textContent = "Defaults restored."
    setTimeout(() => {
        displayStatus.textContent = ""
    }, 3000)
}

// Load all options
function restoreOptions() {
    // ToDo: Change sV to a higher value later (10 is too low, 500 or 1000)
    chrome.storage.sync.get(
        {
            sT: false, sV: 10, hBa: "#FDFF47", hBo: "#000000",
            pPC: "#ff8400", sPC: "#0421c4", pWC: "#9400D3", sWC: "#F5F531",
            fME: false, fS: true, fF: true,
            fSA: true, fAE: true, fD: true,
            fHT: true, fCD: true,
            dPr: true, dWa: true, dUn: true,
            dMo: true, dPo: true, dTo: true, dF: true
        },
        (items) => {
            checkboxSlow.checked = items.sT
            speedInput.value = items.sV
            highlightBackgroundColorInput.value = items.hBa
            highlightBorderColorInput.value = items.hBo

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

            checkboxProblemDisplay.checked = items.dPr
            checkboxWarningDisplay.checked = items.dWa
            checkboxUnobservableDisplay.checked = items.dUn
            checkboxMousedownDisplay.checked = items.dMo
            checkboxPointerdownDisplay.checked = items.dPo
            checkboxTouchstartDisplay.checked = items.dTo
            checkboxFormDisplay.checked = items.dF

            if (checkboxSlow.checked) document.querySelector(".behavior div").classList.remove("hidden")
        }
    )
}

document.addEventListener('DOMContentLoaded', restoreOptions)