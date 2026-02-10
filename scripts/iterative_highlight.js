async function iterativelyHighlightElements(highlightBackgroundColor, highlightBorderColor) {
    // Define various varibles
    let timeoutID
    let i = 0
    let aborted = false
    controller = new AbortController()
    const signal = controller.signal

    // Get various elements
    let downEvents = document.body.querySelectorAll("[data-downEventFinder-id]")
    let problemInfoBoxes = document.querySelectorAll('.problemInfoBox')
    let styleElement = document.getElementById("styleElementDownEventFinder")
    
    // Define the speed
    let speed = window.prompt("Enter the speed (milliseconds):", 1000)
    if (speed === null) return
    while (isNaN(speed)) {
        window.alert("Enter a valid number!")
        speed = window.prompt("Enter the speed (milliseconds):", 1000)
        if (speed === null) return
    }

    // Hides Problem Boxes and remove CSS for proper highlighting
    if (problemInfoBoxes) problemInfoBoxes.forEach((obj) => obj.style.display = "none")
    if (styleElement) styleElement.remove()

    // Iterate through elements
    await new Promise(resolve => {
        signal.addEventListener('abort', () => {
            clearTimeout(timeoutID)
            aborted = true
            resolve()
        })
        timeoutID = setTimeout(function highlightElements() {
            if (i > 0) removeStyling(downEvents[i - 1])
            let element = downEvents[i]
            element.style.backgroundColor = `${highlightBackgroundColor}`
            element.style.border = `4px solid ${highlightBorderColor}`
            element.style.transform = "scale(1.2)"
            element.scrollIntoView({ block: "center", inline: "center" })
            i++
            if (i < downEvents.length) timeoutID = setTimeout(highlightElements, speed)
            else resolve()
        }, 0)
    })
    if (!aborted) {
        // Wait until final element has been correctly highlighted before styling is removed
        await new Promise(resolve => timeoutID = setTimeout(() => {
            removeStyling(downEvents[i - 1])
            resolve()
        }, speed))
        window.alert("Finished highlighting elements!")
        return true
    }
}

function removeStyling(downEvent) {
    downEvent.style.border = ""
    downEvent.style.backgroundColor = ""
    downEvent.style.transform = ""
}

function abortHighlighting() {
    if (typeof controller !== 'undefined') {
        controller.abort()
        let downEvents = document.body.querySelectorAll("[data-downEventFinder-id]")
        downEvents.forEach(element => removeStyling(element))
    }
}