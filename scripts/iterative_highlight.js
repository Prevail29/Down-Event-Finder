async function iterativelyHighlightElements(highlightBackgroundColor, highlightBorderColor) {
    let i = 0
    let downEvents = document.body.querySelectorAll("[data-downeventsfinder-id]")
    let problemInfoBoxes = document.querySelectorAll('.problemInfoBox')
    let styleElement = document.getElementById("sytleElementDownEventFinder")
    let speed = window.prompt("Enter the speed (milliseconds):", 1000)
    if (speed === null) return
    while (isNaN(speed)) {
        window.alert("Enter a valid number!")
        speed = window.prompt("Enter the speed (milliseconds):", 1000)
        if (speed === null) return
    }
    if (problemInfoBoxes) problemInfoBoxes.forEach((obj) => obj.style.display = "none")
    if (styleElement) styleElement.remove()
    await new Promise(resolve => setTimeout(function highlightElements() {
        if (i > 0) removeStyling(downEvents[i - 1])
        let element = downEvents[i]
        element.style.backgroundColor = `${highlightBackgroundColor}`
        element.style.outline = `4px solid ${highlightBorderColor}`
        element.style.transform = "scale(1.2)"
        element.scrollIntoView({ block: "center", inline: "center" })
        i++
        if (i < downEvents.length) setTimeout(highlightElements, speed)
        else resolve()
    }, 0))
    await new Promise(resolve => setTimeout(() => {
        removeStyling(downEvents[i - 1])
        resolve()
    }, speed))
    window.alert("Finished highlighting elements!")
}

function removeStyling(downEvent) {
    downEvent.style.outline = ""
    downEvent.style.backgroundColor = ""
    downEvent.style.transform = ""
}