// Add event listeners to buttons
document.getElementById("initiateButton").addEventListener("click", getDownEventElements)
document.getElementById("slow").addEventListener("click", showTestingSpeed)
document.getElementById("checkAll").addEventListener("click", checkAllFilter)

// Functions for panel
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

// Get values from panel
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

let testRan = false
// Mark all Elements with at least one down-event
function getDownEventElements() {
    if (testRan) console.log("Test already ran!")
    else {
        chrome.devtools.inspectedWindow.eval(`(function(){
            let id = 1
            let downEvents = []
            let allElements = document.body.querySelectorAll("*")
            allElements.forEach((element) => {
                let eventListeners = [
                    ...Object.values(getEventListeners(element))
                        .flat()
                        .map(obj => obj["type"])
                        .filter(type => type === "mousedown" || type === "pointerdown" || type === "touchstart")
                ]
                if (eventListeners.length > 0) {
                    let elementId = 'DownEventsFinder-' + id
                    element.setAttribute("data-downEventsFinder-id", elementId)
                    downEvents.push({ downEvent: eventListeners, elementId: elementId})
                    id++
                }
            })
            return downEvents
        })()`, (result, error) => {
            if (error) {
                console.error("Error:", error)
            } else {
                console.log("Results:", result)
                initiateTest(result)
                testRan = true
            }
        })
    }
}

// Variable for checking if test has already been run once 
function initiateTest(downEvents) {
    chrome.scripting.executeScript({
        target: { tabId: chrome.devtools.inspectedWindow.tabId },
        files: ["./scripts/website_test.js"]
    }, () => {
        chrome.scripting.executeScript({
            target: { tabId: chrome.devtools.inspectedWindow.tabId },
            args: [getCheckboxValues(), getFilter(), getInputSpeed(), getColors(), downEvents],
            func: (...args) => testWebsite(...args)
        }).then((results) => {
            const elementsWithDownEvents = downEvents.length
            const formsChanged = results[0].result.formsChanged
            const filteredDownEvents = results[0].result.filteredElements
            const problemDownEvents = results[0].result.problemElements
            const amountProblemDownEvents = results[0].result.problemElements.length
            const totalDownEvents = filteredDownEvents.length + problemDownEvents.length

            console.log(filteredDownEvents)

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
                h4TotalAmount.textContent = `There ${totalDownEvents === 1 ? "was" : "were"} ${totalDownEvents} observed down-event${totalDownEvents === 1 ? "" : "s"}`

                let h4Filtered = document.createElement("h4")
                h4Filtered.textContent = `${filteredDownEvents.length} down-event${filteredDownEvents.length === 1 ? " was" : "s were"} filtered`

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
                    li.addEventListener("click", () => {
                        chrome.devtools.inspectedWindow.eval(`(function(){
                                const element = document.querySelector('[data-downEventsFinder-id=${obj.dataId}]')
                                inspect(element)
                                element.scrollIntoView()})()`, (result, error) => {
                            if (error) {
                                console.log(error)
                                window.alert("Element was not found in DOM!")
                            }
                        })
                    })
                    ol.appendChild(li)
                })
                resultNode.appendChild(h4TotalAmount)
                resultNode.appendChild(h4Filtered)
                resultNode.appendChild(h4Remaining)
                resultNode.appendChild(ol)
            }
        })
    })
}