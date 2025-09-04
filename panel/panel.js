//Add event listeners to buttons
document.getElementById("initiateButton").addEventListener("click", initiateTest)
document.getElementById("slow").addEventListener("click", showTestingSpeed)
document.getElementById("checkAll").addEventListener("click", checkAllFilter)

//Functions for panel
function showTestingSpeed() {
    let checkbox = document.getElementById("slow").checked
    let testingSpeedField = document.querySelector("fieldset div")
    if (checkbox) {
        testingSpeedField.classList.remove("hidden")
    } else {
        testingSpeedField.classList.add("hidden")
    }
}

function checkAllFilter() {
    let allFilter = document.querySelectorAll('div details.filter input:not([id*="checkAll"])')
    if (document.getElementById("checkAll").checked) {
        allFilter.forEach((checkbox) => checkbox.checked = true)
    } else {
        allFilter.forEach((checkbox) => checkbox.checked = false)
    }
}

//Get values from panel
function getColors() {
    let colorWarningP = document.getElementById("primaryWarningColor").value
    let colorWarningS = document.getElementById("secondaryWarningColor").value
    let colorProblemP = document.getElementById("primaryProblemColor").value
    let colorProblemS = document.getElementById("secondaryProblemColor").value
    return [colorWarningP, colorWarningS, colorProblemP, colorProblemS]
}

function getInputSpeed() {
    let speed = document.getElementById("speed").value
    return speed
}

function getCheckboxValues() {
    let checkboxes = {
        marking: document.getElementById("marking").checked,
        forms: document.getElementById("form").checked,
        slow: document.getElementById("slow").checked,
    }
    return checkboxes
}

function getFilter() {
    let filters = {
        multipleDownEvents: document.getElementById("multipleDownEvents").checked,
        cssFilter: document.getElementById("cssFilter").checked,
        falsyFilter: document.getElementById("falsyFilter").checked,
        sameAttributeFilter: document.getElementById("sameAttributeFilter").checked,
        ariaExpandedFilter: document.getElementById("ariaExpandedFilter").checked,
        dataFilter: document.getElementById("dataFilter").checked,
        headTitleFilter: document.getElementById("headTitleFilter").checked,
        sameCDFilter: document.getElementById("sameCDFilter").checked
    }
    return filters
}

//Mark all Elements with at least one down-event
function markImportantElements() {
    let allElements = document.body.querySelectorAll("*");
    allElements.forEach((element) => {
        let isImportant = false
        let eventListeners = Object.values(getEventListeners(element))
        eventListeners.forEach((listener) => {
            if (listener[0].type === "mousedown" || listener[0].type === "pointerdown" || listener[0].type === "touchstart") isImportant = true
        })
        if (isImportant) element.classList.add("importantPointerCancellationElement")
    })
}

//Variable for checking if test has already been run once 
let runTest = false
function initiateTest() {
    chrome.devtools.inspectedWindow.eval(
        `(${markImportantElements})()`, (result, error) => {
            if (error) {
                console.error("Error:", error)
            } else {
                console.log("Successfully executed getImportantElements()")
            }
        }
    )
    if (!runTest) {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            files: ["./scripts/website_test.js"]
        }, () => {
            chrome.scripting.executeScript({
                target: { tabId: chrome.devtools.inspectedWindow.tabId },
                args: [getCheckboxValues(), getFilter(), getInputSpeed(), getColors()],
                func: (...args) => testWebsite(...args)
            }).then((results) => {
                //console.log("Successfully executed function initiateTest!")
                //console.log(results[0].result);

                const elementsWithDownEvents = results[0].result.elementsWithDownEvents
                const formsChanged = results[0].result.formsChanged
                const filteredDownEvents = results[0].result.filteredElements
                const problemDownEvents = results[0].result.problemElements
                const amountProblemDownEvents = results[0].result.problemElements.length
                const totalDownEvents = filteredDownEvents + problemDownEvents.length

                let resultNode = document.getElementById("results")
                let h3 = document.createElement("h3")

                if (elementsWithDownEvents === 0 || elementsWithDownEvents == undefined) {
                    h3.textContent = "Website does not have any down-events!"
                    resultNode.appendChild(h3)
                } else {
                    h3.textContent = `Website has ${elementsWithDownEvents} element${elementsWithDownEvents === 1 ? "" : "s"} causing a down-event.`
                    resultNode.appendChild(h3)

                    if (formsChanged) {
                        h4Forms = document.createElement("h4")
                        h4Forms.textContent = "Forms changed on this website"
                        h4Forms.style.color = "red"
                        resultNode.appendChild(h4Forms)
                    }

                    h4TotalAmount = document.createElement("h4")
                    h4TotalAmount.textContent = `There ${totalDownEvents === 1 ? "is" : "are"} ${totalDownEvents} observed down-event${totalDownEvents === 1 ? "" : "s"}`

                    let h4Filtered = document.createElement("h4")
                    h4Filtered.textContent = `${filteredDownEvents} down-event${filteredDownEvents === 1 ? " was" : "s were"} filtered`

                    let h4Remaining = document.createElement("h4")
                    h4Remaining.textContent = `${amountProblemDownEvents} down-event${amountProblemDownEvents === 1 ? " remains" : "s remain"}${amountProblemDownEvents === 0 ? "" : ":"}`

                    let ol = document.createElement("ol")
                    problemDownEvents.forEach((obj) => {
                        let li = document.createElement("li")
                        li.textContent = obj.problemElement
                        if (!obj.visibility) {
                            let boldText = document.createElement("b")
                            boldText.textContent = ' Note: Element has "display:none".'
                            li.appendChild(boldText)
                        }
                        ol.appendChild(li)
                    })

                    resultNode.appendChild(h4TotalAmount)
                    resultNode.appendChild(h4Filtered)
                    resultNode.appendChild(h4Remaining)
                    resultNode.appendChild(ol)
                }
            })
        })
        runTest = true
    }
}